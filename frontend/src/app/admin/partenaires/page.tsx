"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Loader2, Search, ArrowLeft, Users, Ticket, Wallet, History, RefreshCw, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Partenaire {
  nom: string;
  comptes: number;
  comptesActifs: number;
  derniereConnexion: string | null;
  actives: number;
  utilisees: number;
  expirees: number;
  annulees: number;
  montantRetire: number;
  montantDu: number;
  derniereReservation: string | null;
}

interface Fiche {
  nom: string;
  comptes: { id: string; nom: string; email: string; telephone: string | null; statut: string; derniereConnexion: string | null; createdAt: string }[];
  reservations: {
    id: string; code: string; statut: "ACTIVE" | "UTILISEE" | "EXPIREE" | "ANNULEE"; prenom: string; nom: string;
    formatSim: "PHYSIQUE" | "ESIM"; offre: { nom: string } | null; montant: number; createdAt: string;
    utiliseeLe: string | null; regleLe: string | null; creePar: { nom: string; email: string } | null;
  }[];
  logs: { id: string; type: string; description: string; createdAt: string; utilisateur: { nom: string; email: string; role: string } | null }[];
}

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} GNF`;
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const fmtDateHeure = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const STATUTS: Record<Fiche["reservations"][number]["statut"], { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "bg-green-50 text-green-700 border-green-200" },
  UTILISEE: { label: "Utilisée", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  EXPIREE: { label: "Expirée", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  ANNULEE: { label: "Annulée", cls: "bg-red-50 text-red-700 border-red-200" },
};

const carte = "bg-white rounded-2xl border border-gray-100 shadow-sm";

/** Admin : établissements partenaires (hôtels / agences), leurs comptes, chiffres et historique. */
export default function PartenairesAdmin() {
  const [liste, setListe] = useState<Partenaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [choisi, setChoisi] = useState<string | null>(null);
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [onglet, setOnglet] = useState<"reservations" | "historique" | "comptes">("historique");

  const charger = useCallback(() =>
    apiFetch("/api/partenaires")
      .then((d) => { setErreur(null); setListe(d.data || []); })
      .catch((e) => setErreur(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setChargement(false)),
  []);

  useEffect(() => { charger(); }, [charger]);

  const ouvrir = (nom: string) => {
    setChoisi(nom);
    setFiche(null);
    setOnglet("historique");
    apiFetch(`/api/partenaires/detail?nom=${encodeURIComponent(nom)}`)
      .then((d) => setFiche(d.data))
      .catch((e) => setErreur(e instanceof Error ? e.message : "Fiche indisponible"));
  };

  const filtres = useMemo(
    () => liste.filter((p) => p.nom.toLowerCase().includes(recherche.trim().toLowerCase())),
    [liste, recherche],
  );
  const totalDu = liste.reduce((t, p) => t + p.montantDu, 0);
  const resume = choisi ? liste.find((p) => p.nom === choisi) : null;

  // ── Fiche d'un établissement ──
  if (choisi) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => { setChoisi(null); setFiche(null); }} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-primary">
            <ArrowLeft className="w-4 h-4" /> Tous les partenaires
          </button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Building2 className="w-6 h-6" /> {choisi}</h1>
        </div>

        {resume && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Comptes", valeur: `${resume.comptesActifs} actif${resume.comptesActifs > 1 ? "s" : ""} / ${resume.comptes}` },
              { icon: Ticket, label: "Réservations actives", valeur: String(resume.actives) },
              { icon: Ticket, label: "SIM retirées", valeur: `${resume.utilisees} · ${fmt(resume.montantRetire)}` },
              { icon: Wallet, label: "Reste à régler", valeur: fmt(resume.montantDu), fort: resume.montantDu > 0 },
            ].map(({ icon: Icon, label, valeur, fort }) => (
              <div key={label} className={`${carte} p-4`}>
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase"><Icon className="w-4 h-4" /> {label}</div>
                <p className={`mt-1.5 text-lg font-bold ${fort ? "text-amber-700" : "text-primary"}`}>{valeur}</p>
              </div>
            ))}
          </div>
        )}

        <div className={carte}>
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
            {([
              ["historique", `Historique${fiche ? ` (${fiche.logs.length})` : ""}`],
              ["reservations", `Réservations${fiche ? ` (${fiche.reservations.length})` : ""}`],
              ["comptes", `Comptes${fiche ? ` (${fiche.comptes.length})` : ""}`],
            ] as const).map(([cle, label]) => (
              <button key={cle} onClick={() => setOnglet(cle)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${onglet === cle ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-gray-200"}`}>
                {label}
              </button>
            ))}
          </div>

          {!fiche ? (
            <div className="flex items-center justify-center gap-2 p-10 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Chargement de la fiche...</div>
          ) : onglet === "historique" ? (
            fiche.logs.length === 0 ? <p className="p-10 text-center text-sm text-text-muted">Aucune action enregistrée.</p> : (
              <ul className="divide-y divide-gray-100">
                {fiche.logs.map((l) => (
                  <li key={l.id} className="flex flex-wrap gap-x-4 gap-y-1 p-4 text-sm">
                    <span className="w-32 shrink-0 text-xs text-text-muted font-mono pt-0.5">{fmtDateHeure(l.createdAt)}</span>
                    <span className="flex-1 min-w-[240px]">
                      <span className="font-semibold text-primary">{l.type}</span>
                      <span className="block text-text-muted">{l.description}</span>
                    </span>
                    <span className="text-xs text-text-muted">
                      {l.utilisateur ? `${l.utilisateur.nom}${l.utilisateur.role === "ADMIN" ? " (admin)" : ""}` : "Borne"}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : onglet === "reservations" ? (
            fiche.reservations.length === 0 ? <p className="p-10 text-center text-sm text-text-muted">Aucune réservation.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-text-muted uppercase">
                    <tr><th className="p-3">Code</th><th className="p-3">Voyageur</th><th className="p-3">Produit</th><th className="p-3">Montant</th><th className="p-3">Créée</th><th className="p-3">Par</th><th className="p-3">Statut</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fiche.reservations.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3 font-mono font-bold text-primary whitespace-nowrap">{r.code}</td>
                        <td className="p-3">{r.prenom} {r.nom}</td>
                        <td className="p-3">{r.formatSim === "ESIM" ? "eSIM" : "SIM physique"}{r.offre ? ` — ${r.offre.nom}` : ""}</td>
                        <td className="p-3 whitespace-nowrap">{fmt(r.montant)}</td>
                        <td className="p-3 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                        <td className="p-3 text-xs text-text-muted">{r.creePar?.nom ?? "—"}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${STATUTS[r.statut].cls}`}>{STATUTS[r.statut].label}</span>
                          {r.statut === "UTILISEE" && (
                            <div className={`text-[11px] mt-1.5 font-semibold ${r.regleLe ? "text-green-700" : "text-amber-700"}`}>
                              {r.regleLe ? `Réglée le ${fmtDate(r.regleLe)}` : `Retirée le ${fmtDate(r.utiliseeLe)} · à régler`}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            fiche.comptes.length === 0 ? (
              <p className="p-10 text-center text-sm text-text-muted">
                Aucun compte pour cet établissement : ses réservations ont été créées par l&apos;admin.{" "}
                <Link href="/admin/utilisateurs" className="text-primary font-semibold underline">Créer un compte</Link>
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-text-muted uppercase">
                    <tr><th className="p-3">Nom</th><th className="p-3">E-mail</th><th className="p-3">Téléphone</th><th className="p-3">Créé le</th><th className="p-3">Dernière connexion</th><th className="p-3">Statut</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fiche.comptes.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-semibold">{c.nom}</td>
                        <td className="p-3">{c.email}</td>
                        <td className="p-3">{c.telephone || "—"}</td>
                        <td className="p-3 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                        <td className="p-3 whitespace-nowrap">{c.derniereConnexion ? fmtDateHeure(c.derniereConnexion) : "Jamais"}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${c.statut === "ACTIF" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            {c.statut === "ACTIF" ? "Actif" : c.statut === "BLOQUE" ? "Bloqué" : "Inactif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // ── Liste des établissements ──
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Building2 className="w-6 h-6" /> Partenaires</h1>
          <p className="text-sm text-text-muted mt-1">Hôtels et agences qui réservent des SIM pour leurs clients. Cliquez sur un établissement pour voir sa fiche.</p>
        </div>
        <Link href="/admin/utilisateurs" className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90">
          <UserPlus className="w-4 h-4" /> Nouveau compte partenaire
        </Link>
      </div>

      {erreur && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{erreur}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "Établissements", valeur: String(liste.length) },
          { icon: Ticket, label: "Réservations actives", valeur: String(liste.reduce((t, p) => t + p.actives, 0)) },
          { icon: Wallet, label: "Total à recevoir", valeur: fmt(totalDu) },
        ].map(({ icon: Icon, label, valeur }) => (
          <div key={label} className={`${carte} p-4`}>
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase"><Icon className="w-4 h-4" /> {label}</div>
            <p className="mt-1.5 text-xl font-bold text-primary">{valeur}</p>
          </div>
        ))}
      </div>

      <div className={carte}>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg">
            <Search className="w-4 h-4 text-text-muted" />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un établissement" className="flex-1 text-sm outline-none bg-transparent" />
          </div>
          <button onClick={() => { setChargement(true); charger(); }} className="text-text-muted hover:text-primary" aria-label="Actualiser"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {chargement ? (
          <div className="flex items-center justify-center gap-2 p-10 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Chargement...</div>
        ) : filtres.length === 0 ? (
          <p className="p-10 text-center text-sm text-text-muted">
            {liste.length === 0 ? "Aucun partenaire pour le moment. Créez un compte avec le rôle « Partenaire » dans Utilisateurs." : "Aucun établissement ne correspond à la recherche."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-text-muted uppercase">
                <tr>
                  <th className="p-3">Établissement</th><th className="p-3">Comptes</th><th className="p-3">Actives</th>
                  <th className="p-3">SIM retirées</th><th className="p-3">Reste à régler</th><th className="p-3">Dernière activité</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtres.map((p) => (
                  <tr key={p.nom} onClick={() => ouvrir(p.nom)} className="cursor-pointer hover:bg-gray-50">
                    <td className="p-3 font-semibold text-primary">{p.nom}</td>
                    <td className="p-3">{p.comptes ? `${p.comptesActifs} / ${p.comptes}` : <span className="text-text-muted text-xs">aucun</span>}</td>
                    <td className="p-3">{p.actives}</td>
                    <td className="p-3 whitespace-nowrap">{p.utilisees} <span className="text-xs text-text-muted">· {fmt(p.montantRetire)}</span></td>
                    <td className="p-3 whitespace-nowrap">{p.montantDu > 0 ? <strong className="text-amber-700">{fmt(p.montantDu)}</strong> : <span className="text-green-700 text-xs font-semibold">À jour</span>}</td>
                    <td className="p-3 whitespace-nowrap text-xs text-text-muted">
                      {p.derniereReservation ? `Réservation ${fmtDate(p.derniereReservation)}` : "—"}
                      {p.derniereConnexion && <div>Connexion {fmtDate(p.derniereConnexion)}</div>}
                    </td>
                    <td className="p-3 text-right text-primary"><History className="w-4 h-4 inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
