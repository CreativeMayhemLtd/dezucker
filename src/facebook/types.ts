import {type Formattable, type FormattedPost, type PostFragment, UnknownRawData} from "../types.ts";

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
    uri?: string;
    media?: MediaMetadataEntry;
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

export class RawPostObject implements RawPost, Formattable<FormattedPost> {
    constructor(post: RawPost) {
        // Filter out literal empty objects from the source data array before capturing or assigning.
        // This preserves all data autonomy (unknown keys are kept) while removing structural noise.
        if (Array.isArray(post.data)) {
            post.data = post.data.filter(d => d && typeof d === 'object' && Object.keys(d).length > 0);
        }

        this._rawSource = post as Record<string, any>;
        Object.assign(this, post);
    }

    private _rawSource: Record<string, any>;

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
                if (dataObj != null && dataObj.isPostEntry() && typeof dataObj.post === 'string' && dataObj.post.trim().length > 0) {
                    return dataObj.post.trim();
                }
            }
        }
        return null;
    }

    get dataObjects(): DataClassTypes[] | null {
        if (Array.isArray(this.data)) {
            return this.data.map(d => fromData(d)).filter((d): d is DataClassTypes => d !== null);
        }

        if (this.data && typeof this.data === 'object') {
            const dataObj = fromData(this.data as any);
            return dataObj ? [dataObj] : null;
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
                return dataObj?.relevantTimestamp ?? 0;
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

        const fragments = this.dataObjects?.map(obj => obj.formatted) || [];
        const meaningfulEntriesCount = fragments.filter(f => f.isMeaningful).length;

        const attachmentMedia: PostFragment[] = [];
        if (Array.isArray(this.attachments)) {
            for (const a of this.attachments) {
                if (a && Array.isArray(a.data)) {
                    for (const d of a.data) {
                        const uri = d.media?.uri || d.uri;
                        if (uri) {
                            attachmentMedia.push({
                                text: "",
                                timestamp: d.update_timestamp || timestamp,
                                mediaUri: uri,
                                webUri: `/data/${uri}`,
                                isPhoto: d.media?.media_metadata?.photo_metadata != null || (uri.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null),
                                isMeaningful: true
                            });
                        }
                    }
                }
            }
        }

        return {
            id,
            text,
            timestamp,
            attachmentsCount,
            meaningfulEntriesCount,
            tags,
            fragments,
            attachmentMedia,
            _raw: this._rawSource,
        };
    }

    static fromData(post: RawPost): RawPostObject {
        return new RawPostObject(post);
    }
}

// Type guarding for RawDataEntry
export class RawData implements RawDataEntry, Formattable<any>, Formattable<PostFragment> {
    constructor(data: RawDataEntry) {
        this._rawSource = data as Record<string, any>;
        Object.assign(this, data);
    }

    protected _rawSource: Record<string, any>;

    creation_timestamp?: number;
    update_timestamp?: number;
    uri?: string;
    description?: string;
    post?: string;
    media?: MediaMetadataClassTypes | MediaMetadataEntry;

    public get formatted(): PostFragment {
        return {
            text: this.post || this.description || "",
            timestamp: this.relevantTimestamp,
            isMeaningful: true,
            _raw: this._rawSource,
        };
    }

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

    public override get formatted(): PostFragment {
        const base = super.formatted;
        const uri = this.uri || null;
        return {
            ...base,
            mediaUri: uri,
            webUri: uri ? `/data/${uri}` : null,
            isPhoto: uri?.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null,
        };
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

    public override get formatted(): PostFragment {
        const base = super.formatted;
        const uri = this.media?.uri || this.uri || null;
        return {
            ...base,
            mediaUri: uri,
            webUri: uri ? `/data/${uri}` : null,
            isPhoto: this.media?.isPhotoMetadata() || (uri?.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null),
            isMeaningful: true,
            _raw: this._rawSource,
        };
    }

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

export type DataClassTypes = RawData | PostEntry | MediaEntry | UnknownRawData;

export function fromData(data: RawDataEntry): DataClassTypes | null {
    if (data && typeof data === 'object') {
        if ('media' in data) {
            return new MediaEntry(data);
        }
        if ('post' in data) {
            return new PostEntry(data);
        }
        // If it has at least one of our recognized "Keep" keys (like update_timestamp), it's a RawData
        const meaningfulKeys = ['post', 'uri', 'media', 'description', 'attachments', 'update_timestamp', 'creation_timestamp', 'title', 'tags'];
        const hasMeaningfulKey = Object.keys(data).some(key => meaningfulKeys.includes(key));

        if (hasMeaningfulKey) {
            return new RawData(data);
        }
        return new UnknownRawData(data);
    }
    return null;
}