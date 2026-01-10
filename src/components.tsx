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
          body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:16px}
          header{display:flex;align-items:center;gap:12px}
          .controls{margin:12px 0}
          .post{padding:8px;border-bottom:1px solid #eee}
          .meta{color:#666;font-size:12px}
          .badge{display:inline-block;background:#eef;padding:2px 6px;border-radius:4px;margin-right:6px;font-size:12px;color:#024}
          .when{margin-right:8px;color:#666;font-size:12px}
          a{margin-right:8px}
        `}</style>
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
export function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

/**
 * Renders a post card with its metadata.
 */
export function PostCard({ post, when, key }: { post: FormattedPost; when: string; key?: string | number }) {
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
  if (post.hasPostData) badges.push(<Badge label="post-data" />);
  if (post.attachmentsCount && post.attachmentsCount > 0) {
    badges.push(<Badge label={`attachments:${post.attachmentsCount}`} />);
  }
  if (post.fragments && post.fragments.length > 0) {
    badges.push(<Badge label={`entries: ${post.fragments.length}`} />);
  }
  if (post.tags && post.tags.length > 0) {
    badges.push(<Badge label={`people: ${post.tags.join(", ")}`} />);
  }

  const meta = (
    <div className="meta">
      {when && <span className="when">{when}</span>}
      {badges}
    </div>
  );

  return (
    <article className="post">
      {body}
      {meta}
    </article>
  );
}
