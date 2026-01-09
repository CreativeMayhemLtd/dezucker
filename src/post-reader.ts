import type { RawPost, FormattedPost } from "./types";

export default class PostsReader {
  // TODO: implement actual data and properties instead of just namespacing static methods

  /**
   * Load the JSON data using an import assertion (works in Bun/Esm).
   */
  static async load(): Promise<RawPost[]> {
    const mod = await import("../data/your_posts.json", { assert: { type: "json" } });
    // JSON modules are usually available on `default`
    return (mod as any).default ?? mod;
  }

  /**
   * Return paginated results and some metadata.
   *
   * sortBy: 'timestamp'|'created_time'|'text'|'title'
   * order: 'asc'|'desc'
   */
  static async paginate(
    page = 1,
    pageSize = "20",
    sortBy: 'timestamp' | 'created_time' | 'text' | 'title' = 'timestamp',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<{ page: number; pageSize: number; total: number; items: FormattedPost[] }>{
    let all = await this.load();
    const total = Array.isArray(all) ? all.length : 0;

    if (Array.isArray(all)) {
      all = this.sortPosts(all, sortBy, order);
    }

    // handle crazy numbers safely, but simply
    let p = Math.floor(Number(page)) || 1;
    if (p < 1) p = 1;
    let ps = Number.isFinite(Number(pageSize)) ? Math.floor(Number(pageSize)) : 20;
    if (ps < 1) ps = 1;

    let start = (p - 1) * ps;
    if (!Number.isFinite(start) || start < 0) start = total;
    const end = start + ps;

    const slice = Array.isArray(all) ? all.slice(start, end) : [];
    const items = slice.map((it) => this.formatItem(it));
    return { page: p, pageSize: ps, total, items };
  }

  /**
   * Sort raw posts in-place (returns new array reference) based on field.
   */
  static sortPosts(
    posts: RawPost[],
    sortBy: 'timestamp' | 'created_time' | 'text' | 'title',
    order: 'asc' | 'desc'
  ): RawPost[] {
    const dir = order === 'asc' ? 1 : -1;

    // copy to avoid mutating original loaded array
    const copy = posts.slice();

    copy.sort((a, b) => {
      const getNumeric = (p: RawPost) => {
        // prefer explicit timestamp, then created_time, then first data.update_timestamp
        if (typeof p.timestamp === 'number') return p.timestamp;
        if (typeof p.created_time === 'number') return p.created_time;
        if (Array.isArray(p.data)) {
          for (const d of p.data) {
            if (typeof d.update_timestamp === 'number') return d.update_timestamp;
          }
        }
        return 0;
      };

      if (sortBy === 'timestamp' || sortBy === 'created_time') {
        const na = getNumeric(a);
        const nb = getNumeric(b);
        return (na - nb) * dir;
      }

      const getText = (p: RawPost) => {
        if (sortBy === 'title' && typeof p.title === 'string') return p.title;
        // text: attempt to extract a post string from data[]
        if (Array.isArray(p.data)) {
          for (const d of p.data) {
            if (typeof d.post === 'string' && d.post.length > 0) return d.post;
          }
        }
        // fallback to title or empty
        return p.title ?? '';
      };

      const sa = String(getText(a)).toLowerCase();
      const sb = String(getText(b)).toLowerCase();
      if (sa < sb) return -1 * dir;
      if (sa > sb) return 1 * dir;
      return 0;
    });

    return copy;
  }

  static async count(): Promise<number> {
    const all = await this.load();
    return Array.isArray(all) ? all.length : 0;
  }

  static formatItem(item: RawPost): FormattedPost {
    const id = item?.id ?? null;

    // preserve numeric timestamp(s) as-is on the formatted object
    const created = item?.created_time ?? item?.created ?? item?.timestamp ?? null;

    // Explicit text extraction from known string fields only (do NOT coerce numbers)
    let text = "";
    // prefer `data[].post` entries
    if (Array.isArray(item.data)) {
      for (const d of item.data) {
        if (d && typeof d.post === 'string' && d.post.trim().length > 0) {
          text = d.post.trim();
          break;
        }
      }
    }
    // fallback to title if present and no data[].post was found
    if (!text && typeof item.title === 'string') {
      text = item.title.trim();
    }

    // Attachments
    let attachmentsCount = 0;
    if (Array.isArray(item.attachments)) {
      // attachments is an array of Attachment; some attachments include a `data` array
      for (const a of item.attachments) {
        if (a && Array.isArray((a as any).data)) attachmentsCount += (a as any).data.length;
      }
    }
    const hasAttachments = attachmentsCount > 0;

    // Post data flag
    const hasPostData = Array.isArray(item.data) && item.data.length > 0;

    // Tags: include only tags with a `name` field that is a string
    const tags: string[] = Array.isArray(item.tags)
      ? item.tags.filter((t) => t && typeof t.name === 'string').map((t) => (t as any).name)
      : [];

    // TODO: Add richer rendering for nested `post.post.body` here if desired later.

    return {
      id,
      text,
      created_time: created,
      hasPostData,
      hasAttachments,
      attachmentsCount,
      tags,
    };
  }
}
