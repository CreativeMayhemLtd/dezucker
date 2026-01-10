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
  post?: string;
  media?: MediaMetadataEntry;
}

export interface MediaMetadataEntry {
    uri?: string;
    creation_timestamp?: number;
    update_timestamp?: number;
    media_metadata?: PostMediaMetadata;
}

export interface PostMediaMetadata {
  photo_metadata?: PhotoMetadataEntry;
}

export interface PhotoMetadataEntry {
  exif_data?: Record<string, any>[];
}

export class MediaMetadata implements MediaMetadataEntry {
  constructor(data: MediaMetadataEntry) {
    Object.assign(this, data);
  }

  uri?: string;
  creation_timestamp?: number;
  update_timestamp?: number;
  media_metadata?: PostMediaMetadata;

  public isPhotoMetadata(): this is PhotoMetadata {
    return false;
  }
}

export class PhotoMetadata extends MediaMetadata {
  constructor(data: MediaMetadataEntry) {
    super(data);
  }

  public override isPhotoMetadata(): this is PhotoMetadata {
    return true;
  }
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
        const dataObj = fromData(d);
        if (dataObj.isPostEntry() && typeof dataObj.post === 'string' && dataObj.post.trim().length > 0) {
          return dataObj.post.trim();
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
      // TODO: for now, use the first.
      const dataRaw = this.data[0];
      if (dataRaw && typeof dataRaw === 'object') {
        const dataObj = fromData(dataRaw);
        return dataObj.relevantTimestamp;
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
    const timestamp = this.relevantTimestamp;

    let text = this.text || "";
    if (!text && typeof this.title === 'string') {
      text = this.title.trim();
    }

    let attachmentsCount = 0;
    if (Array.isArray(this.attachments)) {
      for (const a of this.attachments) {
        if (a && Array.isArray(a.data)) {
          attachmentsCount += a.data.length;
        }
      }
    }

    const tags: string[] = Array.isArray(this.tags)
      ? this.tags.filter((t) => t && typeof t.name === 'string').map((t) => t.name as string)
      : [];

    return {
      id,
      text,
      timestamp,
      hasPostData: this.dataCount > 0,
      hasAttachments: attachmentsCount > 0,
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
  post?: string;
  media?: MediaMetadataClassTypes | MediaMetadataEntry;

  public isPostEntry(): this is PostEntry {
    return false;
  }

  public isMediaEntry(): this is MediaEntry {
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

export class PostEntry extends RawData {
  constructor(data: RawDataEntry) {
    super(data);
    Object.assign(this, data);
  }

  public override isPostEntry(): this is PostEntry {
    return true;
  }
}

export class MediaEntry extends RawData {
  constructor(data: RawDataEntry) {
    super(data);
    Object.assign(this, data);
    if (this.media) {
      this.media = fromMediaMetadata(this.media);
    }
  }

  declare media?: MediaMetadataClassTypes;

  public override isMediaEntry(): this is MediaEntry {
    return true;
  }
}

export type MediaMetadataClassTypes = MediaMetadata | PhotoMetadata;

export function fromMediaMetadata(data: MediaMetadataEntry): MediaMetadataClassTypes {
  if (data && typeof data === 'object') {
    if (data.media_metadata?.photo_metadata) {
      return new PhotoMetadata(data);
    }
  }
  return new MediaMetadata(data);
}

export type DataEntryTypes = RawDataEntry;
export type DataClassTypes = RawData | PostEntry | MediaEntry;

export function fromData(data: RawDataEntry): DataClassTypes {
  if (data && typeof data === 'object') {
    if ('media' in data) {
      return new MediaEntry(data);
    }
    if ('post' in data) {
      return new PostEntry(data);
    }
  }
  return new RawData(data);
}