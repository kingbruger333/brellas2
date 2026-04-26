"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "Brellas",
    title: "Оптовые товары для вашего магазина",
    text: "Подберём товары для розницы, маркетплейсов и офиса. Быстро и удобно.",
    tone: "heroSlideAmber",
    visual: "heroVisualRetail"
  },
  {
    eyebrow: "Для продаж",
    title: "Товары для маркетплейсов",
    text: "Ассортимент для карточек, витрин и регулярных продаж на популярных площадках.",
    tone: "heroSlideOlive",
    visual: "heroVisualMarketplace"
  },
  {
    eyebrow: "Быстрый старт",
    title: "Быстрое оформление заказа",
    text: "Добавляйте товары в корзину и отправляйте заявку менеджеру за пару минут.",
    tone: "heroSlideInk",
    visual: "heroVisualOrder"
  }
];

export function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  return (
    <section
      className="marketHero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, index) => (
        <article
          key={slide.title}
          className={`heroSlide ${slide.tone} ${index === activeIndex ? "heroSlideActive" : ""}`}
          aria-hidden={index !== activeIndex}
        >
          <div className="marketHeroContent">
            <span className="eyebrow">{slide.eyebrow}</span>
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>
            <div className="heroActions">
              <Link href="/catalog" className="primaryButton">
                Смотреть каталог
              </Link>
              <Link href="/#lead-form" className="secondaryButtonFilled">
                Оставить заявку
              </Link>
            </div>
            <div className="heroNote">Работаем по всей России • Быстрая обработка заявок</div>
          </div>

          <div className={`heroVisual ${slide.visual}`} aria-hidden="true">
            <span className="heroOrb heroOrbOne" />
            <span className="heroOrb heroOrbTwo" />
            <span className="heroProductShape heroProductShapeOne" />
            <span className="heroProductShape heroProductShapeTwo" />
            <span className="heroProductShape heroProductShapeThree" />
            <span className="heroVisualCard heroVisualCardCatalog">Каталог</span>
            <span className="heroVisualCard heroVisualCardOrder">Заказ</span>
            <span className="heroVisualCard heroVisualCardSelect">Подбор</span>
          </div>
        </article>
      ))}

      <div className="heroSliderControls">
        <button type="button" onClick={showPrevious} aria-label="Предыдущий баннер">
          ←
        </button>
        <button type="button" onClick={showNext} aria-label="Следующий баннер">
          →
        </button>
      </div>
    </section>
  );
}
