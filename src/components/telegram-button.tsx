import { buildContactHref } from "@/lib/contact-link";

type TelegramButtonProps = {
  href: string;
  label?: string;
  productName?: string;
  className?: string;
};

export function TelegramButton({
  href,
  label = "Оставить заявку",
  productName,
  className
}: TelegramButtonProps) {
  const preparedHref = buildContactHref(href, productName);

  return (
    <a
      className={`telegramButton ${className || ""}`.trim()}
      href={preparedHref}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}
