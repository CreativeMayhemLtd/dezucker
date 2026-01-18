export interface Formattable<T> {
    readonly formatted: T;
}


export type TagHolder = {
    [key: string]: string | undefined;
};

export interface FormattedPost {
    tid?: string | null; // for atproto; will move to the plugin as a transform when implemented
    id?: string | number | null;
    text: string;
    timestamp?: string | number | null;
    attachmentsCount?: number;
    meaningfulEntriesCount: number;
    tags?: TagHolder[];
    fragments?: PostFragment[];
    media?: PostFragment[];
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