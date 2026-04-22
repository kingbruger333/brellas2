import Link from "next/link";
import { Container } from "./container";

type SiteHeaderProps = {
  siteTitle: string;
};

export function SiteHeader({ siteTitle }: SiteHeaderProps) {
  return (
    <header className="siteHeader">
      <Container className="siteHeaderInner">
        <Link href="/" className="brand">
          {siteTitle}
        </Link>
        <nav className="siteNav">
          <Link href="/catalog">Каталог</Link>
          <a href="/#wholesale">Сотрудничество</a>
        </nav>
      </Container>
    </header>
  );
}
