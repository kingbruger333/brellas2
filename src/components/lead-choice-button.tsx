"use client";

import { MouseEvent } from "react";
import { LeadProductPrefill, useLeadChoice } from "@/components/lead-choice-provider";

type LeadChoiceButtonProps = {
  telegramUrl: string;
  label?: string;
  className?: string;
  product?: LeadProductPrefill;
};

export function LeadChoiceButton({
  telegramUrl,
  label = "Оставить заявку",
  className,
  product
}: LeadChoiceButtonProps) {
  const { openLeadChoice } = useLeadChoice();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    openLeadChoice({ telegramUrl, product });
  }

  return (
    <button type="button" className={`telegramButton ${className || ""}`.trim()} onClick={handleClick}>
      {label}
    </button>
  );
}
