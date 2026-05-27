"use client";

import { useEffect, useState } from "react";
import type { LeadStatus } from "@/generated/prisma/client";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import type { LeadRecord } from "@/types/api";
import { X } from "lucide-react";

export function LeadEditModal({
  batchId,
  lead,
  open,
  onClose,
  onSaved,
}: {
  batchId: string;
  lead: LeadRecord | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: LeadRecord) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    notes: "",
    status: "NOVO" as LeadStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;
    setForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      city: lead.city ?? "",
      notes: lead.notes ?? "",
      status: lead.status,
    });
    setError(null);
  }, [lead]);

  if (!open || !lead) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/batches/${batchId}/leads/${lead!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        city: form.city.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar.");
      return;
    }

    onSaved({
      ...lead!,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      city: data.city,
      notes: data.notes,
      status: data.status,
      updatedAt:
        typeof data.updatedAt === "string"
          ? data.updatedAt
          : new Date(data.updatedAt).toISOString(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Editar lead</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Nome *">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="E-mail">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Empresa">
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Cidade">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as LeadStatus })
              }
              className={inputClass}
            >
              {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observações">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
