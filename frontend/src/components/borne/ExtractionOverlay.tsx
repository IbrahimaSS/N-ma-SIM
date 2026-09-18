"use client";
import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";

interface ExtractionOverlayProps {
  visible: boolean;
  lang?: string;
  /** Texte affiché — par défaut celui de l'extraction OCR. */
  title?: string;
  subtitle?: string;
}

/**
 * Overlay plein écran affiché pendant un traitement IA (extraction OCR, vérification selfie...).
 * Progression simulée (asymptotique vers 92%) car le backend ne renvoie pas
 * d'événements de progression réels — évite de rester bloqué à 100% en attendant la réponse.
 */
export function ExtractionOverlay({ visible, lang = "fr", title, subtitle }: ExtractionOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setElapsed(0);
      setProgress(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      const secs = (Date.now() - start) / 1000;
      setElapsed(secs);
      setProgress(92 * (1 - Math.exp(-secs / 4)));
    }, 100);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const resolvedTitle = title ?? (lang === "en" ? "Extracting information..." : "Extraction des informations...");
  const resolvedSubtitle = subtitle ?? (lang === "en"
    ? "Please wait, AI is analyzing your document."
    : "Merci de patienter, l'IA analyse votre document.");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(31,2,112,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeInOverlay 0.25s ease-out",
    }}>
      <div style={{
        background: "white", borderRadius: 24, padding: "40px 48px",
        maxWidth: 420, width: "90%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
          background: "linear-gradient(135deg, #1F0270, #3B12A6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "pulseExtract 1.4s ease-in-out infinite",
        }}>
          <ScanLine size={32} color="#FFBA08" />
        </div>

        <p style={{ fontSize: 19, fontWeight: 900, color: "#1F0270", margin: "0 0 6px" }}>{resolvedTitle}</p>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 28px" }}>{resolvedSubtitle}</p>

        <div style={{ fontSize: 44, fontWeight: 900, color: "#1F0270", marginBottom: 14, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(progress)}%
        </div>

        <div style={{ width: "100%", height: 12, borderRadius: 8, background: "#EEF2FF", overflow: "hidden", marginBottom: 14 }}>
          <div style={{
            height: "100%", width: `${progress}%`, borderRadius: 8,
            background: "linear-gradient(90deg, #1F0270, #3B12A6, #FFBA08)",
            transition: "width 0.2s linear",
          }} />
        </div>

        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, fontVariantNumeric: "tabular-nums" }}>
          {elapsed.toFixed(1)}s
        </p>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulseExtract {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
          100% { transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
