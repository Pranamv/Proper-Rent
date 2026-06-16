"use client";

import {
  ArrowSquareOut,
  Check,
  Copy,
  EnvelopeSimple,
  Phone,
  WhatsappLogo,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

type AdminQuickActionsProps = {
  className?: string;
  copyLabel?: string;
  copyValue?: string | null;
  email?: string | null;
  openHref?: string;
  phone?: string | null;
};

export function AdminQuickActions({
  className,
  copyLabel = "Copy",
  copyValue,
  email,
  openHref,
  phone,
}: AdminQuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const emailHref = email ? `mailto:${email}` : null;
  const phoneHref = phone ? `tel:${phone}` : null;
  const whatsappHref = phone ? whatsappLink(phone) : null;

  async function handleCopy() {
    if (!copyValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {openHref ? (
        <Link className={actionClasses} href={openHref} prefetch={false}>
          <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
          <span>Open</span>
        </Link>
      ) : null}
      {copyValue ? (
        <button className={actionClasses} onClick={handleCopy} type="button">
          {copied ? (
            <Check aria-hidden="true" size={14} weight="bold" />
          ) : (
            <Copy aria-hidden="true" size={14} weight="bold" />
          )}
          <span>{copied ? "Copied" : copyLabel}</span>
        </button>
      ) : null}
      {emailHref ? (
        <a className={actionClasses} href={emailHref}>
          <EnvelopeSimple aria-hidden="true" size={14} weight="bold" />
          <span>Email</span>
        </a>
      ) : null}
      {phoneHref ? (
        <a className={actionClasses} href={phoneHref}>
          <Phone aria-hidden="true" size={14} weight="bold" />
          <span>Call</span>
        </a>
      ) : null}
      {whatsappHref ? (
        <a className={actionClasses} href={whatsappHref} rel="noreferrer" target="_blank">
          <WhatsappLogo aria-hidden="true" size={14} weight="bold" />
          <span>WhatsApp</span>
        </a>
      ) : null}
    </div>
  );
}

const actionClasses = cn(
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border",
  "bg-surface px-2.5 text-xs font-semibold text-muted transition-colors",
  "hover:border-primary/35 hover:bg-surface-subtle hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

function whatsappLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }

  const normalised = digits.startsWith("0") ? `44${digits.slice(1)}` : digits;
  return `https://wa.me/${normalised}`;
}
