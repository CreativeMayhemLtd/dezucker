// TODO: some of this can be discovered at runtime from the data itself, but some hard types are useful for 
// recognition and shape. Implement that dynamic stuff at some point and instead use this kind of stuff to
// inform the shape the reader recognizes / outputs.

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Place {
  name?: string;
  coordinate?: Coordinate;
  address?: string;
  url?: string;
}

export interface AttachmentData {
  place?: Place;
  external_context?: {
    url?: string;
  };
  // some entries include arbitrary fields like `update_timestamp` for edits, etc.
  update_timestamp?: number;
}

export interface Attachment {
  data?: AttachmentData[];
}

export interface Tag {
  name?: string;
}

export interface RawDataEntry {
  creation_timestamp?: number;
  update_timestamp?: number;
  uri?: string;
  description?: string;
}

export interface PostDataEntry extends RawDataEntry {
  post?: string;
}

export interface PhotoPostDataEntry extends RawDataEntry {
  media?: PhotoPostDataMedia;
}

export interface PhotoPostDataMedia {
    uri?: string;
    creation_timestamp?: number;
    update_timestamp?: number;
    media_metadata?: PostMediaMetadata;
}

export interface PostMediaMetadata {
  photo_metadata?: PhotoPostMediaMetadata;
}

export interface PhotoPostMediaData {
  uri?: string;
  creation_timestamp?: number;
  update_timestamp?: number;
}

export interface PhotoPostMediaMetadata {
  exif_data?: Record<string, any>[];
}

export interface RawPost {
  timestamp?: number;
  title?: string;
  data?: RawDataEntry[];
  attachments?: Attachment[];
  tags?: Tag[];
  // other optional fields occasionally appear in the dump
  created_time?: string | number;
  created?: string | number;
  id?: string | number;
}

export class RawPostObject implements RawPost {
  constructor(post: RawPost) {
    Object.assign(this, post);
  }

  timestamp?: number;
  title?: string;
  data?: RawDataEntry[];
  attachments?: Attachment[];
  tags?: Tag[];
  created_time?: string | number;
  created?: string | number;
  id?: string | number;

  get text(): string | null {
    if (Array.isArray(this.data)) {
      for (const d of this.data) {
        const postData = fromData(d);
        if (postData.isPostData() && typeof postData.post === 'string' && postData.post.trim().length > 0) {
          return postData.post.trim();
        }
      }
    }
    return null;
  }

  get dataObjects(): DataClassTypes[] | null {
    if (Array.isArray(this.data)) {
      return this.data.map(d => fromData(d));
    }
    return null;
  }

  get relevantTimestamp(): number {
    if (typeof this.timestamp === 'number') {
      return this.timestamp;
    }
    if (typeof this.created_time === 'number') {
      return this.created_time;
    }
    if (typeof this.created === 'number') {
      return this.created;
    }
    if (Array.isArray(this.data)) {
      for (const d of this.data) {
        const dataObj = fromData(d);
        // todo: determine if the first one is the right choice?
        return dataObj.relevantTimestamp
      }
    }
    return 0;
  }

  get dataCount(): number {
    const all = this.data;
    return Array.isArray(all) ? all.length : 0;
  }

  
  public get formatted(): FormattedPost {
    const id = this.id ?? null;

    // preserve numeric timestamp(s) as-is on the formatted object
    const created = this.relevantTimestamp;

    // Explicit text extraction from known string fields only (do NOT coerce numbers)
    let text = this.text ? this.text : "";

    // fallback to title if present and no data[].post was found
    if (!text && typeof this.title === 'string') {
      text = this.title.trim();
    }

    // Attachments
    let attachmentsCount = 0;
    if (Array.isArray(this.attachments)) {
      // attachments is an array of Attachment; some attachments include a `data` array
      for (const a of this.attachments) {
        if (a && Array.isArray((a as any).data)) attachmentsCount += (a as any).data.length;
      }
    }
    const hasAttachments = attachmentsCount > 0;

    // Post data flag
    const hasPostData = Array.isArray(this.data) && this.data.length > 0;

    // Tags: include only tags with a `name` field that is a string
    const tags: string[] = Array.isArray(this.tags)
      ? this.tags.filter((t) => t && typeof t.name === 'string').map((t) => (t as any).name)
      : [];

    // TODO: Add richer rendering for nested `post.post.body` here if desired later.

    return {
      id,
      text,
      timestamp: created,
      hasPostData,
      hasAttachments,
      attachmentsCount,
      tags,
    };
  }

  static fromData(post: RawPost): RawPostObject {
    return new RawPostObject(post);
  }
}

export interface FormattedPost {
  id?: string | number | null;
  text: string;
  timestamp?: string | number | null;
  hasPostData?: boolean;
  hasAttachments?: boolean;
  attachmentsCount?: number;
  tags?: string[];
}

// Type guarding for RawDataEntry 
export class RawData implements RawDataEntry {
  constructor(data: RawDataEntry) {
    Object.assign(this, data);
  }

  creation_timestamp?: number;
  update_timestamp?: number;
  uri?: string;
  description?: string;

  public isRawData(): this is RawDataEntry {
    return true;
  }

  public isPostData(): this is PostDataEntry {
    return false;
  }

  public isPhotoPostData(): this is PhotoPostDataEntry {
    return false;
  }

  get relevantTimestamp(): number {
    if (typeof this.creation_timestamp === 'number') {
      return this.creation_timestamp;
    }
    if (typeof this.update_timestamp === 'number') {
      return this.update_timestamp;
    }
    return 0;
  }
}

export class PostData extends RawData implements PostDataEntry {
  constructor(data: PostDataEntry) {
    super(data);
    Object.assign(this, data);
  }

  post?: string;

  public override isPostData(): this is PostDataEntry {
    return true;
  }
}

export class PhotoPostData extends RawData implements PhotoPostDataEntry {
  constructor(data: PhotoPostDataEntry) {
    super(data);
    Object.assign(this, data);
  }

  media?: PhotoPostDataMedia;

  public override isPhotoPostData(): this is PhotoPostDataEntry {
    return true;
  }
}

export type DataEntryTypes = RawDataEntry | PostDataEntry | PhotoPostDataEntry;
export type DataClassTypes = RawData | PostData | PhotoPostData;

export function fromData(data: DataEntryTypes): DataClassTypes {
  switch (typeof data) {
    case 'object':
      if (isPhotoPostData(data)) {
        return new PhotoPostData(data);
      } else if (isPostData(data)) {
        return new PostData(data);
      } else {
        return new RawData(data);
      }
    default:
      throw new Error('Invalid data type');
  }
}

const isPostData = (obj: unknown): obj is PostDataEntry => {
  return isRawPostDataType<PostDataEntry>(obj, ['post']);
}

const isPhotoPostData = (obj: unknown): obj is PhotoPostDataEntry => {
  return isRawPostDataType<PhotoPostDataEntry>(obj, ['media']);
}

function isRawPostDataType<T extends RawDataEntry>(
  obj: unknown,
  properties: (keyof T)[]
): obj is T {
  if (obj && typeof obj === 'object') {
    for (const prop of properties) {
      if (!(prop in obj)) {
        return false;
      }
    }
    return true;
  }
  return false;
}