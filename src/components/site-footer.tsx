import Link from "next/link";
import { Container } from "./container";

const MAX_URL = "https://max.ru/u/f9LHodD0cOLx5I9Piq5WiNKdBwiT4Vi7KPs14g1kcC1SpPlxP4HH0QCb03w";

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
          <a href={MAX_URL} target="_blank" rel="noreferrer" className="footerMessengerLink">
            <span className="maxMessengerIcon" aria-hidden="true" />
            MAX
          </a>
        </nav>
      </Container>
    </footer>
  );
}
