import { WHATSAPP_MESSAGE_TEMPLATE } from "@/lib/constants";

/** Normaliza telefone BR para link wa.me (somente dígitos, com DDI 55). */
export function phoneToWhatsAppDigits(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;

  let digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;

  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  return digits.length >= 10 ? digits : null;
}

export function buildWhatsAppMessage(
  leadName: string,
  template: string = WHATSAPP_MESSAGE_TEMPLATE,
): string {
  return template.replace(/\{nome\}/gi, leadName.trim() || "cliente");
}

export function whatsAppUrl(
  phone: string | null | undefined,
  options?: { leadName?: string; message?: string },
): string | null {
  const digits = phoneToWhatsAppDigits(phone);
  if (!digits) return null;

  const base = `https://wa.me/${digits}`;
  const text = options?.message
    ? options.message
    : options?.leadName
      ? buildWhatsAppMessage(options.leadName)
      : null;

  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
