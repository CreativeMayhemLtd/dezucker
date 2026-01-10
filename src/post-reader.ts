import { type RawPost, type FormattedPost, PostEntry, MediaEntry, type RawDataEntry, fromData, RawPostObject } from "./types";

export default class PostsReader {
  constructor() {
    // empty
  }

  private rawPosts: RawPostObject[] = [];
  private _sortBy: 'timestamp' | 'created_time' | 'text' | 'title' = 'timestamp';
  private _order: 'asc' | 'desc' = 'desc';

  // TODO: handle setting these in the web API and any validation goes here
  get sortBy(): 'timestamp' | 'created_time' | 'text' | 'title' {
    return this._sortBy;
  }

  set sortBy(value: 'timestamp' | 'created_time' | 'text' | 'title') {
    this._sortBy = value;
    this.updateSorting();
  }

  get order(): 'asc' | 'desc' {
    return this._order;
  }

  set order(value: 'asc' | 'desc') {
    this._order = value;
    this.updateSorting();
  }

  set sortAndOrder(values: { sortBy: 'timestamp' | 'created_time' | 'text' | 'title'; order: 'asc' | 'desc' }) {
    this._sortBy = values.sortBy;
    this._order = values.order;
    this.updateSorting();
  }

  get posts(): FormattedPost[] {
    return this.rawPosts.map(rp => rp as FormattedPost);
  }

  get totalPosts(): number {
    return this.rawPosts.length;
  }

  get sortDescriptor(): (a: RawPostObject, b: RawPostObject) => number {
    const sortBy = this.sortBy;
    const dir = this.order === 'asc' ? 1 : -1;

    return (a: RawPostObject, b: RawPostObject) => {
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
    };
  }

  private updateSorting(): void {
    this.rawPosts.sort(this.sortDescriptor);
  }

  public async initialize(): Promise<void> {
    const mod = await import("../data/your_posts.json", { assert: { type: "json" } });
    this.rawPosts = ((mod as any).default ?? mod).map((item: RawPost) => RawPostObject.fromData(item));
    this.updateSorting();
  }

  public async paginate(
    page = 1,
    pageSize = "20",
  ): Promise<{ page: number; pageSize: number; total: number; items: FormattedPost[] }> {

    let p = Math.floor(Number(page)) || 1;
    if (p < 1) p = 1;
    let ps = Number.isFinite(Number(pageSize)) ? Math.floor(Number(pageSize)) : 20;
    if (ps < 1) ps = 1;

    let start = (p - 1) * ps;
    if (!Number.isFinite(start) || start < 0) start = this.rawPosts.length;
    const end = start + ps;

    const slice = this.rawPosts.slice(start, end);
    const items = slice.map((it) => it.formatted); // TODO: implement property for formatting on post types

    return { page: p, pageSize: ps, total: this.rawPosts.length, items };
  }
}
