export type JSXElement = {
  tag: string | Function;
  props: any;
  children: any[];
};

/**
 * JSX Factory function to create element objects.
 */
export function h(tag: string | Function, props: any, ...children: any[]): JSXElement {
  return {
    tag,
    props: props || {},
    children: children.flat().filter(c => c !== null && c !== undefined && c !== false),
  };
}

/**
 * Fragment component for grouping children without a wrapper element.
 */
export function Fragment({ children }: { children: any[] }) {
  return children;
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (m) => ESCAPE_MAP[m]!);
}

/**
 * Renders a JSX element tree into an HTML string.
 */
export function render(node: any): string {
  if (node == null || node === false) return "";
  
  if (Array.isArray(node)) {
    return node.map(render).join("");
  }
  
  if (typeof node === "number") {
    return String(node);
  }
  
  if (typeof node === "string") {
    return escapeHtml(node);
  }

  const { tag, props, children } = node as JSXElement;

  if (typeof tag === "function") {
    return render(tag({ ...props, children }));
  }

  const attrs = Object.entries(props || {})
    .map(([key, value]) => {
      if (key === "children" || value == null || value === false) return "";
      
      let attrName = key;
      if (key === "className") attrName = "class";
      if (key === "htmlFor") attrName = "for";
      
      if (value === true) return ` ${attrName}`;
      
      const isEventHandler = key.startsWith("on");
      const escapedValue = isEventHandler 
        ? String(value).replace(/"/g, "&quot;") 
        : escapeHtml(String(value));
      
      return ` ${attrName}="${escapedValue}"`;
    })
    .join("");

  const selfClosing = ["meta", "link", "img", "br", "hr", "input", "area", "base", "col", "embed", "param", "source", "track", "wbr"].includes(tag);
  
  const isRawTag = typeof tag === "string" && ["script", "style"].includes(tag);
  const content = children.map(c => isRawTag && typeof c === "string" ? c : render(c)).join("");

  if (selfClosing && !content) {
    return `<${tag}${attrs} />`;
  }

  return `<${tag}${attrs}>${content}</${tag}>`;
}

declare global {
  namespace JSX {
    interface Element extends JSXElement {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
