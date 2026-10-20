"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Printer, XCircle, Loader2, Ticket, RefreshCw, CheckCircle2, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { chargerTarifs } from "@/lib/tarifs";
import { RecuImprimable } from "@/components/borne/RecuImprimable";
import { SoldesPartenaires } from "./SoldesPartenaires";

interface Offre { id: string; nom: string; prix: number; type: string; estActif?: boolean }

interface Reservation {
  id: string;
  code: string;
  statut: "ACTIVE" | "UTILISEE" | "EXPIREE" | "ANNULEE";
  nom: string;
  prenom: string;
  nationalite: string | null;
  numeroPasseport: string;
  email: string | null;
  formatSim: "PHYSIQUE" | "ESIM";
  offre: { nom: string; type: string } | null;
  montantRecharge: number | null;
  montant: number;
  dateArrivee: string;
  expireLe: string;
  partenaireNom: string;
  utiliseeLe: string | null;
  recuEnvoyeLe: string | null;
  regleLe: string | null;
  createdAt: string;
  // Renvoyé uniquement à la création : résultat de l'envoi automatique du reçu
  envoiRecu?: { envoye: boolean; raison?: string } | null;
}

const STATUTS: Record<Reservation["statut"], { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "bg-green-50 text-green-700 border-green-200" },
  UTILISEE: { label: "Utilisée", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  EXPIREE: { label: "Expirée", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  ANNULEE: { label: "Annulée", cls: "bg-red-50 text-red-700 border-red-200" },
};

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} GNF`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");
const produit = (r: Pick<Reservation, "formatSim" | "offre" | "montantRecharge">) => {
  const extras = [r.offre?.nom, r.montantRecharge ? `recharge ${fmt(r.montantRecharge)}` : null].filter(Boolean);
  return `${r.formatSim === "ESIM" ? "eSIM" : "SIM physique"}${extras.length ? " — " + extras.join(" + ") : ""}`;
};

const FORM_VIDE = {
  prenom: "", nom: "", nationalite: "", numeroPasseport: "", email: "", telephone: "",
  formatSim: "PHYSIQUE" as "PHYSIQUE" | "ESIM", offreId: "", montantRecharge: "", dateArrivee: "", partenaireNom: "",
};

/** Création, suivi, annulation et impression des réservations SIM (admin = toutes, partenaire = les siennes). */
export function GestionReservations({ mode }: { mode: "admin" | "partenaire" }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [prixSim, setPrixSim] = useState<number | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"" | Reservation["statut"]>("");
  const [formOuvert, setFormOuvert] = useState(false);
  const [form, setForm] = useState(FORM_VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [creee, setCreee] = useState<Reservation | null>(null);
  const [aImprimer, setAImprimer] = useState<Reservation | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // L'indicateur de chargement est allumé par l'action qui déclenche le rechargement (filtre, actualiser)
  const charger = useCallback(() =>
    apiFetch(`/api/reservations${filtre ? `?statut=${filtre}` : ""}`)
      .then((data) => {
        setErreur(null);
        setReservations(data.data || []);
        setVersion((v) => v + 1);
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setChargement(false)),
  [filtre]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    apiFetch("/api/offres").then((d) => setOffres(d.data || [])).catch(() => setOffres([]));
    chargerTarifs().then((t) => setPrixSim(t.nouvelleSim));
  }, []);

  // Impression : on rend le reçu de la réservation choisie, puis on lance l'impression
  useEffect(() => {
    if (!aImprimer) return;
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, [aImprimer]);

  const offresEsim = offres.filter((o) => o.type === "SIM_ESIM");
  const offresPhysique = offres.filter((o) => !["SIM_ESIM", "SIM_STANDARD", "RECHARGE", "DEPOT"].includes(o.type));
  const offreChoisie = offres.find((o) => o.id === form.offreId) || null;
  const recharge = Number(form.montantRecharge) || 0;

  // Estimation affichée (le montant officiel est recalculé par le serveur)
  const estimation = useMemo(() => {
    if (form.formatSim === "ESIM") return offreChoisie?.prix ?? null;
    if (prixSim === null) return null;
    return prixSim + (offreChoisie?.prix ?? 0) + recharge;
  }, [form.formatSim, offreChoisie, prixSim, recharge]);

  const maj = (champ: keyof typeof FORM_VIDE, valeur: string) =>
    setForm((f) => ({ ...f, [champ]: valeur, ...(champ === "formatSim" ? { offreId: "", montantRecharge: "" } : {}) }));

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const data = await apiFetch("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          prenom: form.prenom, nom: form.nom, nationalite: form.nationalite || undefined,
          numeroPasseport: form.numeroPasseport, email: form.email || undefined, telephone: form.telephone || undefined,
          formatSim: form.formatSim,
          offreId: form.offreId || null,
          montantRecharge: form.formatSim === "PHYSIQUE" && recharge > 0 ? recharge : null,
          dateArrivee: form.dateArrivee,
          ...(mode === "admin" && form.partenaireNom ? { partenaireNom: form.partenaireNom } : {}),
        }),
      });
      setCreee(data.data);
      setForm(FORM_VIDE);
      setFormOuvert(false);
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setEnvoi(false);
    }
  };

  const annuler = async (r: Reservation) => {
    if (!confirm(`Annuler la réservation ${r.code} de ${r.prenom} ${r.nom} ?`)) return;
    try {
      await apiFetch(`/api/reservations/${r.id}`, { method: "PATCH", body: JSON.stringify({ action: "annuler" }) });
      charger();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Annulation impossible");
    }
  };

  const envoyerRecu = async (r: Reservation) => {
    const email = prompt(`Envoyer le reçu de ${r.prenom} ${r.nom} à l'adresse :`, r.email || "");
    if (email === null) return;
    setEnvoiEnCours(r.id);
    try {
      const data = await apiFetch(`/api/reservations/${r.id}`, { method: "PATCH", body: JSON.stringify({ action: "envoyer-recu", email: email.trim() }) });
      alert(data.message || "Reçu envoyé");
      setCreee((c) => (c && c.id === r.id ? { ...c, email: data.data.email, envoiRecu: { envoye: true } } : c));
      charger();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setEnvoiEnCours(null);
    }
  };

  const champ = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary bg-white";
  const label = "block text-xs font-semibold text-primary mb-1.5";

  return (
    <div className="flex flex-col gap-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Ticket className="w-6 h-6" /> Réservations SIM</h1>
          <p className="text-sm text-text-muted mt-1">
            {mode === "admin"
              ? "Toutes les réservations des voyageurs, tous partenaires confondus."
              : "Créez la réservation SIM de vos clients : ils la récupèrent à la borne avec le code du reçu."}
          </p>
        </div>
        <button onClick={() => { setFormOuvert((o) => !o); setCreee(null); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Nouvelle réservation
        </button>
      </div>

      {erreur && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm print:hidden">{erreur}</div>}

      {/* Confirmation de création */}
      {creee && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex flex-wrap items-center gap-3 print:hidden">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <p className="font-bold text-green-800">Réservation créée : <span className="font-mono">{creee.code}</span></p>
            <p className="text-sm text-green-800/80">
              {creee.envoiRecu?.envoye
                ? `Reçu envoyé par e-mail à ${creee.email}. Vous pouvez aussi l'imprimer.`
                : "Imprimez ou envoyez le reçu au voyageur : il en aura besoin à la borne."}
            </p>
            {creee.envoiRecu && !creee.envoiRecu.envoye && (
              <p className="text-sm text-amber-700 mt-1">E-mail non envoyé : {creee.envoiRecu.raison}.</p>
            )}
          </div>
          <button onClick={() => envoyerRecu(creee)} disabled={envoiEnCours === creee.id} className="flex items-center gap-2 bg-white border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
            {envoiEnCours === creee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} {creee.envoiRecu?.envoye ? "Renvoyer" : "Envoyer"} par e-mail
          </button>
          <button onClick={() => setAImprimer(creee)} className="flex items-center gap-2 bg-white border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm font-semibold">
            <Printer className="w-4 h-4" /> Imprimer le reçu
          </button>
        </div>
      )}

      <SoldesPartenaires mode={mode} version={version} />

      {/* Formulaire */}
      {formOuvert && (
        <form onSubmit={creer} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          <h2 className="md:col-span-2 font-bold text-primary">Voyageur</h2>
          <div><label className={label}>Prénom *</label><input required className={champ} value={form.prenom} onChange={(e) => maj("prenom", e.target.value)} /></div>
          <div><label className={label}>Nom *</label><input required className={champ} value={form.nom} onChange={(e) => maj("nom", e.target.value)} /></div>
          <div><label className={label}>Numéro de passeport *</label><input required minLength={5} className={`${champ} font-mono uppercase`} value={form.numeroPasseport} onChange={(e) => maj("numeroPasseport", e.target.value)} /></div>
          <div><label className={label}>Nationalité</label><input className={champ} value={form.nationalite} onChange={(e) => maj("nationalite", e.target.value)} /></div>
          <div><label className={label}>E-mail (envoi du reçu)</label><input type="email" className={champ} value={form.email} onChange={(e) => maj("email", e.target.value)} /></div>
          <div><label className={label}>Téléphone</label><input className={champ} value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} /></div>

          <h2 className="md:col-span-2 font-bold text-primary mt-2">SIM réservée</h2>
          <div>
            <label className={label}>Format *</label>
            <select className={champ} value={form.formatSim} onChange={(e) => maj("formatSim", e.target.value)}>
              <option value="PHYSIQUE">SIM physique</option>
              <option value="ESIM">eSIM</option>
            </select>
          </div>
          <div><label className={label}>Date d&apos;arrivée prévue *</label><input required type="date" className={champ} value={form.dateArrivee} onChange={(e) => maj("dateArrivee", e.target.value)} /></div>
          {form.formatSim === "ESIM" ? (
            <div className="md:col-span-2">
              <label className={label}>Forfait eSIM *</label>
              <select required className={champ} value={form.offreId} onChange={(e) => maj("offreId", e.target.value)}>
                <option value="">Choisir un forfait</option>
                {offresEsim.map((o) => <option key={o.id} value={o.id}>{o.nom} — {fmt(o.prix)}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className={label}>Forfait (facultatif)</label>
                <select className={champ} value={form.offreId} onChange={(e) => maj("offreId", e.target.value)}>
                  <option value="">Aucun</option>
                  {offresPhysique.map((o) => <option key={o.id} value={o.id}>{o.nom} — {fmt(o.prix)}</option>)}
                </select>
              </div>
              <div><label className={label}>Recharge incluse (GNF, facultatif)</label><input type="number" min={0} step={1000} className={champ} value={form.montantRecharge} onChange={(e) => maj("montantRecharge", e.target.value)} /></div>
            </>
          )}
          {mode === "admin" && (
            <div className="md:col-span-2"><label className={label}>Établissement (hôtel / agence)</label><input className={champ} placeholder="N'ma SIM" value={form.partenaireNom} onChange={(e) => maj("partenaireNom", e.target.value)} /></div>
          )}

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-text-muted">
              Montant prépayé : <strong className="text-primary">{estimation !== null ? fmt(estimation) : "—"}</strong>
              <span className="text-xs"> · code valable 30 jours après l&apos;arrivée</span>
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormOuvert(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-text-muted">Annuler</button>
              <button type="submit" disabled={envoi} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                {envoi && <Loader2 className="w-4 h-4 animate-spin" />} Créer la réservation
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
          {(["", "ACTIVE", "UTILISEE", "EXPIREE", "ANNULEE"] as const).map((s) => (
            <button key={s || "toutes"} onClick={() => { if (s !== filtre) { setChargement(true); setFiltre(s); } }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filtre === s ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-gray-200"}`}>
              {s ? STATUTS[s].label : "Toutes"}
            </button>
          ))}
          <button onClick={() => { setChargement(true); charger(); }} className="ml-auto text-text-muted hover:text-primary" aria-label="Actualiser"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {chargement ? (
          <div className="flex items-center justify-center gap-2 p-10 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Chargement...</div>
        ) : reservations.length === 0 ? (
          <p className="p-10 text-center text-text-muted text-sm">Aucune réservation pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-text-muted uppercase">
                <tr>
                  <th className="p-3">Code</th><th className="p-3">Voyageur</th><th className="p-3">Produit</th>
                  <th className="p-3">Montant</th><th className="p-3">Arrivée</th><th className="p-3">Validité</th>
                  {mode === "admin" && <th className="p-3">Établissement</th>}
                  <th className="p-3">Statut</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-mono font-bold text-primary whitespace-nowrap">{r.code}</td>
                    <td className="p-3"><div className="font-semibold">{r.prenom} {r.nom}</div><div className="text-xs text-text-muted font-mono">{r.numeroPasseport}</div></td>
                    <td className="p-3">{produit(r)}</td>
                    <td className="p-3 whitespace-nowrap">{fmt(r.montant)}</td>
                    <td className="p-3 whitespace-nowrap">{fmtDate(r.dateArrivee)}</td>
                    <td className="p-3 whitespace-nowrap">{fmtDate(r.expireLe)}</td>
                    {mode === "admin" && <td className="p-3">{r.partenaireNom}</td>}
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${STATUTS[r.statut].cls}`}>{STATUTS[r.statut].label}</span>
                      {r.statut === "UTILISEE" && (
                        <div className={`text-[11px] mt-1.5 font-semibold ${r.regleLe ? "text-green-700" : "text-amber-700"}`}>
                          {r.regleLe ? `Réglée le ${fmtDate(r.regleLe)}` : "À régler"}
                        </div>
                      )}
                      {r.statut === "ACTIVE" && r.recuEnvoyeLe && (
                        <div className="text-[11px] mt-1.5 text-text-muted flex items-center gap-1"><Mail className="w-3 h-3" /> envoyé le {fmtDate(r.recuEnvoyeLe)}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        {r.statut === "ACTIVE" && (
                          <>
                            <button onClick={() => envoyerRecu(r)} disabled={envoiEnCours === r.id} title="Envoyer le reçu par e-mail" className="text-primary hover:opacity-70 disabled:opacity-40">
                              {envoiEnCours === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setAImprimer(r)} title="Imprimer le reçu" className="text-primary hover:opacity-70"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => annuler(r)} title="Annuler" className="text-red-600 hover:opacity-70"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reçu imprimé remis au voyageur */}
      {aImprimer && (
        <RecuImprimable
          service="SIM réservée — Voyageur"
          reference={aImprimer.code}
          date={`Réservée le ${fmtDate(aImprimer.createdAt)}`}
          statut="Payée"
          lignes={[
            { label: "Voyageur", value: `${aImprimer.prenom} ${aImprimer.nom}` },
            { label: "Passeport", value: aImprimer.numeroPasseport },
            { label: "Produit", value: produit(aImprimer) },
            { label: "Arrivée prévue", value: fmtDate(aImprimer.dateArrivee) },
            { label: "Code valable jusqu'au", value: fmtDate(aImprimer.expireLe) },
            { label: "Réservée par", value: aImprimer.partenaireNom },
          ]}
          montant={fmt(aImprimer.montant)}
          qrData={aImprimer.code}
          qrLegende="À scanner sur la borne N'ma SIM"
          titreEtapes="Récupérer votre SIM / Collect your SIM"
          etapes={[
            "À votre arrivée en Guinée, rendez-vous à une borne N'ma SIM. / On arrival in Guinea, go to an N'ma SIM kiosk.",
            "Choisissez « J'ai un code de réservation » et scannez ce QR code. / Choose « I have a reservation code » and scan this QR code.",
            "Scannez votre passeport puis faites un selfie. / Scan your passport, then take a selfie.",
            "Récupérez votre SIM : elle est déjà payée. / Collect your SIM: it is already paid.",
          ]}
          note="Ce code est personnel et à usage unique. Le passeport présenté à la borne doit être celui indiqué sur ce reçu. / This code is personal and single-use; the passport shown at the kiosk must match this receipt."
        />
      )}
    </div>
  );
}
