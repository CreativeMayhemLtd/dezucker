import type { DezuckerPlugin, PluginMetadata } from "./types";

export class PluginRegistry {
  private plugins = new Map<string, DezuckerPlugin<any, any>>();

  public register(plugin: DezuckerPlugin<any, any>): void {
    const { slug } = plugin.metadata;
    if (this.plugins.has(slug)) {
      console.warn(`[PluginRegistry] Plugin with slug "${slug}" is already registered. Overwriting.`);
    }
    this.plugins.set(slug, plugin);
  }

  public getPlugin(slug: string): DezuckerPlugin<any, any> {
    const plugin = this.plugins.get(slug);
    if (!plugin) {
      throw new Error(`[PluginRegistry] Plugin with slug "${slug}" not found.`);
    }
    return plugin;
  }

  public listPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(p => p.metadata);
  }
}

// Export a singleton instance
export const pluginRegistry = new PluginRegistry();
