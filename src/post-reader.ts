import { type RawPost, type FormattedPost, PostData, type PostDataEntry, type RawDataEntry, fromData, RawPostObject } from "./types";

export default class PostsReader {
  // TODO: implement actual data and properties instead of just namespacing static methods

  constructor() {
    // no instance properties for now
  }

  public rawPosts: RawPostObject[] = [];

  public async initialize(): Promise<void> {
    // no initialization needed for now
    const mod = await import("../data/your_posts.json", { assert: { type: "json" } });
    
  }

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
      const objA = RawPostObject.fromData(a);
      const objB = RawPostObject.fromData(b);
      if (sortBy === 'timestamp' || sortBy === 'created_time') {
        const na = objA.relevantTimestamp;
        const nb = objB.relevantTimestamp;
        return (na - nb) * dir;
      }

      if (sortBy === 'title') {
        const ta = typeof objA.title === 'string' ? objA.title : '';
        const tb = typeof objB.title === 'string' ? objB.title : '';
        const sa = ta.toLowerCase();
        const sb = tb.toLowerCase();
        if (sa < sb) return -1 * dir;
        if (sa > sb) return 1 * dir;
        return 0;
      }
      const sa = objA.text ? String(objA.text).toLowerCase() : '';
      const sb = objB.text ? String(objB.text).toLowerCase() : '';
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

  static textFromPostData(data: RawDataEntry): string | null {
    const postData = fromData(data);
    if (!postData.isPostData()) return null;
    return postData.post ?? null;
  }

  static formatItem(item: RawPost): FormattedPost {
    const objItem = RawPostObject.fromData(item);
    const id = objItem.id ?? null;

    // preserve numeric timestamp(s) as-is on the formatted object
    const created = objItem.relevantTimestamp;

    // Explicit text extraction from known string fields only (do NOT coerce numbers)
    let text = objItem.text ? objItem.text : "";

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
