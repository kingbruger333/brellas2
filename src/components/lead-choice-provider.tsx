"use client";

import { createContext, MouseEvent, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildContactHref } from "@/lib/contact-link";

export type LeadProductPrefill = {
  title?: string;
  sku?: string;
  category?: string;
};

type LeadChoiceRequest = {
  telegramUrl: string;
  product?: LeadProductPrefill;
};

type LeadChoiceContextValue = {
  openLeadChoice: (request: LeadChoiceRequest) => void;
};

const LEAD_PREFILL_STORAGE_KEY = "brellas:lead-prefill";
const CONTACT_PHONE_HREF = "tel:+79772554989";
const MAX_URL = "https://max.ru/u/f9LHodD0cOLx5I9Piq5WiNKdBwiT4Vi7KPs14g1kcC1SpPlxP4HH0QCb03w";

const LeadChoiceContext = createContext<LeadChoiceContextValue | null>(null);

function formatItems(product?: LeadProductPrefill) {
  if (!product?.title && !product?.sku && !product?.category) {
    return "";
  }

  return [
    product.title ? `Название: ${product.title}` : "",
    product.sku ? `Артикул: ${product.sku}` : "",
    product.category ? `Категория: ${product.category}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function saveLeadPrefill(product?: LeadProductPrefill) {
  if (typeof window === "undefined") return;

  const payload = {
    items: formatItems(product),
    product
  };

  window.sessionStorage.setItem(LEAD_PREFILL_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("brellas:lead-prefill", { detail: payload }));
}

type LeadChoiceModalProps = {
  isOpen: boolean;
  request: LeadChoiceRequest | null;
  onClose: () => void;
  onChooseForm: () => void;
};

function LeadChoiceModal({ isOpen, request, onClose, onChooseForm }: LeadChoiceModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  if (!isOpen || !request) {
    return null;
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="leadChoiceOverlay" onClick={handleBackdropClick} role="presentation">
      <div className="leadChoiceModal" role="dialog" aria-modal="true" aria-labelledby="lead-choice-title">
        <button type="button" className="leadChoiceClose" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <span className="eyebrow">Заявка</span>
        <h2 id="lead-choice-title">Как удобно оформить запрос?</h2>
        <p>Выберите способ связи. Форму можно заполнить на сайте или продолжить общение в Telegram.</p>
        <div className="leadChoiceActions">
          <button type="button" className="primaryButton" onClick={onChooseForm}>
            Заполнить форму
          </button>
          <a
            href={buildContactHref(request.telegramUrl, request.product?.title)}
            className="secondaryButton"
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            Написать в Telegram
          </a>
          <a href={MAX_URL} className="secondaryButton messengerButton" target="_blank" rel="noreferrer" onClick={onClose}>
            <span className="maxMessengerIcon" aria-hidden="true" />
            Написать в MAX
          </a>
          <a href={CONTACT_PHONE_HREF} className="secondaryButton" onClick={onClose}>
            Позвонить
          </a>
        </div>
      </div>
    </div>
  );
}

export function LeadChoiceProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<LeadChoiceRequest | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const value = useMemo<LeadChoiceContextValue>(
    () => ({
      openLeadChoice(nextRequest) {
        setRequest(nextRequest);
      }
    }),
    []
  );

  function closeLeadChoice() {
    setRequest(null);
  }

  function chooseForm() {
    saveLeadPrefill(request?.product);
    closeLeadChoice();

    if (pathname === "/") {
      const target = document.getElementById("lead-form");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    router.push("/#lead-form");
  }

  return (
    <LeadChoiceContext.Provider value={value}>
      {children}
      <LeadChoiceModal isOpen={Boolean(request)} request={request} onClose={closeLeadChoice} onChooseForm={chooseForm} />
    </LeadChoiceContext.Provider>
  );
}

export function useLeadChoice() {
  const context = useContext(LeadChoiceContext);

  if (!context) {
    throw new Error("useLeadChoice must be used within LeadChoiceProvider");
  }

  return context;
}
