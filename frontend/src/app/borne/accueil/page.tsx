"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Globe, Briefcase, User as UserIcon,
  HelpCircle, ArrowRight, Check, Hand,
} from "lucide-react";

export default function Accueil() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(true);
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [profile, setProfile] = useState<"resident" | "etranger">("resident");

  return (
    <div
      className="relative z-10 flex flex-col items-center"
      style={{ width: "100%", paddingTop: "16px", paddingBottom: "60px" }}
    >

      {/* =============================================
          1. LOGO — image réelle, centrée en haut
      ============================================= */}
      <div 
        className="w-[260px] h-[80px] lg:w-[360px] lg:h-[120px]"
        style={{
          background: "white",
          borderRadius: "0 0 24px 24px",
          boxShadow: "0 4px 24px rgba(31,2,112,0.10)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
        }}
      >
        <img
          src="/logo-transparent.png"
          alt="N'ma SIM Logo"
          className="w-[95%] scale-[1.15] lg:w-[100%] lg:scale-[1.2]"
          style={{ display: "block" }}
        />
      </div>

      {/* =============================================
          2. SLOGAN
      ============================================= */}
      <p style={{ marginTop: 24, marginBottom: 20, fontSize: "clamp(16px, 1.4vw, 20px)", fontWeight: 700, textAlign: "center" }}>
        <span style={{ color: "#1F0270" }}>Votre SIM, </span>
        <span style={{ color: "#FFBA08" }}>en toute simplicité.</span>
      </p>

      {/* =============================================
          3. CARTE CENTRALE
      ============================================= */}
      <div style={{
        width: 660,
        maxWidth: "92vw",
        background: "white",
        borderRadius: 24,
        padding: "clamp(24px, 3vh, 40px) clamp(28px, 4vw, 48px)",
        boxShadow: "0 8px 48px rgba(31,2,112,0.09)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>

        {/* Icône */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#EEEEF8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserIcon size={36} color="#1F0270" strokeWidth={1.5} />
          </div>
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            background: "white", borderRadius: "50%",
            padding: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}>
            <Hand size={18} color="#FFBA08" />
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(26px, 2.8vw, 36px)", fontWeight: 900, color: "#1F0270", margin: "0 0 10px 0" }}>
          Bienvenue !
        </h1>

        <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "#6B7280", marginBottom: 24, maxWidth: 420, lineHeight: 1.6 }}>
          Obtenez votre SIM, gérez vos services rapidement et en toute sécurité.
        </p>

        {/* Checkbox conditions */}
        <div
          onClick={() => setAccepted(!accepted)}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px",
            border: `1.5px solid ${accepted ? "#1F0270" : "#E5E7EB"}`,
            borderRadius: 12,
            cursor: "pointer",
            marginBottom: 16,
            background: "#FAFAFA",
            transition: "border-color 0.2s",
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            background: accepted ? "#1F0270" : "transparent",
            border: `2px solid ${accepted ? "#1F0270" : "#D1D5DB"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            {accepted && <Check size={14} color="white" strokeWidth={3} />}
          </div>
          <p style={{ fontSize: 14, color: "#1F0270", textAlign: "left", margin: 0, lineHeight: 1.5, userSelect: "none" }}>
            J'accepte les <strong>conditions d'utilisation</strong> et la <strong>politique de confidentialité</strong>
          </p>
        </div>

        {/* Bouton principal */}
        <button
          onClick={() => accepted && router.push("/borne/services")}
          style={{
            width: "100%", height: 58,
            background: accepted ? "#FFBA08" : "#F3F4F6",
            color: accepted ? "#1F0270" : "#9CA3AF",
            fontWeight: 800, fontSize: "clamp(16px, 1.4vw, 20px)",
            borderRadius: 14, border: "none",
            cursor: accepted ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            boxShadow: accepted ? "0 4px 24px rgba(255,186,8,0.40)" : "none",
            transition: "all 0.2s",
          }}
        >
          J'accepte et je commence
          <div style={{
            position: "absolute", right: 14,
            width: 42, height: 42, borderRadius: "50%",
            border: `2px solid ${accepted ? "#1F0270" : "#D1D5DB"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArrowRight size={20} color={accepted ? "#1F0270" : "#9CA3AF"} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* =============================================
          4. SÉLECTEURS LANGUE ET PROFIL
      ============================================= */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 20 }}>

        {/* Langue */}
        <div style={{
          width: 440, maxWidth: "90vw",
          background: "white", borderRadius: 999,
          boxShadow: "0 2px 14px rgba(31,2,112,0.08)",
          display: "flex", overflow: "hidden",
        }}>
          {(["fr", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              flex: 1, height: 58,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 700, fontSize: 15,
              color: lang === l ? "#1F0270" : "#9CA3AF",
              background: "transparent", border: "none",
              borderBottom: lang === l ? "3px solid #1F0270" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <Globe size={16} color={lang === l ? "#1F0270" : "#9CA3AF"} />
              {l === "fr" ? "Français" : "English"}
            </button>
          ))}
        </div>

        {/* Profil */}
        <div style={{
          width: 440, maxWidth: "90vw",
          background: "white", borderRadius: 999,
          boxShadow: "0 2px 14px rgba(31,2,112,0.08)",
          display: "flex", overflow: "hidden",
        }}>
          {([
            { key: "resident", label: "Résident", icon: <UserIcon size={16} /> },
            { key: "etranger", label: "Étranger", icon: <Briefcase size={16} /> },
          ] as const).map((p) => (
            <button key={p.key} onClick={() => setProfile(p.key)} style={{
              flex: 1, height: 58,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 700, fontSize: 15,
              color: profile === p.key ? "#1F0270" : "#9CA3AF",
              background: "transparent", border: "none",
              borderBottom: profile === p.key ? "3px solid #1F0270" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* =============================================
          5. BOUTON BESOIN D'AIDE — fixe bas droite
      ============================================= */}
      <button style={{
        position: "fixed", bottom: 38, right: 55,
        height: 56, borderRadius: 999,
        paddingLeft: 28, paddingRight: 28,
        background: "white",
        border: "1.5px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(31,2,112,0.10)",
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer", zIndex: 50,
      }}>
        <HelpCircle size={22} color="#1F0270" />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1F0270" }}>Besoin d'aide ?</span>
      </button>

    </div>
  );
}
