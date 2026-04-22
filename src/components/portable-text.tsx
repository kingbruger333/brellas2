import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "next-sanity";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>
  }
};

type PortableTextRendererProps = {
  value: PortableTextBlock[];
};

export function PortableTextRenderer({ value }: PortableTextRendererProps) {
  return <PortableText value={value} components={components} />;
}
