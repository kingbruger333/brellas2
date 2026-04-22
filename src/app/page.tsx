import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { TelegramButton } from "@/components/telegram-button";
import { PortableTextRenderer } from "@/components/portable-text";
import { getFeaturedProducts, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

const advantages = [
  {
    title: "Оптовые цены",
    text: "Понятные условия закупки и ассортимент, который удобно закупать для регулярных поставок."
  },
  {
    title: "Широкий ассортимент",
    text: "Подбираем востребованные позиции для повседневного спроса и стабильной оборачиваемости."
  },
  {
    title: "Быстрая обработка заявок",
    text: "Оперативно подтверждаем наличие, согласовываем объёмы и сопровождаем заказ на каждом этапе."
  }
];

const benefits = [
  {
    title: "Почему выбирают Brellas",
    text: "Мы фокусируемся на товарах повседневного спроса, которые подходят для оптовой реализации и стабильных продаж."
  },
  {
    title: "Понятные условия сотрудничества",
    text: "Каждая позиция сопровождается ценой и минимальным объёмом заказа, чтобы решение принималось быстро."
  },
  {
    title: "Удобно работать в масштабе",
    text: "Ассортимент подходит для регулярных закупок, расширения матрицы и сезонного обновления предложения."
  }
];

const audience = [
  {
    title: "Для магазинов",
    text: "Базовые и сезонные позиции для розничной полки, акций и регулярного пополнения ассортимента."
  },
  {
    title: "Для маркетплейсов",
    text: "Товары с понятной подачей и хорошим потенциалом для онлайн-продаж и масштабирования."
  },
  {
    title: "Для бизнеса",
    text: "Подбор ассортимента для корпоративных закупок, подарочных наборов и операционных нужд."
  }
];

export default async function HomePage() {
  const [settings, featuredProducts] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts()
  ]);
  const showcaseProducts = featuredProducts.slice(0, 8);

  return (
    <>
      <SiteHeader siteTitle={settings?.siteTitle || "Brellas"} />
      <main>
        <section className="hero">
          <Container>
            <div className="heroCard">
              <div className="heroContent">
                <span className="eyebrow">Brellas</span>
                <h1>Brellas — товары народного потребления оптом</h1>
                <p>Для магазинов, маркетплейсов и бизнеса</p>
                <div className="heroActions">
                  <Link href="/catalog" className="primaryButton">
                    Смотреть каталог
                  </Link>
                  <TelegramButton href={settings?.telegramBotUrl || "#"} label="Связаться" className="secondaryButtonFilled" />
                </div>
              </div>
              <aside className="heroAside">
                {advantages.map((item) => (
                  <div key={item.title} className="highlightCard">
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                ))}
              </aside>
            </div>
          </Container>
        </section>

        <section className="section">
          <Container>
            <SectionTitle
              eyebrow="Преимущества"
              title="Почему выбирают Brellas"
              text="Поставляем ассортимент, который подходит для стабильной оптовой работы и понятен конечному покупателю."
            />
            <div className="featureGrid">
              {benefits.map((item) => (
                <article key={item.title} className="featureCard">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="section">
          <Container>
            <SectionTitle
              eyebrow="Витрина"
              title="Популярные товары"
              text="Подборка товаров, которые удобно включать в ассортимент магазина, маркетплейса или корпоративной поставки."
            />
            {showcaseProducts.length ? (
              <div className="showcaseBlock">
                <div className="showcaseScroller" aria-label="Популярные товары">
                  {showcaseProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      telegramBotUrl={settings?.telegramBotUrl || "#"}
                    />
                  ))}
                </div>
                <Link href="/catalog" className="primaryButton showcaseButton">
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <div className="emptyState">Товаров пока нет</div>
            )}
          </Container>
        </section>

        <section className="section" id="wholesale">
          <Container>
            <SectionTitle
              eyebrow="Сотрудничество"
              title="Условия оптового сотрудничества"
              text="Мы строим работу так, чтобы закупка была понятной, а запуск заказа не занимал лишнего времени."
            />
            <div className="conditionsGrid">
              <div className="conditionCard">
                <strong>Минимальный объём</strong>
                <p>Для каждой позиции указан минимальный заказ, чтобы вы сразу могли оценить формат закупки.</p>
              </div>
              <div className="conditionCard">
                <strong>Понятная коммуникация</strong>
                <p>Вы быстро получаете подтверждение по наличию, объёму и ключевым условиям поставки.</p>
              </div>
              <div className="conditionCard">
                <strong>Ассортимент для роста</strong>
                <p>Товары подходят для регулярных продаж, расширения матрицы и сезонных предложений.</p>
              </div>
              <div className="conditionCard">
                <strong>Детали сотрудничества</strong>
                <div className="richText">
                  {settings?.wholesaleConditions ? (
                    <PortableTextRenderer value={settings.wholesaleConditions} />
                  ) : (
                    <p>Условия сотрудничества уточняются по запросу.</p>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="section">
          <Container>
            <SectionTitle
              eyebrow="Кому подойдёт"
              title="Для магазинов, маркетплейсов и бизнеса"
              text="Brellas помогает собирать ассортимент под разные каналы продаж и закупочные задачи."
            />
            <div className="audienceGrid">
              {audience.map((item) => (
                <article key={item.title} className="audienceCard">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="section">
          <Container>
            <div className="ctaBanner">
              <div>
                <span className="eyebrow">Заявка</span>
                <h2>Быстрый переход к заявке</h2>
                <p>Оставьте запрос, чтобы обсудить ассортимент, объёмы закупки и условия поставки для вашего бизнеса.</p>
              </div>
              <div className="ctaBannerActions">
                <Link href="/catalog" className="secondaryButton">
                  Смотреть каталог
                </Link>
                <TelegramButton href={settings?.telegramBotUrl || "#"} label="Связаться" />
              </div>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
