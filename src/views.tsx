/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment, render } from "./renderer.tsx";
import { Layout, PostCard } from "./components.tsx";
import type { FormattedPost } from "./types.tsx";

/**
 * Helper to format a timestamp into a local string.
 */
function formatDateValue(v: any): string {
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

interface PostsPageProps {
  page: number;
  pageSize: string | number;
  sortBy: string;
  order: string;
  items: FormattedPost[];
  total: number;
}

/**
 * Main component for the posts list page.
 */
export function PostsPage({ page, pageSize, sortBy, order, items, total }: PostsPageProps) {
  const psNum = Number(pageSize);
  const base = (p: number) => `/?page=${p}&pageSize=${pageSize}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(order)}`;
  
  const sortToggle = order === "asc" ? "desc" : "asc";
  const sortToggleLink = `/?page=1&pageSize=${pageSize}&sort=timestamp&order=${sortToggle}`;
  
  const presets = [5, 10, 20, 50];

  return (
    <Layout title="FB Reader — Posts">
      <div className="controls">
        {page > 1 && <a href={base(page - 1)}>Prev</a>}
        {(page * psNum) < total && <a href={base(page + 1)}>Next</a>}
        
        <span>Page {page} — showing {items.length} of {total}</span>
        
        <span style="margin-left:12px">
          <a href={sortToggleLink}>Toggle sort ({order === "asc" ? "oldest" : "newest"})</a>
        </span>
        
        <span style="margin-left:12px">
          Per page: {presets.map((s, i) => (
            <span key={s}>
              <a href={`/?page=1&pageSize=${s}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(order)}`}>{s}</a>
              {" | "}
            </span>
          ))}
          <a href={`/?page=1&pageSize=${total}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(order)}`}>All</a>
        </span>
        
        <form method="get" style="display:inline-block;margin-left:8px;vertical-align:middle">
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="sort" value={String(sortBy)} />
          <input type="hidden" name="order" value={String(order)} />
          <label>
            <input type="number" name="pageSize" min="1" value={String(pageSize)} style="width:64px" />
          </label>
          <button type="submit">Go</button>
        </form>
      </div>
      
      <main>
        {items.map((it) => (
          <PostCard 
            key={String(it.id || it.timestamp)} 
            post={it} 
            when={it.timestamp ? formatDateValue(it.timestamp) : ""} 
          />
        ))}
      </main>
    </Layout>
  );
}

/**
 * Renders the full HTML for the posts page.
 */
export function renderPostsPage(props: PostsPageProps): string {
  return `<!doctype html>\n${render(<PostsPage {...props} />)}`;
}
