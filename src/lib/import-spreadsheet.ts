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
  name: [
    "nome",
    "name",
    "cliente",
    "lead",
    "nome fantasia",
    "nomefantasia",
    "titular",
    "prospect",
    "responsavel",
  ],
  email: ["email", "e-mail", "e mail", "mail", "correio"],
  phone: [
    "telefone",
    "phone",
    "celular",
    "whatsapp",
    "whats",
    "wpp",
    "zap",
    "tel",
    "fone",
    "numero",
    "numeros",
    "num",
    "contato telefonico",
    "telefone principal",
    "telefone 1",
    "telefone1",
    "telefone 2",
    "telefone2",
    "tel comercial",
    "tel residencial",
    "tel celular",
    "cel",
    "mobile",
    "movel",
    "movil",
    "ddd",
    "fone celular",
    "fone comercial",
    "num telefone",
    "numero telefone",
    "numerotelefone",
    "contato", // muitas planilhas BR usam "Contato" só com o número
  ],
  company: [
    "empresa",
    "company",
    "razao",
    "razao social",
    "nome empresa",
    "organizacao",
    "org",
  ],
  city: ["cidade", "city", "municipio", "local", "uf cidade", "endereco cidade"],
  notes: ["obs", "observacao", "observação", "notes", "notas", "comentario", "descricao"],
};

const PHONE_VALUE_RE = /^[\d\s().+\-/]{8,}$/;
const DIGITS_RE = /\d/g;

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[_\-./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreHeader(field: keyof ParsedLeadRow, norm: string): number {
  const aliases = HEADER_ALIASES[field as keyof typeof HEADER_ALIASES];
  if (!aliases) return 0;

  let best = 0;
  for (const alias of aliases) {
    const a = normalizeHeader(alias);
    if (norm === a) best = Math.max(best, 100);
    else if (norm.startsWith(a + " ") || norm.endsWith(" " + a)) best = Math.max(best, 80);
    else if (norm.includes(a)) best = Math.max(best, 60);
  }
  return best;
}

function mapHeader(row: Record<string, unknown>): Partial<Record<keyof ParsedLeadRow, string>> {
  const keys = Object.keys(row);
  const mapping: Partial<Record<keyof ParsedLeadRow, string>> = {};
  const fields: (keyof ParsedLeadRow)[] = [
    "phone",
    "email",
    "name",
    "company",
    "city",
    "notes",
  ];

  for (const key of keys) {
    const norm = normalizeHeader(key);
    if (!norm || norm.startsWith("__empty")) continue;

    let bestField: keyof ParsedLeadRow | null = null;
    let bestScore = 0;

    for (const field of fields) {
      const s = scoreHeader(field, norm);
      if (s > bestScore) {
        bestScore = s;
        bestField = field;
      }
    }

    if (bestField && bestScore >= 60) {
      const prev = mapping[bestField];
      if (!prev || bestScore > scoreHeader(bestField, normalizeHeader(prev))) {
        mapping[bestField] = key;
      }
    }
  }

  return mapping;
}

/** Valores que parecem telefone (não e-mail). */
function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@")) return false;
  const digits = (trimmed.match(DIGITS_RE) ?? []).length;
  if (digits < 8) return false;
  return PHONE_VALUE_RE.test(trimmed) || digits >= 10;
}

function formatPhoneNumber(n: number): string {
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n);
  if (Math.abs(n - rounded) < 1e-6) {
    return String(rounded);
  }
  return String(n).replace(/\.0+$/, "");
}

function cellStr(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") {
    const s = formatPhoneNumber(v);
    return s || undefined;
  }
  if (typeof v === "boolean") return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function cellPhone(v: unknown): string | undefined {
  const raw = cellStr(v);
  if (!raw) return undefined;
  if (!looksLikePhone(raw)) return undefined;

  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return undefined;

  if (digits.length >= 12 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    if (rest.length === 8) {
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return raw;
}

/** Se não achou coluna de telefone pelo cabeçalho, usa coluna com valores típicos de telefone. */
function detectPhoneColumn(
  rows: Record<string, unknown>[],
  mapping: Partial<Record<keyof ParsedLeadRow, string>>,
  nameKey: string,
): string | undefined {
  if (mapping.phone) return mapping.phone;

  const keys = Object.keys(rows[0] ?? {}).filter((k) => k !== nameKey);
  let bestKey: string | undefined;
  let bestRatio = 0;

  const sample = rows.slice(0, Math.min(40, rows.length));

  for (const key of keys) {
    const norm = normalizeHeader(key);
    if (norm.includes("email") || norm.includes("mail")) continue;

    let hits = 0;
    let total = 0;
    for (const row of sample) {
      const v = cellStr(row[key]);
      if (!v) continue;
      total++;
      if (looksLikePhone(v)) hits++;
    }
    const ratio = total > 0 ? hits / total : 0;
    if (ratio > bestRatio && ratio >= 0.5) {
      bestRatio = ratio;
      bestKey = key;
    }
  }

  return bestKey;
}

function findNameKey(
  row: Record<string, unknown>,
  mapping: Partial<Record<keyof ParsedLeadRow, string>>,
): string {
  if (mapping.name) return mapping.name;

  const keys = Object.keys(row);
  const byNome = keys.find((k) => {
    const n = normalizeHeader(k);
    return n.includes("nome") && !n.includes("empresa") && !n.includes("fantasia");
  });
  if (byNome) return byNome;

  const byCliente = keys.find((k) => normalizeHeader(k).includes("cliente"));
  if (byCliente) return byCliente;

  const notPhone = keys.find((k) => {
    if (k === mapping.phone || k === mapping.email) return false;
    const v = cellStr(row[k]);
    if (!v) return true;
    return !looksLikePhone(v);
  });

  return notPhone ?? keys[0];
}

function readRows(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as (string | number)[][];

  if (matrix.length === 0) return [];

  let headerRowIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(10, matrix.length); i++) {
    const row = matrix[i] ?? [];
    const headerObj = row.reduce(
      (acc, cell) => {
        const h = cellStr(cell);
        if (h) acc[h] = "";
        return acc;
      },
      {} as Record<string, unknown>,
    );
    const keyCount = Object.keys(headerObj).length;
    if (keyCount < 2) continue;

    const m = mapHeader(headerObj);
    const score =
      (m.phone ? 5 : 0) + (m.name ? 3 : 0) + (m.email ? 1 : 0) + keyCount * 0.2;
    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  const headerCells = matrix[headerRowIndex] ?? [];
  const headers = headerCells.map((c, i) => cellStr(c) || `Coluna_${i + 1}`);

  const dataRows: Record<string, unknown>[] = [];
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const line = matrix[r];
    if (!line?.some((c) => cellStr(c))) continue;

    const record: Record<string, unknown> = {};
    headers.forEach((h, c) => {
      record[h] = line[c] ?? "";
    });
    dataRows.push(record);
  }

  if (dataRows.length > 0) return dataRows;

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
}

export function parseSpreadsheetBuffer(buffer: ArrayBuffer): ParsedLeadRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = readRows(sheet);
  if (rows.length === 0) return [];

  const mapping = mapHeader(rows[0]);
  const nameKey = findNameKey(rows[0], mapping);
  const phoneKey = detectPhoneColumn(rows, mapping, nameKey);

  const leads: ParsedLeadRow[] = [];

  for (const row of rows) {
    const name = cellStr(row[nameKey]);
    if (!name || looksLikePhone(name)) continue;

    const phone =
      (phoneKey ? cellPhone(row[phoneKey]) : undefined) ??
      (mapping.phone && mapping.phone !== phoneKey
        ? cellPhone(row[mapping.phone])
        : undefined);

    leads.push({
      name,
      email: mapping.email ? cellStr(row[mapping.email]) : undefined,
      phone,
      company: mapping.company ? cellStr(row[mapping.company]) : undefined,
      city: mapping.city ? cellStr(row[mapping.city]) : undefined,
      notes: mapping.notes ? cellStr(row[mapping.notes]) : undefined,
    });
  }

  return leads;
}

export type ImportPreview = {
  rowCount: number;
  columns: Array<{ header: string; field: string | null }>;
  sample: ParsedLeadRow[];
};

const FIELD_LABELS: Record<keyof ParsedLeadRow, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  company: "Empresa",
  city: "Cidade",
  notes: "Observações",
};

export function getSpreadsheetPreview(buffer: ArrayBuffer): ImportPreview {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return { rowCount: 0, columns: [], sample: [] };
  }

  const rows = readRows(sheet);
  if (rows.length === 0) {
    return { rowCount: 0, columns: [], sample: [] };
  }

  const mapping = mapHeader(rows[0]);
  const headers = Object.keys(rows[0]);
  const columns = headers.map((header) => {
    const field =
      (Object.entries(mapping).find(([, col]) => col === header)?.[0] as
        | keyof ParsedLeadRow
        | undefined) ?? null;
    return {
      header,
      field: field ? FIELD_LABELS[field] : null,
    };
  });

  const parsed = parseSpreadsheetBuffer(buffer);
  return {
    rowCount: parsed.length,
    columns,
    sample: parsed.slice(0, 3),
  };
}
