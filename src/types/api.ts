import type { LeadStatus, BatchSource } from "@/generated/prisma/client";
import type { BatchStats } from "@/lib/batch-utils";

export type UserSummary = { id: string; name: string; email: string };

export type BatchWithStats = {
  id: string;
  name: string;
  fileName: string;
  importedAt: string;
  importedById: string;
  importedBy: UserSummary;
  stats: BatchStats;
  source?: BatchSource;
  city?: string | null;
  state?: string | null;
  keyword?: string | null;
  apifyStatus?: string | null;
  totalImported?: number;
};

export type LeadRecord = {
  id: string;
  batchId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  notes: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  // Apify fields
  source?: BatchSource;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviewsCount?: number | null;
  website?: string | null;
  category?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  zipCode?: string | null;
};

export type DashboardData = {
  batchCount: number;
  totals: BatchStats;
  batches: Array<{
    id: string;
    name: string;
    importedAt: string;
    importedByName: string;
    stats: BatchStats;
  }>;
};
