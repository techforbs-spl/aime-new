import React, { useMemo, useState } from "react";


// Persona Admin UI Panel – V1 (React Spec)
// • Built with React + Tailwind (no external deps required)
// • Single-file component for easy drop-in to Admin Dashboard shell
// • Includes: list + filters, create/edit drawer, activation toggle, tiering, routing, audit stubs
// • All API calls are stubbed; replace with real endpoints in integrate* functions


// -----------------------------
// Types
// -----------------------------
export type PersonaTier = "Creator" | "Ambassador" | "Pro" | "AI-Agent";
export type PersonaStatus = "active" | "inactive" | "draft";


export interface Persona {
  id: string;
  name: string;
  handle: string; // social or internal handle
  tier: PersonaTier;
  partner: string; // e.g., Allmax, Adeeva, GIMA
  bank: string; // Persona Bank name/id
  language: string; // en, fr, th, etc.
  tone: string; // e.g., "evidence-based", "motivational"
  status: PersonaStatus;
  lastDeployed?: string; // ISO string
  createdAt: string; // ISO string
  notes?: string;
}


// -----------------------------
// Mock Data (replace with live fetch)
// -----------------------------
const seed: Persona[] = [
  { id: "p001", name: "Allmax Coach", handle: "@allmax_coach", tier: "Ambassador", partner: "Allmax", bank: "Allmax-Core", language: "en", tone: "motivational", status: "active", lastDeployed: "2025-11-09T07:15:00Z", createdAt: "2025-10-10T09:00:00Z", notes: "High-performance tips" },
  { id: "p002", name: "Adeeva Clinician", handle: "@adeeva_clinic", tier: "Pro", partner: "Adeeva", bank: "Adeeva-Clinical", language: "en", tone: "evidence-based", status: "inactive", lastDeployed: undefined, createdAt: "2025-10-12T09:00:00Z", notes: "Science-first tone" },
  { id: "p003", name: "GIMA Tutor", handle: "@gima_tutor", tier: "AI-Agent", partner: "GIMA", bank: "GIMA-Academy", language: "en", tone: "educational", status: "draft", lastDeployed: undefined, createdAt: "2025-10-18T09:00:00Z" },
  { id: "p004", name: "Maxopolis Motivator", handle: "@max_motivate", tier: "Creator", partner: "Maxopolis", bank: "Maxopolis-UGC", language: "en", tone: "motivational", status: "active", lastDeployed: "2025-11-08T14:20:00Z", createdAt: "2025-10-25T09:00:00Z" },
];


// -----------------------------
// Utility / UI helpers
// -----------------------------
function Badge({ children, color = "gray" }: { children: any; color?: "gray" | "green" | "yellow" | "red" | "blue" }) {
  const bg: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bg[color]}`}>{children}</span>;
}


function StatusBadge({ status }: { status: PersonaStatus }) {
  const map: Record<PersonaStatus, { label: string; color: "green" | "yellow" | "gray" }> = {
    active: { label: "Active", color: "green" },
    inactive: { label: "Inactive", color: "gray" },
    draft: { label: "Draft", color: "yellow" },
  };
  const cfg = map[status];
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}


function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className={`w-10 h-6 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300"}`}>
        <div className={`h-6 w-6 rounded-full bg-white shadow transform transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <input aria-label={label || "toggle"} type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}


function SectionTitle({ children, right }: { children: any; right?: any }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold">{children}</h2>
      {right}
    </div>
  );
}


// -----------------------------
// API stubs (replace with real)
// -----------------------------
async function integrateFetchPersonas(): Promise<Persona[]> {
  // TODO: replace with real API call
  return Promise.resolve(seed);
}


async function integrateSavePersona(p: Persona): Promise<void> {
  // TODO: implement POST/PUT
  console.log("savePersona", p);
}


async function integrateDeployPersonaBank(bank: string, partner: string): Promise<{ ok: boolean; message: string }> {
  // TODO: call deployment endpoint (staging by default)
  return Promise.resolve({ ok: true, message: `Bank ${bank} deployed to ${partner} (staging)` });
}


async function integratePushToStaging(ids: string[]): Promise<{ ok: boolean; message: string }> {
  // TODO: wire to CI/CD trigger
  return Promise.resolve({ ok: true, message: `Pushed ${ids.length} persona(s) to staging.` });
}


async function integrateRunQACheck(ids: string[]): Promise<{ ok: boolean; pass: number; fail: number }> {
  // TODO: connect to QA Protocol V3 validation endpoint
  return Promise.resolve({ ok: true, pass: ids.length, fail: 0 });
}


// -----------------------------
// Main Component
// -----------------------------
export default function PersonaAdminUIPanel() {
  const [personas, setPersonas] = useState<Persona[]>(seed);
  const [query, setQuery] = useState("");
  const [partner, setPartner] = useState("all");
  const [tier, setTier] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [autoRoute, setAutoRoute] = useState(true);

  // Quick stats
  const stats = useMemo(() => {
    return {
      total: personas.length,
      active: personas.filter((p) => p.status === "active").length,
      inactive: personas.filter((p) => p.status === "inactive").length,
      draft: personas.filter((p) => p.status === "draft").length,
    };
  }, [personas]);


  // Derived lists
  const partners = useMemo(() => ["all", ...Array.from(new Set(personas.map((p) => p.partner)))], [personas]);
  const tiers: ("all" | PersonaTier)[] = ["all", "Creator", "Ambassador", "Pro", "AI-Agent"];
  const statuses: ("all" | PersonaStatus)[] = ["all", "active", "inactive", "draft"];


  const filtered = useMemo(() => {
    return personas.filter((p) => {
      const q = query.toLowerCase();
      const qMatch = !q || [p.name, p.handle, p.bank, p.tone].some((v) => v.toLowerCase().includes(q));
      const partnerMatch = partner === "all" || p.partner === partner;
      const tierMatch = tier === "all" || p.tier === tier;
      const statusMatch = status === "all" || p.status === status;
      return qMatch && partnerMatch && tierMatch && statusMatch;
    });
  }, [personas, query, partner, tier, status]);

  // Page selection helpers
  const allSelectedOnPage = useMemo(() => filtered.length > 0 && filtered.every((p) => selected.includes(p.id)), [filtered, selected]);
  function toggleSelectAllOnPage() {
    if (allSelectedOnPage) {
      setSelected((prev) => prev.filter((id) => !filtered.some((p) => p.id === id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...filtered.map((p) => p.id)])));
    }
  }
  function clearSelection() {
    setSelected([]);
  }
  function clearFilters() {
    setQuery("");
    setPartner("all");
    setTier("all");
    setStatus("all");
  }


  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }


  function openEditor(p?: Persona) {
    setEditing(p || {
      id: `p_${Math.random().toString(36).slice(2, 8)}`,
      name: "",
      handle: "",
      tier: "Creator",
      partner: "Allmax",
      bank: "Default-Bank",
      language: "en",
      tone: "motivational",
      status: "draft",
      createdAt: new Date().toISOString(),
    });
    setDrawerOpen(true);
  }


  async function saveEditor() {
    if (!editing) return;
    await integrateSavePersona(editing);
    setPersonas((prev) => {
      const idx = prev.findIndex((x) => x.id === editing.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = editing;
        return next;
      }
      return [editing, ...prev];
    });
    setDrawerOpen(false);
  }


  async function pushSelectedToStaging() {
    const res = await integratePushToStaging(selected);
    alert(res.message);
  }


  async function runQAOnSelected() {
    const res = await integrateRunQACheck(selected);
    alert(`QA Results — Pass: ${res.pass}, Fail: ${res.fail}`);
  }


  async function deployBank(p: Persona) {
    const res = await integrateDeployPersonaBank(p.bank, p.partner);
    alert(res.message);
  }


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">👤 Persona Admin</h1>
          <p className="text-sm text-gray-500">Manage Persona Bank entries, activation, tiers, and deployment. Auto-route: <strong>{autoRoute ? "ON" : "OFF"}</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <Toggle checked={autoRoute} onChange={setAutoRoute} label="Auto-Routing" />
          <button onClick={() => openEditor()} className="px-4 py-2 rounded-xl bg-black text-white shadow hover:opacity-90">New Persona</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-rows-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Total</div>
          <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Active</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats.active}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Inactive</div>
          <div className="mt-1 text-2xl font-semibold text-gray-600">{stats.inactive}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Draft</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats.draft}</div>
        </div>
      </div>

      {/* Bulk selection toolbar */}
      {selected.length > 0 && (
        <div className="rounded-xl bg-black text-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow">
          <div className="text-sm">{selected.length} selected</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={pushSelectedToStaging} className="px-3 py-2 rounded-lg bg-white text-black">Push to Staging</button>
            <button onClick={runQAOnSelected} className="px-3 py-2 rounded-lg bg-white text-black">Run QA</button>
            <button onClick={clearSelection} className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20">Clear</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl border bg-white p-3 shadow-sm">
        <input className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black/10 focus:border-black/20" placeholder="Search name, handle, bank, tone…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black/10 focus:border-black/20" value={partner} onChange={(e) => setPartner(e.target.value)}>
          {partners.map((p) => (
            <option key={p} value={p}>{p === "all" ? "All Partners" : p}</option>
          ))}
        </select>
        <select className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black/10 focus:border-black/20" value={tier} onChange={(e) => setTier(e.target.value)}>
          {tiers.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All Tiers" : t}</option>
          ))}
        </select>
        <select className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black/10 focus:border-black/20" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={clearFilters} className="px-3 py-2 rounded-xl border shadow-sm">Reset</button>
        </div>
      </div>


      {/* Table */}
      <div className="bg-white rounded-2xl shadow border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur text-left">
                <th className="p-3 w-10"><input type="checkbox" checked={allSelectedOnPage} onChange={toggleSelectAllOnPage} /></th>
                <th className="p-3">Persona</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Partner</th>
                <th className="p-3">Bank</th>
                <th className="p-3">Tone</th>
                <th className="p-3">Language</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Deployed</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const checked = selected.includes(p.id);
                return (
                  <tr key={p.id} className="border-t odd:bg-white even:bg-gray-50/50 hover:bg-gray-50">
                    <td className="p-3 align-top">
                      <input type="checkbox" checked={checked} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.handle}</div>
                    </td>
                    <td className="p-3 align-top"><Badge color="blue">{p.tier}</Badge></td>
                    <td className="p-3 align-top">{p.partner}</td>
                    <td className="p-3 align-top">{p.bank}</td>
                    <td className="p-3 align-top">{p.tone}</td>
                    <td className="p-3 align-top">{p.language}</td>
                    <td className="p-3 align-top"><StatusBadge status={p.status} /></td>
                    <td className="p-3 align-top text-xs text-gray-500">{p.lastDeployed ? new Date(p.lastDeployed).toLocaleString() : "–"}</td>
                    <td className="p-3 align-top text-right space-x-2">
                      <button onClick={() => deployBank(p)} className="px-3 py-1.5 rounded-lg border">Deploy</button>
                      <button onClick={() => { setEditing(p); setDrawerOpen(true); }} className="px-3 py-1.5 rounded-lg border">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-xs text-gray-500">Showing {filtered.length} of {personas.length} personas • Selected: {selected.length}</div>
      </div>


      {/* Audit & Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border">
          <SectionTitle>Routing Health</SectionTitle>
          <ul className="text-sm list-disc list-inside text-gray-600">
            <li>Signal → Persona routing operational</li>
            <li>Prompt Layer mapped to all active tiers</li>
            <li>Governance sync enabled</li>
          </ul>
        </div>
        <div className="p-4 rounded-2xl border">
          <SectionTitle>Recent Activity</SectionTitle>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Allmax Coach deployed to staging</li>
            <li>QA check passed for 3 personas</li>
            <li>Adeeva Clinician edited (tier: Pro)</li>
          </ul>
        </div>
        <div className="p-4 rounded-2xl border">
          <SectionTitle>Quick Actions</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 rounded-xl border">Export JSON</button>
            <button className="px-3 py-2 rounded-xl border">Import JSON</button>
            <button className="px-3 py-2 rounded-xl border">Sync Governance</button>
          </div>
        </div>
      </div>


      {/* Drawer */}
      {drawerOpen && editing && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col">
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur -mx-6 px-6 py-3 border-b flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{editing.id.startsWith("p_") ? "Create Persona" : "Edit Persona"}</h3>
              <button className="text-gray-500 hover:text-gray-800" onClick={() => setDrawerOpen(false)}>✕</button>
            </div>


            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600">Name</span>
                <input className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Handle</span>
                <input className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.handle} onChange={(e) => setEditing({ ...editing, handle: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-gray-600">Tier</span>
                  <select className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value as PersonaTier })}>
                    <option>Creator</option>
                    <option>Ambassador</option>
                    <option>Pro</option>
                    <option>AI-Agent</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Partner</span>
                  <select className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.partner} onChange={(e) => setEditing({ ...editing, partner: e.target.value })}>
                    <option>Allmax</option>
                    <option>Adeeva</option>
                    <option>GIMA</option>
                    <option>Maxopolis</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-gray-600">Persona Bank</span>
                  <input className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.bank} onChange={(e) => setEditing({ ...editing, bank: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Language</span>
                  <input className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.language} onChange={(e) => setEditing({ ...editing, language: e.target.value })} />
                </label>
              </div>
              <label className="block">
                <span className="text-sm text-gray-600">Tone</span>
                <input className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.tone} onChange={(e) => setEditing({ ...editing, tone: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Status</span>
                <select className="mt-1 w-full border rounded-xl px-3 py-2" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as PersonaStatus })}>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Notes</span>
                <textarea className="mt-1 w-full border rounded-xl px-3 py-2" rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </label>
            </div>


            <div className="mt-6 flex items-center justify-between">
              <button onClick={saveEditor} className="px-4 py-2 rounded-xl bg-black text-white">Save</button>
              <div className="flex items-center gap-3">
                <Toggle checked={editing.status === "active"} onChange={(v) => setEditing({ ...editing, status: v ? "active" : "inactive" })} label="Activate" />
              </div>
            </div>


            <div className="mt-6 border-t pt-4">
              <SectionTitle>Deployment</SectionTitle>
              <div className="flex gap-2">
                <button onClick={() => deployBank(editing)} className="px-3 py-2 rounded-xl border">Deploy Bank to Staging</button>
                <button onClick={() => setDrawerOpen(false)} className="px-3 py-2 rounded-xl border">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
