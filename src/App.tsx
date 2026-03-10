import { useState, useMemo, useEffect } from "react";

const STATUTS = [
  { id: "prospect", label: "Prospect", color: "#94a3b8", bg: "#1e293b" },
  { id: "contact", label: "Contacté", color: "#38bdf8", bg: "#0c2a3e" },
  { id: "negociation", label: "Négociation", color: "#f59e0b", bg: "#2d1f00" },
  { id: "gagne", label: "Gagné", color: "#4ade80", bg: "#052e16" },
  { id: "perdu", label: "Perdu", color: "#f87171", bg: "#2d0b0b" },
];

const TYPES_LOGEMENT = ["Studio", "T1", "T2", "T3", "T4", "T5"];

const emptyClient = {
  id: null, nom: "", prenom: "", email: "", telephone: "", entreprise: "",
  statut: "prospect", valeur: "", notes: "",
  adresseClient: "", codePostalClient: "", villeClient: "",
  memeAdresse: false,
  adresseLocation: "", codePostalLocation: "", villeLocation: "",
  typeLogement: "Studio", surfaceLogement: "",
  relances: [], dateCreation: "", dateModif: ""
};

function Badge({ statut }) {
  const s = STATUTS.find(x => x.id === statut) || STATUTS[0];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}40`,
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 1
    }}>{s.label}</span>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      borderBottom: "1px solid #1e293b", paddingBottom: 10, marginBottom: 16, marginTop: 28
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 13, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "20px 24px", flex: 1, minWidth: 130 }}>
      <div style={{ color: "#475569", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color: accent || "#f1f5f9", fontSize: 26, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>{value}</div>
    </div>
  );
}

function RelanceForm({ onAdd }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#94a3b8", padding: "6px 10px", fontSize: 12, flex: "0 0 auto" }} />
      <input placeholder="Objet de la relance…" value={note} onChange={e => setNote(e.target.value)}
        style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "6px 12px", fontSize: 12, flex: 1 }} />
      <button onClick={() => { if (date && note) { onAdd({ date, note, fait: false, id: Date.now() }); setDate(""); setNote(""); } }}
        style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+</button>
    </div>
  );
}

export default function CRM() {
  const defaultClients = [
    {
      id: 1, nom: "Dupont", prenom: "Marie", email: "marie.dupont@gmail.com", telephone: "06 11 22 33 44", entreprise: "",
      statut: "negociation", valeur: "1800", notes: "Intéressée par la formule premium.",
      adresseClient: "12 rue des Lilas", codePostalClient: "75011", villeClient: "Paris",
      memeAdresse: false,
      adresseLocation: "5 avenue de la Mer", codePostalLocation: "06400", villeLocation: "Cannes",
      typeLogement: "T3", surfaceLogement: "65",
      relances: [{ id: 1, date: "2026-03-15", note: "Suivi proposition tarifaire", fait: false }],
      dateCreation: "2026-01-10", dateModif: "2026-03-10"
    },
    {
      id: 2, nom: "Martin", prenom: "Lucas", email: "l.martin@outlook.fr", telephone: "07 55 66 77 88", entreprise: "",
      statut: "gagne", valeur: "2400", notes: "Contrat signé. Prise en charge dès avril.",
      adresseClient: "8 allée des Pins", codePostalClient: "33000", villeClient: "Bordeaux",
      memeAdresse: false,
      adresseLocation: "3 rue du Port", codePostalLocation: "17410", villeLocation: "Saint-Martin-de-Ré",
      typeLogement: "T2", surfaceLogement: "42",
      relances: [], dateCreation: "2026-01-20", dateModif: "2026-02-28"
    },
    {
      id: 3, nom: "Bernard", prenom: "Claire", email: "c.bernard@free.fr", telephone: "06 99 88 77 66", entreprise: "",
      statut: "prospect", valeur: "900", notes: "",
      adresseClient: "22 rue Nationale", codePostalClient: "69001", villeClient: "Lyon",
      memeAdresse: true,
      adresseLocation: "22 rue Nationale", codePostalLocation: "69001", villeLocation: "Lyon",
      typeLogement: "Studio", surfaceLogement: "28",
      relances: [], dateCreation: "2026-03-01", dateModif: "2026-03-01"
    },
  ];

  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem("orbit-crm-clients");
      return saved ? JSON.parse(saved) : defaultClients;
    } catch { return defaultClients; }
  });

  useEffect(() => {
    localStorage.setItem("orbit-crm-clients", JSON.stringify(clients));
  }, [clients]);

  const [view, setView] = useState("liste");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [sortBy, setSortBy] = useState("dateCreation");

  const now = () => new Date().toISOString().split("T")[0];

  const handleMemeAdresse = (checked) => {
    if (checked) {
      setForm(f => ({
        ...f, memeAdresse: true,
        adresseLocation: f.adresseClient,
        codePostalLocation: f.codePostalClient,
        villeLocation: f.villeClient,
      }));
    } else {
      setForm(f => ({ ...f, memeAdresse: false }));
    }
  };

  const filteredClients = useMemo(() => {
    return clients
      .filter(c => filterStatut === "tous" || c.statut === filterStatut)
      .filter(c => {
        const q = search.toLowerCase();
        return !q || [c.nom, c.prenom, c.email, c.villeLocation, c.typeLogement, c.villeClient].some(v => (v || "").toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === "valeur") return (parseFloat(b.valeur) || 0) - (parseFloat(a.valeur) || 0);
        if (sortBy === "nom") return a.nom.localeCompare(b.nom);
        return b.dateCreation.localeCompare(a.dateCreation);
      });
  }, [clients, search, filterStatut, sortBy]);

  const stats = useMemo(() => {
    const total = clients.length;
    const gagnes = clients.filter(c => c.statut === "gagne");
    const ca = gagnes.reduce((s, c) => s + (parseFloat(c.valeur) || 0), 0);
    const pipeline = clients.filter(c => ["contact", "negociation"].includes(c.statut)).reduce((s, c) => s + (parseFloat(c.valeur) || 0), 0);
    const relancesAFaire = clients.flatMap(c => c.relances).filter(r => !r.fait && r.date >= now()).length;
    const tauxConv = total > 0 ? Math.round((gagnes.length / total) * 100) : 0;
    const byStat = STATUTS.map(s => ({ ...s, count: clients.filter(c => c.statut === s.id).length }));
    const byType = TYPES_LOGEMENT.map(t => ({ t, count: clients.filter(c => c.typeLogement === t).length })).filter(x => x.count > 0);
    return { total, ca, pipeline, relancesAFaire, tauxConv, byStat, byType };
  }, [clients]);

  const openNew = () => { setForm({ ...emptyClient, id: Date.now(), dateCreation: now(), dateModif: now() }); setEditMode(true); setSelected(null); setView("fiche"); };
  const openClient = (c) => { setSelected(c); setForm({ ...c }); setEditMode(false); setView("fiche"); };
  const saveClient = () => {
    const updated = { ...form, dateModif: now() };
    if (clients.find(c => c.id === form.id)) setClients(clients.map(c => c.id === form.id ? updated : c));
    else setClients([...clients, updated]);
    setSelected(updated); setEditMode(false);
  };
  const deleteClient = (id) => { setClients(clients.filter(c => c.id !== id)); setView("liste"); };
  const addRelance = (relance) => {
    const updated = { ...form, relances: [...form.relances, relance], dateModif: now() };
    setForm(updated);
    if (!editMode) { setClients(clients.map(c => c.id === form.id ? updated : c)); setSelected(updated); }
  };
  const toggleRelance = (rid) => {
    const updated = { ...form, relances: form.relances.map(r => r.id === rid ? { ...r, fait: !r.fait } : r), dateModif: now() };
    setForm(updated); setClients(clients.map(c => c.id === form.id ? updated : c)); setSelected(updated);
  };

  const inp = (field, label, type = "text", opts = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ color: "#475569", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{label}</label>}
      {type === "select" ? (
        <select value={form[field] || ""} onChange={e => setForm({ ...form, [field]: e.target.value })} disabled={!editMode}
          style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "8px 12px", fontSize: 14 }}>
          {opts.options?.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={form[field] || ""} onChange={e => setForm({ ...form, [field]: e.target.value })} disabled={!editMode}
          rows={3} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "8px 12px", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
      ) : (
        <input type={type} value={form[field] || ""} onChange={e => setForm({ ...form, [field]: e.target.value })}
          disabled={!editMode || opts.disabled}
          style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: opts.disabled ? "#475569" : "#e2e8f0", padding: "8px 12px", fontSize: 14, opacity: opts.disabled ? 0.5 : 1 }} />
      )}
    </div>
  );

  const navBtn = (id, icon, label) => (
    <button onClick={() => setView(id)} style={{
      background: view === id ? "#1e293b" : "transparent",
      border: view === id ? "1px solid #334155" : "1px solid transparent",
      color: view === id ? "#f1f5f9" : "#64748b",
      borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 6
    }}>{icon} {label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔑</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>Orbit CRM <span style={{ color: "#475569", fontWeight: 400, fontSize: 12 }}>· Conciergerie</span></div>
            <div style={{ color: "#475569", fontSize: 11 }}>{clients.length} client{clients.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {navBtn("liste", "☰", "Clients")}
          {navBtn("kanban", "⊞", "Pipeline")}
          {navBtn("stats", "◎", "Statistiques")}
        </nav>
        <button onClick={openNew} style={{
          background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff",
          border: "none", borderRadius: 10, padding: "9px 20px", cursor: "pointer",
          fontWeight: 700, fontSize: 13
        }}>＋ Nouveau client</button>
      </div>

      {/* LISTE */}
      {view === "liste" && (
        <div style={{ padding: "24px 32px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <input placeholder="🔍  Rechercher nom, ville, type de logement…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, color: "#e2e8f0", padding: "9px 16px", fontSize: 13, flex: "1 1 200px" }} />
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, color: "#94a3b8", padding: "9px 14px", fontSize: 13 }}>
              <option value="tous">Tous les statuts</option>
              {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, color: "#94a3b8", padding: "9px 14px", fontSize: 13 }}>
              <option value="dateCreation">Plus récents</option>
              <option value="valeur">Valeur ↓</option>
              <option value="nom">Nom A-Z</option>
            </select>
          </div>
          <div style={{ border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
                  {["Client", "Bien en location", "Logement", "Statut", "Valeur / an", "Relances", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#475569", fontSize: 11, letterSpacing: 1, fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#334155" }}>Aucun client trouvé</td></tr>
                )}
                {filteredClients.map((c, i) => {
                  const relancesEnCours = c.relances.filter(r => !r.fait).length;
                  return (
                    <tr key={c.id} onClick={() => openClient(c)} style={{ borderBottom: "1px solid #1e293b", cursor: "pointer", background: i % 2 === 0 ? "transparent" : "#0a0f1a" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "#0a0f1a"}>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.prenom} {c.nom}</div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>{c.email}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontSize: 13 }}>{c.adresseLocation || <span style={{ color: "#334155" }}>—</span>}</div>
                        <div style={{ color: "#475569", fontSize: 12 }}>{[c.codePostalLocation, c.villeLocation].filter(Boolean).join(" ")}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>{c.typeLogement || "—"}</span>
                        {c.surfaceLogement && <span style={{ color: "#475569", fontSize: 11, marginLeft: 6 }}>{c.surfaceLogement} m²</span>}
                      </td>
                      <td style={{ padding: "13px 16px" }}><Badge statut={c.statut} /></td>
                      <td style={{ padding: "13px 16px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#4ade80" }}>
                        {c.valeur ? Number(c.valeur).toLocaleString("fr-FR") + " €" : "—"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {relancesEnCours > 0
                          ? <span style={{ background: "#2d1f00", color: "#f59e0b", border: "1px solid #f59e0b40", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{relancesEnCours} à faire</span>
                          : <span style={{ color: "#334155", fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: "13px 16px" }}><span style={{ color: "#3b82f6", fontSize: 18 }}>›</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FICHE CLIENT */}
      {view === "fiche" && (
        <div style={{ padding: "24px 32px", maxWidth: 960 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={() => setView("liste")} style={{ background: "#1e293b", border: "none", color: "#94a3b8", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}>← Retour</button>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              {form.id && clients.find(c => c.id === form.id) ? `${form.prenom} ${form.nom}` : "Nouveau client"}
            </h2>
            {!editMode && selected && <Badge statut={selected.statut} />}
          </div>

          {/* INFOS PERSONNELLES */}
          <SectionTitle icon="👤" title="Informations personnelles" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {inp("prenom", "Prénom")}
            {inp("nom", "Nom")}
            {inp("telephone", "Téléphone", "tel")}
            {inp("email", "Email", "email")}
            {inp("entreprise", "Entreprise (optionnel)")}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ color: "#475569", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Statut</label>
              <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} disabled={!editMode}
                style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "8px 12px", fontSize: 14 }}>
                {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* ADRESSE PERSONNELLE */}
          <SectionTitle icon="🏠" title="Adresse personnelle" />
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 2fr", gap: 14 }}>
            {inp("adresseClient", "Adresse")}
            {inp("codePostalClient", "Code postal")}
            {inp("villeClient", "Ville")}
          </div>

          {/* BIEN EN LOCATION */}
          <SectionTitle icon="🔑" title="Bien en location" />

          {/* Checkbox même adresse */}
          <div
            onClick={() => editMode && handleMemeAdresse(!form.memeAdresse)}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: editMode ? "pointer" : "default", userSelect: "none", width: "fit-content" }}>
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              border: `2px solid ${form.memeAdresse ? "#3b82f6" : "#334155"}`,
              background: form.memeAdresse ? "#3b82f6" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0
            }}>
              {form.memeAdresse && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: form.memeAdresse ? "#e2e8f0" : "#64748b" }}>
              Même adresse que le propriétaire
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 2fr", gap: 14 }}>
            {inp("adresseLocation", "Adresse du bien", "text", { disabled: form.memeAdresse })}
            {inp("codePostalLocation", "Code postal", "text", { disabled: form.memeAdresse })}
            {inp("villeLocation", "Ville", "text", { disabled: form.memeAdresse })}
          </div>

          {/* LOGEMENT */}
          <SectionTitle icon="🏢" title="Caractéristiques du logement" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ color: "#475569", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Type de logement</label>
              <select value={form.typeLogement || "Studio"} onChange={e => setForm({ ...form, typeLogement: e.target.value })} disabled={!editMode}
                style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "8px 12px", fontSize: 14 }}>
                {TYPES_LOGEMENT.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ color: "#475569", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Surface</label>
              <div style={{ display: "flex" }}>
                <input type="number" value={form.surfaceLogement || ""} onChange={e => setForm({ ...form, surfaceLogement: e.target.value })} disabled={!editMode}
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px 0 0 8px", color: "#e2e8f0", padding: "8px 12px", fontSize: 14, flex: 1, minWidth: 0 }} />
                <span style={{ background: "#0f172a", border: "1px solid #334155", borderLeft: "none", borderRadius: "0 8px 8px 0", color: "#475569", padding: "8px 12px", fontSize: 13, whiteSpace: "nowrap" }}>m²</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ color: "#475569", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Valeur annuelle estimée</label>
              <div style={{ display: "flex" }}>
                <input type="number" value={form.valeur || ""} onChange={e => setForm({ ...form, valeur: e.target.value })} disabled={!editMode}
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px 0 0 8px", color: "#e2e8f0", padding: "8px 12px", fontSize: 14, flex: 1, minWidth: 0 }} />
                <span style={{ background: "#0f172a", border: "1px solid #334155", borderLeft: "none", borderRadius: "0 8px 8px 0", color: "#475569", padding: "8px 12px", fontSize: 13 }}>€</span>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <SectionTitle icon="📝" title="Notes" />
          {inp("notes", "", "textarea")}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {editMode ? (
              <>
                <button onClick={saveClient} style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>💾 Enregistrer</button>
                <button onClick={() => { setEditMode(false); if (!selected) setView("liste"); }} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Annuler</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(true)} style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>✏️ Modifier</button>
                <button onClick={() => deleteClient(form.id)} style={{ background: "#2d0b0b", color: "#f87171", border: "1px solid #f8717140", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>🗑 Supprimer</button>
              </>
            )}
          </div>

          {/* RELANCES */}
          <div style={{ marginTop: 32, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#f1f5f9" }}>📅 Relances</div>
            {form.relances.length === 0 && <div style={{ color: "#334155", fontSize: 13 }}>Aucune relance planifiée.</div>}
            {form.relances.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 8, marginBottom: 6, background: r.fait ? "#0a1a12" : "#1a1205", border: `1px solid ${r.fait ? "#14532d" : "#44330040"}` }}>
                <input type="checkbox" checked={r.fait} onChange={() => toggleRelance(r.id)} style={{ cursor: "pointer", width: 16, height: 16 }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#64748b", minWidth: 90 }}>{r.date}</span>
                <span style={{ fontSize: 13, flex: 1, color: r.fait ? "#475569" : "#cbd5e1", textDecoration: r.fait ? "line-through" : "none" }}>{r.note}</span>
                {!r.fait && r.date < now() && <span style={{ color: "#f87171", fontSize: 11, fontWeight: 600 }}>EN RETARD</span>}
                {!r.fait && form.email && (
                  <a href={`mailto:${form.email}?subject=${encodeURIComponent("Relance : " + r.note)}&body=${encodeURIComponent("Bonjour " + form.prenom + " " + form.nom + ",\n\nJe me permets de vous recontacter au sujet de : " + r.note + ".\n\nSeriez-vous disponible pour en discuter prochainement ?\n\nCordialement,\nVotre conciergerie")}`}
                    style={{ background: "#0c2a3e", color: "#38bdf8", border: "1px solid #38bdf840", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
                    📧 Email
                  </a>
                )}
              </div>
            ))}
            <RelanceForm onAdd={addRelance} />
          </div>
        </div>
      )}

      {/* KANBAN */}
      {view === "kanban" && (
        <div style={{ padding: "24px 32px" }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>Pipeline de vente</h2>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16 }}>
            {STATUTS.map(s => {
              const col = clients.filter(c => c.statut === s.id);
              const total = col.reduce((sum, c) => sum + (parseFloat(c.valeur) || 0), 0);
              return (
                <div key={s.id} style={{ minWidth: 220, flex: "0 0 220px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Badge statut={s.id} />
                    <span style={{ color: "#475569", fontSize: 11 }}>{col.length}</span>
                  </div>
                  {total > 0 && <div style={{ color: "#4ade80", fontSize: 11, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{total.toLocaleString("fr-FR")} €/an</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.map(c => (
                      <div key={c.id} onClick={() => openClient(c)} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "border-color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.prenom} {c.nom}</div>
                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{c.typeLogement}{c.surfaceLogement ? ` · ${c.surfaceLogement} m²` : ""}</div>
                        <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>📍 {c.villeLocation || "—"}</div>
                        {c.valeur && <div style={{ color: "#4ade80", fontSize: 12, fontFamily: "'DM Mono', monospace", marginTop: 6 }}>{Number(c.valeur).toLocaleString("fr-FR")} €</div>}
                      </div>
                    ))}
                    {col.length === 0 && <div style={{ color: "#1e293b", fontSize: 12, textAlign: "center", padding: 16, border: "1px dashed #1e293b", borderRadius: 10 }}>Vide</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {view === "stats" && (
        <div style={{ padding: "24px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: -0.5 }}>Dashboard</h2>
              <div style={{ color: "#475569", fontSize: 12, marginTop: 3 }}>Vue d'ensemble de l'activité conciergerie</div>
            </div>
            <div style={{ color: "#334155", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* KPI ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Biens gérés", value: clients.filter(c => c.statut === "gagne").length, accent: "#4ade80", icon: "🔑" },
              { label: "CA annuel", value: stats.ca.toLocaleString("fr-FR") + " €", accent: "#4ade80", icon: "💶" },
              { label: "Pipeline", value: stats.pipeline.toLocaleString("fr-FR") + " €", accent: "#38bdf8", icon: "📈" },
              { label: "Taux conversion", value: stats.tauxConv + "%", accent: "#f59e0b", icon: "🎯" },
              { label: "Relances à faire", value: stats.relancesAFaire, accent: stats.relancesAFaire > 0 ? "#f87171" : "#4ade80", icon: "📅" },
            ].map(k => (
              <div key={k.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ color: "#475569", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, lineHeight: 1.4 }}>{k.label}</div>
                  <span style={{ fontSize: 18 }}>{k.icon}</span>
                </div>
                <div style={{ color: k.accent, fontSize: 24, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* ROW 1 : Donut type logement + Barres CA par ville + Funnel statuts */}
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* DONUT - Types de logements */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, color: "#f1f5f9" }}>🏢 Types de biens</div>
              {(() => {
                const data = TYPES_LOGEMENT.map((t, i) => ({
                  t, count: clients.filter(c => c.typeLogement === t).length,
                  color: `hsl(${200 + i * 28}, 70%, ${55 + i * 3}%)`
                })).filter(x => x.count > 0);
                const total = data.reduce((s, x) => s + x.count, 0);
                if (total === 0) return <div style={{ color: "#334155", fontSize: 13 }}>Aucune donnée</div>;
                const cx = 100, cy = 100, r = 70, ri = 42;
                let angle = -Math.PI / 2;
                const slices = data.map(d => {
                  const a = (d.count / total) * 2 * Math.PI;
                  const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
                  const x2 = cx + r * Math.cos(angle + a), y2 = cy + r * Math.sin(angle + a);
                  const ix1 = cx + ri * Math.cos(angle), iy1 = cy + ri * Math.sin(angle);
                  const ix2 = cx + ri * Math.cos(angle + a), iy2 = cy + ri * Math.sin(angle + a);
                  const large = a > Math.PI ? 1 : 0;
                  const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ri} ${ri} 0 ${large} 0 ${ix1} ${iy1} Z`;
                  angle += a;
                  return { ...d, path };
                });
                return (
                  <div>
                    <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 200, display: "block", margin: "0 auto 16px" }}>
                      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.9} />)}
                      <text x={cx} y={cy - 6} textAnchor="middle" fill="#f1f5f9" fontSize="22" fontWeight="800" fontFamily="DM Mono">{total}</text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter">biens</text>
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {slices.map(s => (
                        <div key={s.t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.t}</span>
                          </div>
                          <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{Math.round(s.count / total * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* BARRES - CA par ville */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, color: "#f1f5f9" }}>💶 Revenus par ville de location</div>
              {(() => {
                const villes = {};
                clients.forEach(c => {
                  if (c.villeLocation && c.valeur) {
                    villes[c.villeLocation] = (villes[c.villeLocation] || 0) + (parseFloat(c.valeur) || 0);
                  }
                });
                const sorted = Object.entries(villes).sort((a, b) => b[1] - a[1]).slice(0, 7);
                if (sorted.length === 0) return <div style={{ color: "#334155", fontSize: 13 }}>Aucune donnée</div>;
                const max = sorted[0][1];
                const colors = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#f87171","#a78bfa"];
                const barH = 28, gap = 10, w = 280;
                const svgH = sorted.length * (barH + gap);
                return (
                  <svg viewBox={`0 0 ${w + 120} ${svgH}`} style={{ width: "100%", overflow: "visible" }}>
                    {sorted.map(([v, val], i) => {
                      const bw = (val / max) * w;
                      const y = i * (barH + gap);
                      return (
                        <g key={v}>
                          <text x={0} y={y + 18} fill="#94a3b8" fontSize="11" fontFamily="Inter">📍 {v}</text>
                          <rect x={0} y={y + 22} width={bw} height={8} rx={4} fill={colors[i % colors.length]} opacity={0.85} />
                          <text x={bw + 8} y={y + 30} fill="#64748b" fontSize="10" fontFamily="DM Mono">{val.toLocaleString("fr-FR")} €</text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>

            {/* FUNNEL - Statuts pipeline */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, color: "#f1f5f9" }}>🎯 Entonnoir de conversion</div>
              {(() => {
                const maxCount = Math.max(...STATUTS.map(s => clients.filter(c => c.statut === s.id).length), 1);
                return STATUTS.map((s, i) => {
                  const count = clients.filter(c => c.statut === s.id).length;
                  const pct = clients.length > 0 ? Math.round(count / clients.length * 100) : 0;
                  const w = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={s.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
                        <div style={{ display: "flex", gap: 10 }}>
                          <span style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Mono', monospace" }}>{count} client{count > 1 ? "s" : ""}</span>
                          <span style={{ fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ background: "#1e293b", borderRadius: 999, height: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, background: s.color, width: `${w}%`, transition: "width 0.6s ease", opacity: 0.85 }} />
                      </div>
                    </div>
                  );
                });
              })()}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Valeur totale portefeuille</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>
                  {clients.reduce((s, c) => s + (parseFloat(c.valeur) || 0), 0).toLocaleString("fr-FR")} €
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2 : Type logement x Ville (heatmap) + Surface moyenne + Relances */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, marginBottom: 16 }}>

            {/* HEATMAP type x ville */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, color: "#f1f5f9" }}>🗺️ Biens par type × ville</div>
              {(() => {
                const villes = [...new Set(clients.map(c => c.villeLocation).filter(Boolean))].sort();
                const types = TYPES_LOGEMENT.filter(t => clients.some(c => c.typeLogement === t));
                if (villes.length === 0 || types.length === 0) return <div style={{ color: "#334155", fontSize: 13 }}>Aucune donnée</div>;
                const maxVal = Math.max(...types.flatMap(t => villes.map(v => clients.filter(c => c.typeLogement === t && c.villeLocation === v).length)), 1);
                return (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "separate", borderSpacing: 4, width: "100%" }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "4px 8px", color: "#334155", fontSize: 11, textAlign: "left" }}></th>
                          {villes.map(v => <th key={v} style={{ padding: "4px 8px", color: "#64748b", fontSize: 11, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>📍 {v}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {types.map(t => (
                          <tr key={t}>
                            <td style={{ padding: "4px 8px", color: "#94a3b8", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{t}</td>
                            {villes.map(v => {
                              const n = clients.filter(c => c.typeLogement === t && c.villeLocation === v).length;
                              const intensity = n / maxVal;
                              return (
                                <td key={v} style={{ textAlign: "center", padding: 3 }}>
                                  <div style={{
                                    width: 44, height: 32, borderRadius: 6, margin: "0 auto",
                                    background: n > 0 ? `rgba(59,130,246,${0.15 + intensity * 0.75})` : "#0f172a",
                                    border: n > 0 ? `1px solid rgba(59,130,246,${0.3 + intensity * 0.4})` : "1px solid #1e293b",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: n > 0 ? "#e2e8f0" : "#1e293b", fontSize: 14, fontWeight: 800
                                  }}>
                                    {n > 0 ? n : ""}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Surface moyenne par type */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, color: "#f1f5f9" }}>📐 Surface moy. par type</div>
              {(() => {
                const data = TYPES_LOGEMENT.map((t, i) => {
                  const group = clients.filter(c => c.typeLogement === t && c.surfaceLogement);
                  const avg = group.length > 0 ? Math.round(group.reduce((s, c) => s + parseFloat(c.surfaceLogement), 0) / group.length) : null;
                  return { t, avg, count: group.length, color: `hsl(${200 + i * 28}, 70%, 55%)` };
                }).filter(x => x.avg !== null);
                if (data.length === 0) return <div style={{ color: "#334155", fontSize: 13 }}>Aucune donnée</div>;
                const max = Math.max(...data.map(x => x.avg));
                return data.map(x => (
                  <div key={x.t} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{x.t}</span>
                      <span style={{ fontSize: 12, color: x.color, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{x.avg} m²</span>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: 999, height: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, background: x.color, width: `${(x.avg / max) * 100}%`, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* ROW 3 : Relances timeline */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "#f1f5f9" }}>📅 Relances à venir</div>
            {(() => {
              const all = clients.flatMap(c => c.relances.filter(r => !r.fait).map(r => ({ ...r, client: c })));
              if (all.length === 0) return <div style={{ color: "#334155", fontSize: 13 }}>Aucune relance en attente 🎉</div>;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {all.sort((a, b) => a.date.localeCompare(b.date)).map(r => {
                    const retard = r.date < now();
                    return (
                      <div key={r.id} style={{ background: retard ? "#1a0a0a" : "#0f1a0a", border: `1px solid ${retard ? "#7f1d1d" : "#14532d"}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}
                        onClick={() => openClient(r.client)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: retard ? "#f87171" : "#4ade80", fontWeight: 700 }}>
                            {retard ? "⚠ " : "→ "}{r.date}
                          </span>
                          <span style={{ fontSize: 10, color: "#475569", background: "#1e293b", padding: "1px 6px", borderRadius: 4 }}>{r.client.typeLogement}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 4 }}>{r.note}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>{r.client.prenom} {r.client.nom} · 📍{r.client.villeLocation || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
