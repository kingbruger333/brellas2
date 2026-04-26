import Link from "next/link";
import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <Container className="siteFooterInner">
        <div>
          <strong className="footerBrand">Brellas</strong>
          <p>Товары для магазинов, маркетплейсов и бизнес-заказов с удобным оформлением.</p>
          <p className="footerCopyright">© 2026 Brellas. Все права защищены.</p>
        </div>
        <nav className="footerLinks" aria-label="Нижнее меню">
          <Link href="/catalog">Каталог</Link>
          <a href="/#wholesale">Оптовые условия</a>
          <a href="/#lead-form">Связаться</a>
        </nav>
      </Container>
    </footer>
  );
}
