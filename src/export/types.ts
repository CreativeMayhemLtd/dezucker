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