"use client";
import { useCallback, useEffect, useState } from "react";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Solde {
  partenaireNom: string;
  utilisees: number;
  montantTotal: number;
  aRegler: number;
  montantARegler: number;
  dernierReglement: string | null;
}

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} GNF`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

/**
 * Argent dû à N'ma SIM : le partenaire encaisse le voyageur, puis reverse le montant
 * de chaque SIM retirée à la borne. L'admin enregistre les règlements reçus.
 * `version` change quand la liste des réservations est rechargée → les soldes suivent.
 */
export function SoldesPartenaires({ mode, version }: { mode: "admin" | "partenaire"; version: number }) {
  const [soldes, setSoldes] = useState<Solde[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState<string | null>(null);

  const charger = useCallback(() =>
    apiFetch("/api/reservations/soldes")
      .then((data) => setSoldes(data.data || []))
      .catch(() => setSoldes([]))
      .finally(() => setChargement(false)),
  []);

  useEffect(() => { charger(); }, [charger, version]);

  const regler = async (s: Solde) => {
    if (!confirm(`Confirmer la réception de ${fmt(s.montantARegler)} de ${s.partenaireNom} (${s.aRegler} SIM retirée${s.aRegler > 1 ? "s" : ""}) ?`)) return;
    setEnCours(s.partenaireNom);
    try {
      await apiFetch("/api/reservations/soldes", { method: "POST", body: JSON.stringify({ partenaireNom: s.partenaireNom }) });
      charger();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setEnCours(null);
    }
  };

  if (chargement) {
    return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-2 text-sm text-text-muted print:hidden"><Loader2 className="w-4 h-4 animate-spin" /> Calcul des montants dus...</div>;
  }

  // Partenaire : un seul encadré, son propre solde
  if (mode === "partenaire") {
    const s = soldes[0];
    const du = s?.montantARegler ?? 0;
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-4 print:hidden">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs font-semibold text-text-muted uppercase">À reverser à N&apos;ma SIM</p>
          <p className="text-2xl font-bold text-primary">{fmt(du)}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {s?.aRegler ? `${s.aRegler} SIM retirée${s.aRegler > 1 ? "s" : ""} à la borne, pas encore réglée${s.aRegler > 1 ? "s" : ""}` : "Aucune SIM retirée en attente de règlement"}
            {s?.dernierReglement && ` · dernier règlement le ${fmtDate(s.dernierReglement)}`}
          </p>
        </div>
        {s && <p className="text-xs text-text-muted">Total depuis le début : <strong className="text-primary">{fmt(s.montantTotal)}</strong> ({s.utilisees} SIM)</p>}
      </div>
    );
  }

  const totalDu = soldes.reduce((t, s) => t + s.montantARegler, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm print:hidden">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <Wallet className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-primary">Montants dus par les partenaires</h2>
        <span className="ml-auto text-sm text-text-muted">Total à recevoir : <strong className="text-primary">{fmt(totalDu)}</strong></span>
      </div>
      {soldes.length === 0 ? (
        <p className="p-6 text-center text-text-muted text-sm">Aucune SIM réservée n&apos;a encore été retirée à la borne.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-text-muted uppercase">
              <tr>
                <th className="p-3">Établissement</th><th className="p-3">SIM retirées</th><th className="p-3">Total</th>
                <th className="p-3">À régler</th><th className="p-3">Dernier règlement</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {soldes.map((s) => (
                <tr key={s.partenaireNom}>
                  <td className="p-3 font-semibold">{s.partenaireNom}</td>
                  <td className="p-3">{s.utilisees}</td>
                  <td className="p-3 whitespace-nowrap">{fmt(s.montantTotal)}</td>
                  <td className="p-3 whitespace-nowrap">
                    {s.aRegler ? <><strong className="text-primary">{fmt(s.montantARegler)}</strong> <span className="text-xs text-text-muted">({s.aRegler})</span></> : <span className="text-green-700 text-xs font-semibold">À jour</span>}
                  </td>
                  <td className="p-3 whitespace-nowrap">{s.dernierReglement ? fmtDate(s.dernierReglement) : "—"}</td>
                  <td className="p-3 text-right">
                    {s.aRegler > 0 && (
                      <button onClick={() => regler(s)} disabled={enCours === s.partenaireNom}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-300 bg-green-50 text-green-800 text-xs font-semibold disabled:opacity-60">
                        {enCours === s.partenaireNom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Marquer réglé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
