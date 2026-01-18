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

interface PersonRecordPageProps {
  name: string;
  urls?: string[];
}

/**
 * Page component for viewing and editing a person's record.
 */
export function PersonRecordPage({ name, urls = [] }: PersonRecordPageProps) {
  return (
    <Layout title={name}>
      <div className="controls">
        <a href="/">Back to Posts</a>
        <span style="margin-left:20px; font-weight:bold">{name}</span>
      </div>

      <main style="background:#fff; padding:20px; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.1)">
        <div className="toolbar" style="margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid #ebedf0">
          <button 
            onclick={`addUrlToPerson('${name.replace(/'/g, "\\'")}')`}
            style="padding:8px 16px; background:#1877f2; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer"
          >
            + URL
          </button>
        </div>

        <section>
          <h4>Stored URLs</h4>
          {urls.length === 0 ? (
            <p style="color:#65676b; font-style:italic">No URLs associated with this person yet.</p>
          ) : (
            <ul style="list-style:none; padding:0">
              {urls.map((url, i) => (
                <li key={i} style="margin-bottom:8px; padding:8px; background:#f0f2f5; border-radius:6px">
                  <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Layout>
  );
}

/**
 * Renders the full HTML for the person record page.
 */
export function renderPersonRecordPage(props: PersonRecordPageProps): string {
  return `<!doctype html>\n${render(<PersonRecordPage {...props} />)}`;
}
