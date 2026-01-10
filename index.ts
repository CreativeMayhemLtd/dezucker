import PostsReader from "./src/post-reader";
import { renderPostsPage } from "./src/views.tsx";

// TODO: Make a real service and inject it
const port = Number(process.env.PORT || 3000);

console.log(`Starting Bun server on http://localhost:${port}`);

Bun.serve({
    // TODO: Make this a type
	port,
	async fetch(req) {
		const url = new URL(req.url);
		const pathname = url.pathname;
		const postReader = new PostsReader();
		await postReader.initialize();

		if (pathname === "/health") {
			return new Response("OK", { status: 200 }); // TODO: handle postreader health check
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