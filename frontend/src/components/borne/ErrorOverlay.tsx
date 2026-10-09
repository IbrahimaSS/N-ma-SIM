"use client";
import { XCircle, RotateCcw } from "lucide-react";

interface ErrorOverlayProps {
  visible: boolean;
  lang?: string;
  title?: string;
  message: string;
  /** Libellé du bouton (par défaut « Réessayer »). */
  actionLabel?: string;
  onClose: () => void;
}

/**
 * Overlay plein écran "échec" affiché au centre (pendant de SuccessOverlay),
 * ex : selfie KYC refusé. Reste affiché jusqu'à ce que le client appuie sur le bouton.
 */
export function ErrorOverlay({
  visible,
  lang = "fr",
  title,
  message,
  actionLabel,
  onClose,
}: ErrorOverlayProps) {
  if (!visible) return null;

  const resolvedTitle = title ?? (lang === "en" ? "Verification failed" : "Vérification non réussie");
  const resolvedAction = actionLabel ?? (lang === "en" ? "Try again" : "Réessayer");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2100,
      background: "rgba(127,29,29,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeInOverlay 0.25s ease-out",
    }}>
      <div style={{
        background: "white", borderRadius: 28, padding: "48px 56px",
        maxWidth: 480, width: "90%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        animation: "errorPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%", margin: "0 auto 24px",
          background: "linear-gradient(135deg, #DC2626, #EF4444)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 14px rgba(239,68,68,0.14), 0 0 0 28px rgba(239,68,68,0.07)",
        }}>
          <XCircle size={52} color="white" strokeWidth={2} />
        </div>

        <p style={{ fontSize: 26, fontWeight: 900, color: "#991B1B", margin: "0 0 12px" }}>{resolvedTitle}</p>
        <p style={{ fontSize: 15, color: "#4B5563", margin: "0 0 28px", lineHeight: 1.5 }}>{message}</p>

        <button
          onClick={onClose}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "14px 24px", borderRadius: 14, border: "none", cursor: "pointer",
            background: "linear-gradient(90deg, #DC2626, #EF4444)", color: "white",
            fontSize: 16, fontWeight: 700,
          }}
        >
          <RotateCcw size={18} /> {resolvedAction}
        </button>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes errorPopIn {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
