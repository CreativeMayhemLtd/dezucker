/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from "./renderer.tsx";
import type { FormattedPost, PostFragment } from "./types.tsx";
import { pluginRegistry } from "./plugins/registry";

/**
 * Base layout component for the FB Reader.
 */
export function Layout({ title, children }: { title: string; children?: any }) {
  const plugins = pluginRegistry.listPlugins();

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{title}</title>
        <style>{`
          body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:16px;background:#f0f2f5;color:#1c1e21}
          header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
          .header-left{display:flex;align-items:center;gap:12px}
          .controls{margin:12px 0;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.1)}
          .post{background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.1);margin-bottom:16px;width:50%;min-width:640px}
          .post p{margin:0 0 12px;line-height:1.5}
          .meta{border-top:1px solid #ebedf0;padding-top:12px;margin-top:12px;color:#65676b;font-size:12px}
          .badge{display:inline-block;background:#e4e6eb;padding:4px 8px;border-radius:6px;margin-right:8px;font-size:12px;color:#050505;font-weight:600}
          .badge.clickable{cursor:pointer;background:#e7f3ff;color:#1877f2}
          .badge.clickable:hover{background:#dbeafe}
          .when{margin-right:12px;color:#65676b;font-size:12px}
          .debug-json{display:none;background:#1c1e21;color:#e4e6eb;padding:16px;border-radius:8px;margin:12px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,liberation mono,courier new,monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap;border:1px solid #3e4042}
          .media-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:12px 0;max-width:80%}
          .media-item{width:100%;border-radius:8px;overflow:hidden;border:1px solid #ebedf0}
          .media-item img{width:100%;height:auto;display:block;object-fit:cover}
          a{color:#1877f2;text-decoration:none}
          a:hover{text-decoration:underline}
          select{padding:4px 8px;border-radius:6px;border:1px solid #ddd}
        `}</style>
        <script>{`
          function toggleDebug(id) {
            const el = document.getElementById(id);
            if (el) {
              const isHidden = window.getComputedStyle(el).display === 'none';
              el.style.display = isHidden ? 'block' : 'none';
            }
          }

          async function exportPost(postId) {
            const selector = document.getElementById('plugin-selector');
            const pluginSlug = selector ? selector.value : 'internal-json';
            
            try {
              const response = await fetch('/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pluginSlug,
                  postIds: [postId],
                  config: { targetDirectory: 'exports' }
                })
              });
              
              const result = await response.json();
              if (result.success) {
                alert('Export successful: ' + result.message);
              } else {
                alert('Export failed: ' + result.error);
              }
            } catch (err) {
              alert('Export failed: ' + err.message);
            }
          }
        `}</script>
      </head>
      <body>
        <header>
          <div className="header-left">
            <h1>{title}</h1>
          </div>
          <div className="header-right">
            <label htmlFor="plugin-selector" style="margin-right: 8px; font-size: 14px">Export Method:</label>
            <select id="plugin-selector">
              {plugins.map(p => (
                <option value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

/**
 * Reusable badge component.
 */
export function Badge({ label, targetId }: { label: string; targetId?: string }) {
  if (targetId) {
    return (
      <span 
        className="badge clickable" 
        onclick={`toggleDebug('${targetId}')`}
      >
        {label}
      </span>
    );
  }
  return <span className="badge">{label}</span>;
}

/**
 * Renders a single image with a container.
 */
export function MediaImage({ uri, alt, key }: { uri: string; alt?: string; key?: any }) {
  return (
    <div className="media-item">
      <img src={uri} alt={alt || "Media attachment"} loading="lazy" />
    </div>
  );
}

/**
 * Renders a grid of media items.
 */
export function MediaGallery({ items }: { items: { uri: string; alt?: string }[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="media-gallery">
      {items.map((item, i) => (
        <MediaImage key={i} uri={item.uri} alt={item.alt} />
      ))}
    </div>
  );
}

/**
 * Renders a post card with its metadata.
 */
export function PostCard({ post, when, key }: { post: FormattedPost; when: string; key?: any }) {
  const postId = `post-${post.timestamp || Math.random().toString(36).substring(7)}`;
  
  const body = (post.text || "")
    .split("\n\n")
    .map((p, i) => (
      <p key={i}>
        {p.split("\n").map((line, j) => (
          <Fragment key={j}>
            {line}
            {j < p.split("\n").length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    ));

  const badges = [];
  const debugBlocks = [];
  const mediaItems: { uri: string; alt?: string }[] = [];

  // Main post debug block
  if (post._raw) {
    debugBlocks.push(
      <pre id={postId} className="debug-json">
        {JSON.stringify(post._raw, null, 2)}
      </pre>
    );
  }

  if (post.attachmentsCount && post.attachmentsCount > 0) {
    badges.push(<Badge label={`attachments:${post.attachmentsCount}`} targetId={post._raw ? postId : undefined} />);
  }
  
  if (post.fragments && post.fragments.length > 0) {
    badges.push(<Badge label={`entries:${post.meaningfulEntriesCount}`} targetId={post._raw ? postId : undefined} />);
    
    post.fragments.forEach((frag, idx) => {
      if (frag.webUri && frag.isPhoto) {
        mediaItems.push({ uri: frag.webUri, alt: frag.text });
      }
      if (frag._raw) {
        const fragId = `${postId}-frag-${idx}`;
        debugBlocks.push(
          <pre id={fragId} className="debug-json">
            {JSON.stringify(frag._raw, null, 2)}
          </pre>
        );
        // We could optionally add more badges here if we wanted to toggle specific fragments,
        // but for now let's stick to the main post toggle for the entries badge.
      }
    });
  }

  if (post.attachmentMedia && post.attachmentMedia.length > 0) {
    post.attachmentMedia.forEach((media) => {
      if (media.webUri && media.isPhoto) {
        mediaItems.push({ uri: media.webUri });
      }
    });
  }

  if (post.tags && post.tags.length > 0) {
    badges.push(<Badge label={`people:${post.tags.join(", ")}`} />);
  }

  const exportId = String(post.id || post.timestamp);
  badges.push(
    <span 
      className="badge clickable" 
      style="background: #1877f2; color: #fff"
      onclick={`exportPost('${exportId}')`}
    >
      Export
    </span>
  );

  const meta = (
    <div className="meta">
      {when && <span className="when">{when}</span>}
      {badges}
      {debugBlocks}
    </div>
  );

  return (
    <article className="post">
      {body}
      <MediaGallery items={mediaItems} />
      {meta}
    </article>
  );
}
