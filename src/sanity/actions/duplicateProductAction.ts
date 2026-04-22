import { useState } from "react";
import type { DocumentActionComponent, SanityDocument } from "sanity";
import { useClient } from "sanity";
import { useRouter } from "sanity/router";

type ProductDocument = SanityDocument & {
  title?: string;
  slug?: unknown;
};

type ProductDocumentCopy = Record<string, unknown> & {
  _id: string;
  _type: "product";
  title: string;
};

function buildProductCopy(source: ProductDocument, draftId: string): ProductDocumentCopy {
  const {
    _id,
    _rev,
    _createdAt,
    _updatedAt,
    slug,
    title,
    ...fieldsToCopy
  } = source;

  return {
    ...fieldsToCopy,
    _id: `drafts.${draftId}`,
    _type: "product",
    title: title ? `${title} (копия)` : "Новый товар (копия)"
  };
}

export const DuplicateProductAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: "2024-06-01" });
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const sourceDocument = (props.draft || props.published) as ProductDocument | null;

  return {
    label: isDuplicating ? "Дублируем..." : "Дублировать",
    tone: "primary",
    disabled: isDuplicating || !sourceDocument,
    onHandle: async () => {
      if (!sourceDocument) {
        return;
      }

      setIsDuplicating(true);

      try {
        const newDocumentId = crypto.randomUUID();
        const duplicatedProduct = buildProductCopy(sourceDocument, newDocumentId);

        await client.create(duplicatedProduct);
        router.navigateIntent("edit", {
          id: newDocumentId,
          type: "product"
        });
      } finally {
        setIsDuplicating(false);
        props.onComplete();
      }
    }
  };
};

DuplicateProductAction.displayName = "DuplicateProductAction";
