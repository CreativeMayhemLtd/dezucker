import type {FormattedPost} from "../types";
import type {InternalStorage} from "../storage/types";

/**
 * Metadata identifying a plugin.
 */
export interface PluginMetadata {
  name: string;
  slug: string;
  description?: string;
  version?: string;
}

/**
 * Context provided to the OutputSink during persistence.
 */
export interface ExportContext {
  postId?: string | number | null;
  timestamp: number;
  index: number;
  total: number;
  directory?: string;
  media?: FormattedPost["fragments"];
  storage: InternalStorage;
  [key: string]: any;
}

/**
 * Interface for transforming post data into a target format.
 */
export interface DataTransformer<T, C = void> {
  transform(post: FormattedPost, context: ExportContext, config?: C): T | Promise<T>;
}

/**
 * Interface for persisting transformed data to a destination.
 */
export interface OutputSink<T, C = void> {
  persist(data: T, context: ExportContext, config?: C): Promise<void>;
  databaseCollectionKey?: string;
}

/**
 * A complete Dezucker plugin definition.
 */
export interface DezuckerPlugin<T, C = void> {
  metadata: PluginMetadata;
  transformer: DataTransformer<T, C>;
  sink: OutputSink<T, C>;
  defaultConfig?: C;
}

export class RawJsonTransformer implements DataTransformer<any> {
  transform(post: FormattedPost, _context: ExportContext): any {
    return post._raw || post;
  }
}

export class ConsoleSink implements OutputSink<any> {
  async persist(data: any, context: ExportContext): Promise<void> {
    console.log(`[Plugin Export] Post ${context.index + 1}/${context.total} (ID: ${context.postId})`);
    console.log(JSON.stringify(data, null, 2));
  }
}
