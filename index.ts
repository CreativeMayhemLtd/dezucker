import PostsReader from "./src/post-reader";

// TODO: Make a real service and inject it
const port = Number(process.env.PORT || 3000);

console.log(`Starting Bun server on http://localhost:${port}`);

function escapeHtml(s: string) {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function formatDateValue(v: any) {
	if (v == null) return "";
	let d: Date | null = null;
	if (typeof v === "number") {
		d = v < 1e12 ? new Date(v * 1000) : new Date(v);
	} else if (/^\d+$/.test(String(v))) {
		const n = Number(v);
		d = n < 1e12 ? new Date(n * 1000) : new Date(n);
	} else {
		const parsed = new Date(String(v));
		d = isNaN(parsed.getTime()) ? null : parsed;
	}
	if (!d) return "";
	return d.toLocaleString();
}

await Bun.serve({
    // TODO: Make this a type
	port,
	async fetch(req) {
		const url = new URL(req.url);
		const pathname = url.pathname;

		if (pathname === "/posts") {
			const page = Number(url.searchParams.get("page") || "1");
			const pageSize = url.searchParams.get("pageSize") || "20";
			const sortBy = (url.searchParams.get("sort") as any) || "timestamp";
			const order = (url.searchParams.get("order") as any) || "asc";
			const data = await PostsReader.paginate(page, pageSize, sortBy, order);
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

			const { items, total } = await PostsReader.paginate(page, pageSize, sortBy, order);

			const base = (p: number) => `/?page=${p}&pageSize=${pageSize}&sort=${encodeURIComponent(
				sortBy
			)}&order=${encodeURIComponent(order)}`;

			const prevLink = page > 1 ? `<a href="${base(page - 1)}">Prev</a>` : "";
			const nextLink = (page * psNum) < total ? `<a href="${base(page + 1)}">Next</a>` : "";

			const sortToggle = order === "asc" ? "desc" : "asc";
			const sortToggleLink = `/?page=1&pageSize=${pageSize}&sort=timestamp&order=${sortToggle}`;

			// quick presets for pageSize
			const presets = [5,10,20,50];
			const presetLinks = presets.map(s => `<a href="/?page=1&pageSize=${s}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(order)}">${s}</a>`).join(' | ');

			const postsHtml = items
				.map((it) => {
					const body = escapeHtml(it.text || "").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>");
					const when = it.created_time ? escapeHtml(String(formatDateValue(it.created_time))) : "";
					const badges: string[] = [];
					if (it.hasPostData) badges.push('<span class="badge">post-data</span>');
					if (it.attachmentsCount && it.attachmentsCount > 0) badges.push(`<span class="badge">attachments:${it.attachmentsCount}</span>`);
					if (Array.isArray(it.tags) && it.tags.length) badges.push(`<span class="badge">people: ${escapeHtml(it.tags.join(', '))}</span>`);
					const meta = [when ? `<span class="when">${when}</span>` : "", badges.join(' ')].filter(Boolean).join(' ');
					return `<article class="post"><p>${body}</p>${meta ? `<div class="meta">${meta}</div>` : ""}</article>`;
				})
				.join("\n");

                // TODO: proper templating engine use
			const html = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1" />
		<title>FB Reader — Posts</title>
		<style>
			body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:16px}
			header{display:flex;align-items:center;gap:12px}
			.controls{margin:12px 0}
				.post{padding:8px;border-bottom:1px solid #eee}
				.meta{color:#666;font-size:12px}
				.badge{display:inline-block;background:#eef;padding:2px 6px;border-radius:4px;margin-right:6px;font-size:12px;color:#024}
				.when{margin-right:8px;color:#666;font-size:12px}
			a{margin-right:8px}
		</style>
	</head>
	<body>
		<header><h1>FB Reader — Posts</h1></header>
		<div class="controls">
				${prevLink} ${nextLink}
				<span>Page ${page} — showing ${items.length} of ${total}</span>
				<span style="margin-left:12px"><a href="${sortToggleLink}">Toggle sort (${order === "asc" ? "oldest" : "newest"})</a></span>
				<span style="margin-left:12px">Per page: ${presetLinks}</span>
				<form method="get" style="display:inline-block;margin-left:8px;vertical-align:middle">
					<input type="hidden" name="page" value="1" />
					<input type="hidden" name="sort" value="${escapeHtml(String(sortBy))}" />
					<input type="hidden" name="order" value="${escapeHtml(String(order))}" />
					<label> <input type="number" name="pageSize" min="1" value="${escapeHtml(String(pageSize))}" style="width:64px"/> </label>
					<button type="submit">Go</button>
				</form>
		</div>
		<main>
			${postsHtml}
		</main>
	</body>
</html>`;

			return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
		}

        return new Response("Not found; did you place the right file in the data/ directory? See README.md", { status: 404 });
	},
});