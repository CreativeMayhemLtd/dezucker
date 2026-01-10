/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from "./renderer.tsx";
import type { FormattedPost } from "./types.tsx";

/**
 * Base layout component for the FB Reader.
 */
export function Layout({ title, children }: { title: string; children?: any }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{title}</title>
        <style>{`
          body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:16px;background:#f0f2f5;color:#1c1e21}
          header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
          .controls{margin:12px 0;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.1)}
          .post{background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.1);margin-bottom:16px}
          .post p{margin:0 0 12px;line-height:1.5}
          .meta{border-top:1px solid #ebedf0;padding-top:12px;margin-top:12px;color:#65676b;font-size:12px}
          .badge{display:inline-block;background:#e4e6eb;padding:4px 8px;border-radius:6px;margin-right:8px;font-size:12px;color:#050505;font-weight:600}
          .badge.clickable{cursor:pointer;background:#e7f3ff;color:#1877f2}
          .badge.clickable:hover{background:#dbeafe}
          .when{margin-right:12px;color:#65676b;font-size:12px}
          .debug-json{display:none;background:#1c1e21;color:#e4e6eb;padding:16px;border-radius:8px;margin:12px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,liberation mono,courier new,monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap;border:1px solid #3e4042}
          a{color:#1877f2;text-decoration:none}
          a:hover{text-decoration:underline}
        `}</style>
        <script>{`
          function toggleDebug(id) {
            const el = document.getElementById(id);
            if (el) {
              const isHidden = window.getComputedStyle(el).display === 'none';
              el.style.display = isHidden ? 'block' : 'none';
            }
          }
        `}</script>
      </head>
      <body>
        <header>
          <h1>{title}</h1>
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
 * Renders a post card with its metadata.
 */
export function PostCard({ post, when, key }: { post: FormattedPost; when: string; key?: string | number }) {
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

  if (post.tags && post.tags.length > 0) {
    badges.push(<Badge label={`people:${post.tags.join(", ")}`} />);
  }

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
      {meta}
    </article>
  );
}
