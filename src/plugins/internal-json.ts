import type { DezuckerPlugin, DataTransformer, OutputSink, ExportContext } from "./types";
import { RawJsonTransformer } from "./types";

/**
 * Default Sink for the web UI: This is a no-op on the server because
 * the "sink" logic for the modal is actually handled by the client-side
 * JavaScript and the pre-rendered hidden blocks.
 */
export class JsonModalSink implements OutputSink<any> {
  async persist(_data: any, _context: ExportContext): Promise<void> {
    // Server-side: No-op. The UI already has the data in its hidden blocks.
    return Promise.resolve();
  }
}

export const internalJsonPlugin: DezuckerPlugin<any> = {
  metadata: {
    name: "Raw JSON View",
    slug: "internal-json",
    description: "Displays the raw un-mangled JSON data in the UI.",
    version: "0.0.1",
  },
  transformer: new RawJsonTransformer(),
  sink: new JsonModalSink(),
};
