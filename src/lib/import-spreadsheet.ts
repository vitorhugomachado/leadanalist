import * as XLSX from "xlsx";

export type ParsedLeadRow = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  notes?: string;
};

const HEADER_ALIASES: Record<keyof Omit<ParsedLeadRow, "name"> | "name", string[]> = {
  name: ["nome", "name", "cliente", "lead", "contato"],
  email: ["email", "e-mail", "mail"],
  phone: ["telefone", "phone", "celular", "whatsapp", "tel"],
  company: ["empresa", "company", "razao", "razão social"],
  city: ["cidade", "city", "municipio", "município"],
  notes: ["obs", "observacao", "observação", "notes", "notas", "comentario"],
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function mapHeader(row: Record<string, unknown>): Partial<Record<keyof ParsedLeadRow, string>> {
  const keys = Object.keys(row);
  const mapping: Partial<Record<keyof ParsedLeadRow, string>> = {};

  for (const key of keys) {
    const norm = normalizeHeader(key);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
      keyof ParsedLeadRow,
      string[],
    ][]) {
      if (aliases.some((a) => norm === a || norm.includes(a))) {
        mapping[field] = key;
      }
    }
  }
  return mapping;
}

function cellStr(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  return String(v).trim() || undefined;
}

export function parseSpreadsheetBuffer(buffer: ArrayBuffer): ParsedLeadRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rows.length === 0) return [];

  const mapping = mapHeader(rows[0]);
  const nameKey =
    mapping.name ??
    Object.keys(rows[0]).find((k) => normalizeHeader(k).includes("nome")) ??
    Object.keys(rows[0])[0];

  const leads: ParsedLeadRow[] = [];

  for (const row of rows) {
    const name = cellStr(row[nameKey]);
    if (!name) continue;

    leads.push({
      name,
      email: mapping.email ? cellStr(row[mapping.email]) : undefined,
      phone: mapping.phone ? cellStr(row[mapping.phone]) : undefined,
      company: mapping.company ? cellStr(row[mapping.company]) : undefined,
      city: mapping.city ? cellStr(row[mapping.city]) : undefined,
      notes: mapping.notes ? cellStr(row[mapping.notes]) : undefined,
    });
  }

  return leads;
}
