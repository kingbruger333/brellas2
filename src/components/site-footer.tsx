import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <Container className="siteFooterInner">
        <div>
          <strong className="footerBrand">Brellas</strong>
          <p>Товары народного потребления оптом для стабильных поставок и уверенного роста бизнеса.</p>
          <p className="footerCopyright">© 2026 Brellas. Все права защищены.</p>
        </div>
      </Container>
    </footer>
  );
}
