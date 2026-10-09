"use client";

export interface LigneRecu {
  label: string;
  value: string;
}

interface RecuImprimableProps {
  /** Titre du document, ex. « Nouvelle carte SIM ». */
  service: string;
  reference: string;
  date: string;
  statut: string;
  lignes: LigneRecu[];
  montant?: string;
  /** Contenu encodé dans le QR code (vérification du reçu ou profil eSIM). */
  qrData?: string;
  qrLegende?: string;
  /** Étapes numérotées (ex. installation de l'eSIM). */
  etapes?: string[];
  note?: string;
  lang?: string;
}

const BLEU = "#2656A2";
const JAUNE = "#F5BB02";
const GRIS = "#6B7280";

/**
 * Reçu A4 aux couleurs N'ma SIM, invisible à l'écran : seul ce bloc sort à l'impression
 * (window.print). Les couleurs de fond sont forcées (print-color-adjust) pour que
 * l'imprimante ne les supprime pas.
 */
export function RecuImprimable({
  service, reference, date, statut, lignes, montant, qrData, qrLegende, etapes, note, lang = "fr",
}: RecuImprimableProps) {
  const en = lang === "en";

  return (
    <div id="recu-impression" className="hidden print:block">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body { background: #fff !important; }
          body * { visibility: hidden; }
          #recu-impression, #recu-impression * { visibility: visible; }
          #recu-impression {
            position: absolute; left: 0; top: 0; width: 100%;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            font-family: "Segoe UI", Arial, sans-serif; color: #1F2937;
          }
          #recu-impression .bloc { break-inside: avoid; }
        }
      `}} />

      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 }}>
        <img src="/logo-final.png" alt="N'ma SIM" style={{ height: 72, width: "auto" }} />
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: GRIS }}>
            {en ? "Official receipt" : "Reçu officiel"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: BLEU, fontFamily: "monospace" }}>{reference}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: GRIS }}>{date}</p>
        </div>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ flex: 3, background: BLEU }} />
        <div style={{ flex: 1, background: JAUNE }} />
      </div>

      {/* ── Titre ── */}
      <div className="bloc" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 18px" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: GRIS }}>
            {en ? "Service" : "Service"}
          </p>
          <h1 style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 800, color: BLEU, fontFamily: "Lora, Georgia, serif" }}>{service}</h1>
        </div>
        <span style={{
          padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: "#E8EEF8", color: BLEU, border: `1px solid ${BLEU}33`,
        }}>{statut}</span>
      </div>

      {/* ── Détails + QR ── */}
      <div className="bloc" style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
        <div style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          {lignes.map((l, i) => (
            <div key={l.label} style={{
              display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 16px",
              background: i % 2 ? "#FFFFFF" : "#F7F9FC", fontSize: 13,
            }}>
              <span style={{ color: GRIS }}>{l.label}</span>
              <span style={{ fontWeight: 700, color: "#111827", textAlign: "right" }}>{l.value}</span>
            </div>
          ))}
        </div>

        {qrData && (
          <div style={{
            width: 190, flexShrink: 0, border: `2px solid ${BLEU}`, borderRadius: 12, padding: 12,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(qrData)}`}
              alt="QR code"
              style={{ width: 160, height: 160 }}
            />
            {qrLegende && <p style={{ margin: 0, fontSize: 10, color: GRIS, textAlign: "center", lineHeight: 1.4 }}>{qrLegende}</p>}
          </div>
        )}
      </div>

      {/* ── Montant ── */}
      {montant && (
        <div className="bloc" style={{
          marginTop: 18, borderRadius: 12, background: BLEU, color: "#fff",
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px",
        }}>
          <span style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 }}>
            {en ? "Amount paid" : "Montant payé"}
          </span>
          <span style={{ fontSize: 26, fontWeight: 800, color: JAUNE }}>{montant}</span>
        </div>
      )}

      {/* ── Étapes ── */}
      {etapes && etapes.length > 0 && (
        <div className="bloc" style={{ marginTop: 20 }}>
          <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: BLEU }}>
            {en ? "How to install your eSIM" : "Installer votre eSIM"}
          </p>
          {etapes.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8, fontSize: 13 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", background: JAUNE, color: BLEU, fontWeight: 800,
                fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ paddingTop: 2 }}>{e}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Note ── */}
      <div className="bloc" style={{
        marginTop: 20, padding: "12px 16px", borderLeft: `4px solid ${JAUNE}`, background: "#FFF9E6",
        borderRadius: 8, fontSize: 12, color: "#374151", lineHeight: 1.5,
      }}>
        {note ?? (en
          ? "Keep this receipt: it is required for any request about your file."
          : "Conservez ce reçu : il vous sera demandé pour toute réclamation concernant votre dossier.")}
      </div>

      {/* ── Pied de page ── */}
      <div style={{ marginTop: 28, paddingTop: 12, borderTop: "1px dashed #D1D5DB", display: "flex", justifyContent: "space-between", fontSize: 10, color: GRIS }}>
        <span>N&apos;ma SIM · {en ? "Self-service SIM kiosk" : "Borne libre-service"} · Guinée</span>
        <span style={{ fontFamily: "monospace" }}>{reference}</span>
        <span>{en ? "Thank you for your trust" : "Merci de votre confiance"}</span>
      </div>
    </div>
  );
}
