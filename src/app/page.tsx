import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { LeadForm } from "@/components/lead-form";
import { HeroSlider } from "@/components/hero-slider";
import { getCategories, getFeaturedProducts, getProducts, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

const benefits = [
  {
    title: "Быстрая доставка",
    text: "Подберём удобный способ получения и поможем с отправкой заказа."
  },
  {
    title: "Удобный заказ",
    text: "Добавляйте товары в корзину, сохраняйте избранное и отправляйте заявку за пару минут."
  },
  {
    title: "Качественные товары",
    text: "В каталоге собраны позиции для повседневного спроса и регулярных закупок."
  }
];

const marketplaceLinks = [
  {
    title: "Wildberries",
    text: "Официальный магазин Brellas на Wildberries",
    href: "https://www.wildberries.ru/brands/9097862-brellas",
    icon: "wb"
  },
  {
    title: "Ozon",
    text: "Официальный магазин Brellas на Ozon",
    href: "https://www.ozon.ru/seller/brellas/",
    icon: "ozon"
  }
];

function MarketplaceIcon({ type }: { type: string }) {
  if (type === "wb") {
    return (
      <span className="marketplaceIcon marketplaceIconWb" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <rect width="48" height="48" rx="14" />
          <path d="M13.5 17.5 17.2 31h3.7l2.6-8.1L26.1 31h3.7l4.7-13.5h-4l-2.5 8.4-2.7-8.4h-3.4l-2.7 8.4-2.5-8.4h-3.2Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="marketplaceIcon marketplaceIconOzon" aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <rect width="48" height="48" rx="14" />
        <path d="M13 24c0-6.1 4.6-10.5 11-10.5S35 17.9 35 24s-4.6 10.5-11 10.5S13 30.1 13 24Zm6 0c0 3 2 5.2 5 5.2s5-2.2 5-5.2-2-5.2-5-5.2-5 2.2-5 5.2Z" />
      </svg>
    </span>
  );
}

export default async function HomePage() {
  const [settings, featuredProducts, products, categories] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts(),
    getProducts(),
    getCategories()
  ]);

  const popularProducts = (featuredProducts.length ? featuredProducts : products).slice(0, 8);

  return (
    <>
      <SiteHeader siteTitle={settings?.siteTitle || "Brellas"} categories={categories} products={products} />
      <main>
        <Container className="homeShell">
          <HeroSlider />

          <section className="section" id="wholesale">
            <SectionTitle
              eyebrow="Преимущества"
              title="Покупать в Brellas удобно"
              text="Мы сделали каталог простым: выбирайте товары, сохраняйте нужное и отправляйте заявку удобным способом."
            />
            <div className="featureGrid featureGridCompact">
              {benefits.map((item) => (
                <article key={item.title} className="featureCard">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="categoryShowcase" aria-labelledby="home-categories-title">
            <div className="sectionTitle">
              <span className="eyebrow">Категории</span>
              <h2 id="home-categories-title">Выберите раздел</h2>
              <p>Откройте нужную категорию и быстро найдите товары для заказа.</p>
            </div>
            <div className="categoryGrid">
              {categories.slice(0, 8).map((category) => {
                const count = products.filter((product) => product.category?.slug === category.slug).length;

                return (
                  <Link key={category._id} href={`/catalog/category/${category.slug}`} className="categoryTile">
                    <span>{category.title}</span>
                    <small>{count} товаров</small>
                  </Link>
                );
              })}
              <Link href="/catalog" className="categoryTile categoryTileDark">
                <span>Весь каталог</span>
                <small>{products.length} товаров</small>
              </Link>
            </div>
          </section>

          <section className="section" id="popular">
            <SectionTitle
              eyebrow="Популярное"
              title="Популярные товары"
              text="Позиции, которые чаще всего выбирают для регулярных покупок и оптовых заказов."
            />
            {popularProducts.length ? (
              <div className="productGrid">
                {popularProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    telegramBotUrl={settings?.telegramBotUrl || "#"}
                  />
                ))}
              </div>
            ) : (
              <div className="emptyState">Товары скоро появятся.</div>
            )}
          </section>

          <section className="howToBuyBlock" id="how-to-buy" aria-labelledby="how-to-buy-title">
            <div className="sectionTitle">
              <span className="eyebrow">Как купить</span>
              <h2 id="how-to-buy-title">Соберите заявку на сайте</h2>
              <p>
                Выберите товары в каталоге, добавьте их в корзину и отправьте заявку. После отправки мы
                свяжемся с вами, чтобы подтвердить состав заказа и способ получения.
              </p>
            </div>
            <div className="howToBuySteps">
              <article>
                <span>1</span>
                <strong>Выберите товары</strong>
                <p>Откройте каталог или категорию и перейдите к нужным позициям.</p>
              </article>
              <article>
                <span>2</span>
                <strong>Добавьте в корзину</strong>
                <p>Соберите список товаров и укажите количество для заявки.</p>
              </article>
              <article>
                <span>3</span>
                <strong>Отправьте заявку</strong>
                <p>Оформите корзину, заполните форму или перейдите в Telegram.</p>
              </article>
            </div>
          </section>

          <section className="marketplacesBlock" id="marketplaces">
            <div className="marketplacesIntro">
              <span className="eyebrow">Официальные магазины Brellas</span>
              <h2>Brellas на маркетплейсах</h2>
              <p>Нас можно найти на популярных маркетплейсах — выбирайте удобный способ покупки.</p>
            </div>
            <div className="marketplaceCards">
              {marketplaceLinks.map((marketplace) => (
                <a
                  key={marketplace.title}
                  href={marketplace.href}
                  className={`marketplaceCard marketplaceCard${marketplace.icon === "wb" ? "Wb" : "Ozon"}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="marketplaceCardHead">
                    <MarketplaceIcon type={marketplace.icon} />
                    <span>{marketplace.title}</span>
                  </div>
                  <p>{marketplace.text}</p>
                  <strong>Открыть магазин →</strong>
                </a>
              ))}
            </div>
          </section>

          <section className="section">
            <LeadForm telegramUrl={settings?.telegramBotUrl || "#"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
