import type { LeadStatus } from "@/generated/prisma/client";
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
