// TODO: some of this can be discovered at runtime from the data itself, but some hard types are useful for 
// recognition and shape. Implement that dynamic stuff at some point and instead use this kind of stuff to
// inform the shape the reader recognizes / outputs.

import {RawData, type RawDataEntry} from "./facebook/types.ts";

export interface Formattable<T> {
  readonly formatted: T;
}

export interface FormattedPost {
  id?: string | number | null;
  text: string;
  timestamp?: string | number | null;
  attachmentsCount?: number;
  meaningfulEntriesCount: number;
  tags?: string[];
  fragments?: PostFragment[];
  attachmentMedia?: PostFragment[];
  _raw?: any;
}

/**
 * Represents a structured fragment of a post for rendering.
 */
export interface PostFragment {
  text: string;
  timestamp: number;
  mediaUri?: string | null;
  webUri?: string | null;
  isPhoto?: boolean;
  isUnknown?: boolean;
  isMeaningful?: boolean;
  _raw?: any;
}

export class UnknownRawData extends RawData {
  constructor(data: RawDataEntry) {
    super(data);
  }

  public override get formatted(): PostFragment {
    return {
      text: "",
      timestamp: this.relevantTimestamp,
      isUnknown: true,
      isMeaningful: false,
      _raw: this._rawSource,
    };
  }
}

