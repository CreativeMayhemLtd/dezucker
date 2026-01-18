import PostsReader from "./src/post-reader";
import { renderPostsPage, renderPersonRecordPage } from "./src/views.tsx";
import { pluginRegistry } from "./src/plugins/registry";
// TODO: manage this in another file we import here
import { internalJsonPlugin } from "./src/plugins/internal-json";
import { markdownExportPlugin } from "./src/plugins/markdown-export";
import { ExportOrchestrator } from "./src/plugins/orchestrator";
import { storageFactory } from "./src/types.ts";
// Register default internal plugins
pluginRegistry.register(internalJsonPlugin);
pluginRegistry.register(markdownExportPlugin);

// Inject plugin database collection keys into storage factory
const storage = await storageFactory(pluginRegistry.pluginDatabaseCollectionKeys);
const postReader = new PostsReader(storage);
await postReader.initialize();

const exportOrchestrator = new ExportOrchestrator(storage);

const dezuckerPersistedMetadata: { version: number }[] = await storage.dataFor("dezucker");
let currentVersion = dezuckerPersistedMetadata[dezuckerPersistedMetadata.length - 1]?.version || 0;
// TODO: inject storage into another function that builds the above and manages the below
if (currentVersion < 1) {
	await storage.push("dezucker", { version: 1 });
}

// TODO: Make a real service and inject it
const port = Number(process.env.PORT || 3000);

console.log(`Starting Bun server on http://localhost:${port}`);

Bun.serve({
    // TODO: Make this a type
	port,
	async fetch(req) {
		const url = new URL(req.url);
		const pathname = url.pathname;

		if (pathname === "/health") {
			return new Response("OK", { status: 200 }); // TODO: handle postreader health check
		}

		if (pathname === "/plugins") {
			return new Response(JSON.stringify(pluginRegistry.listPlugins()), {
				headers: { "Content-Type": "application/json" },
			});
		}

		if (pathname.startsWith("/data/")) {
			const file = Bun.file(pathname.substring(1));
			if (await file.exists()) {
				return new Response(file);
			}
			return new Response("Media not found", { status: 404 });
		}

		if (pathname === "/posts") {
			const page = Number(url.searchParams.get("page") || "1");
			const pageSize = url.searchParams.get("pageSize") || "20";
			const sortBy = (url.searchParams.get("sort") as any) || "timestamp";
			const order = (url.searchParams.get("order") as any) || "asc";
			postReader.sortAndOrder = { sortBy, order };
			const data = await postReader.paginate(page, pageSize);
			return new Response(JSON.stringify(data), {
				headers: { "Content-Type": "application/json" },
			});
		}

		if (pathname === "/person") {
			const name = url.searchParams.get("name");
			if (!name) return new Response("Missing name", { status: 400 });

			const people = await storage.dataFor("people");
			const person = people.find(p => p.name === name);

			if (!person) return new Response("Person not found", { status: 404 });

			const html = renderPersonRecordPage({
				name: person.name,
				urls: person.urls || []
			});

			return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
		}

		if (pathname === "/api/person" && req.method === "GET") {
			const name = url.searchParams.get("name");
			if (!name) return new Response(JSON.stringify({ success: false, error: "Missing name" }), { status: 400 });

			const people = await storage.dataFor("people");
			const person = people.find(p => p.name === name);

			if (!person) return new Response(JSON.stringify({ success: false, error: "Person not found" }), { status: 404 });

			return new Response(JSON.stringify(person), {
				headers: { "Content-Type": "application/json" },
			});
		}

		if (pathname === "/api/person/url" && req.method === "POST") {
			try {
				const { name, url } = await req.json();
				if (!name || !url) {
					return new Response(JSON.stringify({ success: false, error: "Missing name or url" }), { status: 400 });
				}

				await storage.update("people", (people) => {
					const person = people.find(p => p.name === name);
					if (person) {
						if (!Array.isArray(person.urls)) {
							person.urls = [];
						}
						person.urls.push(url);
					} else {
						// Should not happen if data ingress is working, but for robustness:
						people.push({ name, urls: [url] });
					}
				});

				return new Response(JSON.stringify({ success: true }), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (err: any) {
				return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
			}
		}

		if (pathname === "/export" && req.method === "POST") {
			try {
				const body = await req.json();
				// @ts-ignore
				const { pluginSlug, postIds, config } = body;

				if (!pluginSlug) {
					return new Response("Missing pluginSlug", { status: 400 });
				}

				let postsToExport = postReader.posts;
				if (postIds && Array.isArray(postIds)) {
					const idSet = new Set(postIds.map(String));
					postsToExport = postsToExport.filter(p => p.id && idSet.has(String(p.id)) || idSet.has(String(p.timestamp)));
				}

				await exportOrchestrator.exportBatch(pluginSlug, postsToExport, config);

				return new Response(JSON.stringify({ 
					success: true, 
					count: postsToExport.length,
					message: `Exported ${postsToExport.length} posts using ${pluginSlug}`
				}), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (err: any) {
				return new Response(JSON.stringify({ 
					success: false, 
					error: err.message 
				}), { status: 500, headers: { "Content-Type": "application/json" } });
			}
		}

		if (pathname === "/" || pathname === "/index.html") {
			const page = Number(url.searchParams.get("page") || "1");
			const pageSize = url.searchParams.get("pageSize") || "10";
			const psNum = Number(pageSize);
			if (!Number.isFinite(psNum) || psNum < 1) {
				return new Response("Invalid pageSize parameter", { status: 400 });
			}
			const sortBy = (url.searchParams.get("sort") as any) || "timestamp";
			const order = (url.searchParams.get("order") as any) || "asc"; // oldest-first default

			postReader.sortAndOrder = { sortBy, order };
			const { items, total } = await postReader.paginate(page, pageSize);

			const html = renderPostsPage({
				page,
				pageSize,
				sortBy,
				order,
				items,
				total
			});

			return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
		}

        return new Response("Not found; did you place the right file in the data/ directory? See README.md", { status: 404 });
	},
});