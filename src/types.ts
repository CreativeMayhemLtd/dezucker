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

export interface DataEntry {
  post?: string;
  update_timestamp?: number;
}

export interface RawPost {
  timestamp?: number;
  title?: string;
  data?: DataEntry[];
  attachments?: Attachment[];
  tags?: Tag[];
  // other optional fields occasionally appear in the dump
  created_time?: string | number;
  created?: string | number;
  id?: string | number;
}

export interface FormattedPost {
  id?: string | number | null;
  text: string;
  created_time?: string | number | null;
  hasPostData?: boolean;
  hasAttachments?: boolean;
  attachmentsCount?: number;
  tags?: string[];
}
