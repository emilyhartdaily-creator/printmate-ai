'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ADMIN_RESOURCES, type AdminResource } from '@/lib/types';
import { formatPrice } from '@/lib/format';

type FieldType = 'text' | 'number' | 'checkbox' | 'textarea';

interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  /** hide from table view (long text/json) */
  tableHide?: boolean;
}

const FIELDS: Record<AdminResource, FieldDef[]> = {
  products: [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'base_price', label: 'Price (cents)', type: 'number' },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'image_url', label: 'Image URL', type: 'text', tableHide: true },
    { name: 'description', label: 'Description', type: 'textarea', tableHide: true },
    { name: 'active', label: 'Active', type: 'checkbox' },
  ],
  orders: [
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'customer_name', label: 'Customer', type: 'text' },
    { name: 'total', label: 'Total (cents)', type: 'number' },
    { name: 'status', label: 'Status', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'postal_code', label: 'Postal code', type: 'text' },
  ],
  customers: [
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'postal_code', label: 'Postal code', type: 'text' },
  ],
  print_partners: [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'postal_code', label: 'Postal code', type: 'text' },
    { name: 'active', label: 'Active', type: 'checkbox' },
  ],
  promo_codes: [
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'percent_off', label: 'Percent off', type: 'number' },
    { name: 'active', label: 'Active', type: 'checkbox' },
  ],
};

const TAB_LABELS: Record<string, string> = {
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  print_partners: 'Print partners',
  promo_codes: 'Promo codes',
  payouts: 'Payouts',
  analytics: 'Analytics',
};

type Row = Record<string, unknown>;

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `${value.length} item(s)`;
    const s = JSON.stringify(value);
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }
  const s = String(value);
  return s.length > 60 ? s.slice(0, 60) + '…' : s;
}

function ResourceTab({ resource }: { resource: AdminResource }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fields = FIELDS[resource];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${resource}`);
      const data = (await res.json()) as { rows?: Row[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setRows(data.rows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    setForm({});
    setEditingId(null);
    load();
  }, [load]);

  function setField(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function coerce(def: FieldDef, value: string): unknown {
    if (def.type === 'number') {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    if (def.type === 'checkbox') return value === 'true' || value === 'on';
    return value;
  }

  function formToBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const def of fields) {
      const raw = form[def.name];
      if (raw === undefined || raw === '') continue;
      if (def.type === 'checkbox') body[def.name] = raw === 'true';
      else body[def.name] = coerce(def, raw);
    }
    return body;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const url = editingId
        ? `/api/admin/${resource}/${editingId}`
        : `/api/admin/${resource}`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToBody()),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setForm({});
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  function startEdit(row: Row) {
    const f: Record<string, string> = {};
    for (const def of fields) {
      const v = row[def.name];
      f[def.name] =
        def.type === 'checkbox'
          ? v
            ? 'true'
            : 'false'
          : v === null || v === undefined
            ? ''
            : String(v);
    }
    setForm(f);
    setEditingId(String(row.id ?? ''));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true);
    setUploadError(null);
    try {
      const data = new FormData();
      data.append('file', f);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: data });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setField('image_url', json.url ?? '');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return;
    try {
      const res = await fetch(`/api/admin/${resource}/${id}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      if (editingId === id) {
        setEditingId(null);
        setForm({});
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const visibleFields = fields.filter((f) => !f.tableHide);

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="card">
        <h3 className="font-display text-lg font-bold">
          {editingId ? `Edit ${resource.slice(0, -1)}` : `Add ${resource.slice(0, -1)}`}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          {fields.map((def) =>
            def.type === 'checkbox' ? (
              <label key={def.name} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[def.name] === 'true'}
                  onChange={(e) => setField(def.name, e.target.checked ? 'true' : 'false')}
                />
                {def.label}
              </label>
            ) : def.type === 'textarea' ? (
              <div key={def.name} className="sm:col-span-2">
                <label className="label">{def.label}</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form[def.name] ?? ''}
                  onChange={(e) => setField(def.name, e.target.value)}
                />
              </div>
            ) : (
              <div key={def.name}>
                <label className="label">{def.label}</label>
                <input
                  type={def.type === 'number' ? 'number' : 'text'}
                  className="input"
                  value={form[def.name] ?? ''}
                  onChange={(e) => setField(def.name, e.target.value)}
                />
                {resource === 'products' && def.name === 'image_url' && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {form.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.image_url}
                        alt="Product preview"
                        className="h-16 w-16 rounded-xl border border-line object-cover"
                      />
                    ) : null}
                    <label className="btn-secondary cursor-pointer !px-4 !py-2 text-sm">
                      {uploading ? 'Uploading…' : 'Upload photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={uploading}
                        onChange={handleImageUpload}
                      />
                    </label>
                    {uploadError && (
                      <span className="text-sm text-red-300">{uploadError}</span>
                    )}
                  </div>
                )}
              </div>
            ),
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" className="btn-primary">
              {editingId ? 'Save changes' : 'Add record'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({});
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted">No records yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">
                  ID
                </th>
                {visibleFields.map((f) => (
                  <th
                    key={f.name}
                    className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={String(row.id ?? i)} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs text-muted">
                    {String(row.id ?? '').slice(0, 8)}
                  </td>
                  {visibleFields.map((f) => (
                    <td key={f.name} className="px-3 py-2">
                      {formatCell(row[f.name])}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="text-sm font-semibold text-brand-400 hover:underline"
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-sm font-semibold text-red-400 hover:underline"
                        onClick={() => handleDelete(String(row.id ?? ''))}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface PayoutRow {
  order_id: string;
  created_at: string;
  partner_id: string | null;
  partner_name: string | null;
  partner_email: string | null;
  total: number;
  printer_share: number;
  platform_share: number;
  payout_status: 'unpaid' | 'paid' | 'na';
}

function PayoutsTab() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [fee, setFee] = useState(30);
  const [feeInput, setFeeInput] = useState('30');
  const [totals, setTotals] = useState({ printer: 0, platform: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payouts');
      const data = (await res.json()) as {
        rows?: PayoutRow[];
        totals?: { printer: number; platform: number; paid: number };
        platform_fee_percent?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Failed to load payouts');
      setRows(data.rows ?? []);
      setTotals(data.totals ?? { printer: 0, platform: 0, paid: 0 });
      const f = Number(data.platform_fee_percent ?? 30);
      setFee(f);
      setFeeInput(String(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveFee() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform_fee_percent: Number(feeInput) }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Save failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(order_id: string) {
    setError(null);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="card">
        <h3 className="font-display text-lg font-bold">Your platform fee</h3>
        <p className="mt-1 text-sm text-muted">
          You keep this percent of every order. Printers automatically receive
          the rest ({100 - fee}%).
        </p>
        <div className="mt-4 flex max-w-sm items-end gap-3">
          <div className="flex-1">
            <label className="label" htmlFor="fee-input">
              Your cut (%)
            </label>
            <input
              id="fee-input"
              type="number"
              min={0}
              max={90}
              className="input"
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={saveFee} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-muted">Your earnings</p>
              <p className="font-display mt-1 text-3xl font-extrabold text-brand-300">
                {formatPrice(totals.platform)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">Owed to printers</p>
              <p className="font-display mt-1 text-3xl font-extrabold">
                {formatPrice(totals.printer)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">Paid out</p>
              <p className="font-display mt-1 text-3xl font-extrabold text-emerald-300">
                {formatPrice(totals.paid)}
              </p>
            </div>
          </div>

          <div className="card overflow-x-auto">
            {rows.length === 0 ? (
              <p className="text-muted">No payable orders yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">Order</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">Printer</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">Total</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">Printer gets</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">You keep</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">Status</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.order_id} className="border-t border-line">
                      <td className="px-3 py-2 font-mono text-xs text-muted">
                        {r.order_id.slice(0, 8)}
                      </td>
                      <td className="px-3 py-2">
                        {r.partner_name ?? <span className="text-muted">—</span>}
                      </td>
                      <td className="px-3 py-2">{formatPrice(r.total)}</td>
                      <td className="px-3 py-2">{formatPrice(r.printer_share)}</td>
                      <td className="px-3 py-2 font-semibold text-brand-300">
                        {formatPrice(r.platform_share)}
                      </td>
                      <td className="px-3 py-2">
                        {r.payout_status === 'paid' ? (
                          <span className="badge !border-emerald-500/40 !bg-emerald-500/10 !text-emerald-300">Paid</span>
                        ) : r.payout_status === 'na' ? (
                          <span className="badge">No printer</span>
                        ) : (
                          <span className="badge !border-amber-500/40 !bg-amber-500/10 !text-amber-300">Unpaid</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.payout_status === 'unpaid' && (
                          <button
                            className="text-sm font-semibold text-brand-400 hover:underline"
                            onClick={() => markPaid(r.order_id)}
                          >
                            Mark paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Pay printers with Wise, PayPal or bank transfer, then mark each
            order paid here. Fully automatic transfers need Stripe Connect
            (each printer onboards once) — a future upgrade. Keep these records
            for your tax filing.
          </p>
        </>
      )}
    </div>
  );
}

interface OrderLike {
  total?: unknown;
  status?: unknown;
  created_at?: unknown;
}

function AnalyticsTab() {
  const [orders, setOrders] = useState<OrderLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/orders');
        const data = (await res.json()) as { rows?: OrderLike[]; error?: string };
        if (!res.ok) throw new Error(data.error || 'Failed to load orders');
        setOrders(data.rows ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const totals = orders.map((o) =>
      typeof o.total === 'number' ? o.total : Number(o.total) || 0,
    );
    const revenue = totals.reduce((s, t) => s + t, 0);
    const count = orders.length;
    const byStatus: Record<string, number> = {};
    for (const o of orders) {
      const s = String(o.status ?? 'unknown');
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    const byDay: { day: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.push({ day: key.slice(5), revenue: 0 });
    }
    for (const o of orders) {
      const ts = String(o.created_at ?? '').slice(0, 10);
      const bucket = byDay.find((b, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - idx));
        return d.toISOString().slice(0, 10) === ts;
      });
      if (bucket) {
        bucket.revenue +=
          typeof o.total === 'number' ? o.total : Number(o.total) || 0;
      }
    }
    return { revenue, count, byStatus, byDay };
  }, [orders]);

  const maxRevenue = Math.max(1, ...stats.byDay.map((b) => b.revenue));

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-muted">Total revenue</p>
              <p className="font-display mt-1 text-3xl font-extrabold">
                {formatPrice(stats.revenue)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">Orders</p>
              <p className="font-display mt-1 text-3xl font-extrabold">
                {stats.count}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">Average order</p>
              <p className="font-display mt-1 text-3xl font-extrabold">
                {formatPrice(
                  stats.count > 0 ? Math.round(stats.revenue / stats.count) : 0,
                )}
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-bold">
              Revenue — last 14 days
            </h3>
            <svg
              viewBox="0 0 700 220"
              className="mt-4 w-full"
              role="img"
              aria-label="Revenue by day"
            >
              {stats.byDay.map((b, i) => {
                const barW = 700 / 14;
                const h = Math.max(2, (b.revenue / maxRevenue) * 170);
                const x = i * barW + 6;
                const y = 190 - h;
                return (
                  <g key={b.day}>
                    <rect
                      x={x}
                      y={y}
                      width={barW - 12}
                      height={h}
                      rx={4}
                      fill="url(#pm-grad)"
                      opacity={b.revenue > 0 ? 1 : 0.15}
                    >
                      <title>
                        {b.day}: {formatPrice(b.revenue)}
                      </title>
                    </rect>
                    <text
                      x={x + (barW - 12) / 2}
                      y={208}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#a1a1aa"
                    >
                      {b.day}
                    </text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="pm-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-bold">Orders by status</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <span key={status} className="badge">
                  {status}: {count}
                </span>
              ))}
              {Object.keys(stats.byStatus).length === 0 && (
                <p className="text-muted">No orders yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<string>('orders');

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      setAuthed(res.status !== 401);
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setPassword('');
      setAuthed(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
  }

  const tabs = [...ADMIN_RESOURCES, 'payouts', 'analytics'] as string[];

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="section-title font-display">
          <span className="gradient-text">Admin</span>
        </h1>

        {authed === null ? (
          <p className="mt-8 text-muted">Checking session…</p>
        ) : !authed ? (
          <div className="card mx-auto mt-8 max-w-md">
            <h2 className="font-display text-xl font-bold">Sign in</h2>
            <form onSubmit={handleLogin} className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="admin-password">
                  Admin password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {loginError && (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {loginError}
                </p>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loggingIn}>
                {loggingIn ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`chip ${tab === t ? 'chip-active' : ''}`}
                  >
                    {TAB_LABELS[t] ?? t}
                  </button>
                ))}
              </div>
              <button className="btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <div className="mt-6">
              {tab === 'analytics' ? (
                <AnalyticsTab />
              ) : tab === 'payouts' ? (
                <PayoutsTab />
              ) : (
                <ResourceTab
                  key={tab}
                  resource={tab as AdminResource}
                />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
