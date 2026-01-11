import type { DezuckerPlugin, DataTransformer, OutputSink, ExportContext } from "./types";
import type { FormattedPost } from "../types";
import { join } from "path";

export interface MarkdownConfig {
  targetDirectory: string;
}

export class MarkdownTransformer implements DataTransformer<string, MarkdownConfig> {
  transform(post: FormattedPost): string {
    const date = new Date((Number(post.timestamp) || 0) * 1000).toLocaleString();
    const sections = [
      `# Post ${post.id || post.timestamp}`,
      `**Date:** ${date}`,
      `**Original Timestamp:** ${post.timestamp}`,
      "",
      post.text || "_No content_",
      "",
    ];

    if (post.tags && post.tags.length > 0) {
      sections.push(`**People:** ${post.tags.join(", ")}`);
      sections.push("");
    }

    // Add media references
    const media = [
      ...(post.fragments?.filter(f => f.isPhoto) || []),
      ...(post.attachmentMedia || [])
    ];

    if (media.length > 0) {
      sections.push("## Media");
      media.forEach((m, idx) => {
        const ext = m.webUri?.split(".").pop() || "jpg";
        sections.push(`![Image](./images/post-${post.timestamp}-${idx}.${ext})`);
      });
      sections.push("");
    }

    return sections.join("\n");
  }
}

export class LocalFileSink implements OutputSink<string, MarkdownConfig> {
  async persist(data: string, context: ExportContext, config?: MarkdownConfig): Promise<void> {
    if (!config?.targetDirectory) {
      throw new Error("[LocalFileSink] No targetDirectory provided in configuration.");
    }

    const filename = `post-${context.timestamp}.md`;
    const filePath = join(config.targetDirectory, filename);

    // Save the markdown file
    await Bun.write(filePath, data);

    // Save media files
    if (context.media && context.media.length > 0) {
      const imagesDir = join(config.targetDirectory, "images");
      
      for (let i = 0; i < context.media.length; i++) {
        const m = context.media[i];
        if (m.mediaUri) {
          const ext = m.mediaUri.split(".").pop() || "jpg";
          const sourcePath = join("data", m.mediaUri);
          const destFilename = `post-${context.timestamp}-${i}.${ext}`;
          const destPath = join(imagesDir, destFilename);
          
          const file = Bun.file(sourcePath);
          if (await file.exists()) {
            await Bun.write(destPath, file);
          }
        }
      }
    }
  }
}

export const markdownExportPlugin: DezuckerPlugin<string, MarkdownConfig> = {
  metadata: {
    name: "Markdown File Export",
    slug: "markdown-file-export",
    description: "Exports posts as plain markdown files to a local directory.",
    version: "0.0.1",
  },
  transformer: new MarkdownTransformer(),
  sink: new LocalFileSink(),
  defaultConfig: {
    targetDirectory: "exports",
  },
};
