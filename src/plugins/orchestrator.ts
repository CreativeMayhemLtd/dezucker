import type { FormattedPost } from "../types";
import { pluginRegistry } from "./registry";
import type { ExportContext } from "./types";

export class ExportOrchestrator {
  public async exportPost(slug: string, post: FormattedPost, config?: any): Promise<void> {
    const plugin = pluginRegistry.getPlugin(slug);
    const media = [
      ...(post.fragments?.filter(f => f.isPhoto) || []),
      ...(post.attachmentMedia || [])
    ];

    const context: ExportContext = {
      postId: post.id,
      timestamp: typeof post.timestamp === 'number' ? post.timestamp : Date.now(),
      index: 0,
      total: 1,
      media
    };

    const transformedData = await plugin.transformer.transform(post, config);
    await plugin.sink.persist(transformedData, context, config);
  }

  public async exportBatch(slug: string, posts: FormattedPost[], config?: any): Promise<void> {
    const plugin = pluginRegistry.getPlugin(slug);
    const total = posts.length;

    for (let i = 0; i < total; i++) {
      const post = posts[i];
      const media = [
        ...(post.fragments?.filter(f => f.isPhoto) || []),
        ...(post.attachmentMedia || [])
      ];

      const context: ExportContext = {
        postId: post.id,
        timestamp: typeof post.timestamp === 'number' ? post.timestamp : Date.now(),
        index: i,
        total,
        media
      };

      const transformedData = await plugin.transformer.transform(post, config);
      await plugin.sink.persist(transformedData, context, config);
    }
  }
}

export const exportOrchestrator = new ExportOrchestrator();
