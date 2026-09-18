"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessOverlayProps {
  visible: boolean;
  lang?: string;
  title?: string;
  subtitle?: string;
  /** Durée d'affichage avant déclenchement de onComplete (ms). */
  durationMs?: number;
  onComplete: () => void;
}

/**
 * Overlay plein écran "succès" affiché au centre après une validation (ex: selfie KYC accepté).
 * Reste affiché `durationMs`, puis appelle onComplete (généralement une navigation).
 */
export function SuccessOverlay({
  visible,
  lang = "fr",
  title,
  subtitle,
  durationMs = 4000,
  onComplete,
}: SuccessOverlayProps) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    if (!visible) {
      setRemaining(durationMs);
      return;
    }
    const start = Date.now();
    const tick = setInterval(() => {
      setRemaining(Math.max(0, durationMs - (Date.now() - start)));
    }, 50);
    const timeout = setTimeout(onComplete, durationMs);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, durationMs]);

  if (!visible) return null;

  const resolvedTitle = title ?? (lang === "en" ? "Identity verified!" : "Identité vérifiée !");
  const resolvedSubtitle = subtitle ?? (lang === "en" ? "Continuing automatically..." : "Poursuite automatique...");
  const progressPct = (remaining / durationMs) * 100;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2100,
      background: "rgba(22,101,52,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeInOverlay 0.25s ease-out",
    }}>
      <div style={{
        background: "white", borderRadius: 28, padding: "48px 56px",
        maxWidth: 440, width: "90%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        animation: "successPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%", margin: "0 auto 24px",
          background: "linear-gradient(135deg, #16A34A, #22C55E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 14px rgba(34,197,94,0.14), 0 0 0 28px rgba(34,197,94,0.07)",
        }}>
          <CheckCircle2 size={52} color="white" strokeWidth={2} />
        </div>

        <p style={{ fontSize: 26, fontWeight: 900, color: "#166534", margin: "0 0 8px" }}>{resolvedTitle}</p>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 28px" }}>{resolvedSubtitle}</p>

        <div style={{ width: "100%", height: 8, borderRadius: 8, background: "#DCFCE7", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progressPct}%`, borderRadius: 8,
            background: "linear-gradient(90deg, #16A34A, #22C55E)",
            transition: "width 0.05s linear",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes successPopIn {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
