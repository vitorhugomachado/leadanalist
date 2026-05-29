// Apify API helper — token NEVER exposed to client
const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR_ID = "compass~crawler-google-places";

function getToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN não configurado");
  return token;
}

export interface ApifyRunResult {
  runId: string;
  datasetId: string;
  status: string;
}

export async function startApifyRun(input: {
  searchString: string;
  maxCrawledPlacesPerSearch: number;
  language: string;
  countryCode: string;
}): Promise<{ id: string; defaultDatasetId: string }> {
  const token = getToken();
  const res = await fetch(
    `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apify run failed: ${err}`);
  }
  const data = await res.json() as { data: { id: string; defaultDatasetId: string } };
  return data.data;
}

export async function getRunStatus(runId: string): Promise<{ status: string; defaultDatasetId: string }> {
  const token = getToken();
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
  if (!res.ok) throw new Error("Falha ao verificar status do run");
  const data = await res.json() as { data: { status: string; defaultDatasetId: string } };
  return data.data;
}

export async function getDatasetItems(datasetId: string): Promise<ApifyPlace[]> {
  const token = getToken();
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&clean=true&format=json&limit=2000`
  );
  if (!res.ok) throw new Error("Falha ao baixar dataset");
  return res.json() as Promise<ApifyPlace[]>;
}

export interface ApifyPlace {
  title?: string;
  name?: string;
  phone?: string;
  phoneUnformatted?: string;
  website?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  categoryName?: string;
  totalScore?: number;
  reviewsCount?: number;
  location?: { lat: number; lng: number };
  url?: string;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  openingHours?: Array<{ day: string; hours: string }>;
}

export function mapApifyPlaceToLead(place: ApifyPlace, batchId: string) {
  const phone = place.phoneUnformatted ?? place.phone ?? null;
  const cleanPhone = phone ? phone.replace(/\D/g, "").replace(/^0/, "").replace(/^55/, "") : null;
  const formattedPhone = cleanPhone && cleanPhone.length >= 10
    ? `+55${cleanPhone}`
    : phone;

  return {
    batchId,
    name: place.title ?? place.name ?? "Empresa",
    phone: formattedPhone,
    email: place.email ?? null,
    company: place.title ?? place.name ?? null,
    city: place.city ?? null,
    notes: place.openingHours
      ? place.openingHours.map((h) => `${h.day}: ${h.hours}`).join(" | ")
      : null,
    status: "NOVO" as const,
    source: "APIFY" as const,
    googleMapsUrl: place.url ?? null,
    latitude: place.location?.lat ?? null,
    longitude: place.location?.lng ?? null,
    rating: place.totalScore ?? null,
    reviewsCount: place.reviewsCount ?? null,
    website: place.website ?? null,
    category: place.categoryName ?? null,
    address: place.address ?? null,
    neighborhood: place.neighborhood ?? null,
    zipCode: place.postalCode ?? null,
  };
}
