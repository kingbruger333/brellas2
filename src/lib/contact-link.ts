function normalizeBotUrl(rawHref: string) {
  const value = rawHref.trim();

  if (!value) {
    return "#";
  }

  if (value.startsWith("https://") || value.startsWith("http://")) {
    return value;
  }

  if (value.startsWith("t.me/")) {
    return `https://${value}`;
  }

  if (value.startsWith("@")) {
    return `https://t.me/${value.slice(1)}`;
  }

  if (/^[a-zA-Z0-9_]{5,}$/.test(value)) {
    return `https://t.me/${value}`;
  }

  return value;
}

export function buildContactHref(rawHref: string, productName?: string) {
  const normalizedHref = normalizeBotUrl(rawHref);

  if (!productName || normalizedHref === "#") {
    return normalizedHref;
  }

  try {
    const url = new URL(normalizedHref);
    url.searchParams.set("start", `product:${productName}`);
    return url.toString();
  } catch {
    return normalizedHref;
  }
}
