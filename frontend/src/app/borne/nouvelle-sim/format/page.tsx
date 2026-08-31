"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function FormatSIM() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
  }, []);

  const t = {
    title: lang === "en" ? "Choose your SIM type" : "Choisissez votre type de SIM",
    subtitle: lang === "en"
      ? "Both options give you full access to N'ma SIM services"
      : "Les deux options vous donnent accès à tous les services N'ma SIM",
    physiqueTitle: lang === "en" ? "Physical SIM" : "SIM Physique",
    physiqueDesc: lang === "en"
      ? "A traditional SIM card issued instantly at the kiosk."
      : "Une carte SIM traditionnelle délivrée instantanément au kiosque.",
    esimTitle: "eSIM",
    esimDesc: lang === "en"
      ? "A digital SIM activated directly on your compatible phone."
      : "Une SIM numérique activée directement sur votre téléphone compatible.",
    back: lang === "en" ? "Back" : "Retour",
    newLabel: lang === "en" ? "New" : "Nouveau",
    instantLabel: lang === "en" ? "Instant" : "Instantané",
    physFeature1: lang === "en" ? "Physical card delivered" : "Carte physique remise",
    physFeature2: lang === "en" ? "Works on any phone" : "Fonctionne sur tout téléphone",
    physFeature3: lang === "en" ? "Ready in 5 minutes" : "Prête en 5 minutes",
    esimFeature1: lang === "en" ? "No physical card" : "Pas de carte physique",
    esimFeature2: lang === "en" ? "Compatible phone required" : "Téléphone compatible requis",
    esimFeature3: lang === "en" ? "Instant remote activation" : "Activation à distance instantanée",
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      minHeight: "70vh",
      padding: "0 16px 32px",
    }}>

      {/* En-tête */}
      <div style={{ textAlign: "center", marginBottom: "clamp(28px, 4vh, 48px)" }}>
        <h1 style={{
          fontSize: "clamp(24px, 3vw, 38px)",
          fontWeight: 900,
          color: "#1F0270",
          margin: "0 0 12px 0",
          letterSpacing: "-0.5px",
        }}>
          {t.title}
        </h1>
        <p style={{ fontSize: "clamp(13px, 1.4vw, 16px)", color: "#9CA3AF", margin: 0 }}>
          {t.subtitle}
        </p>
      </div>

      {/* Cartes */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "clamp(14px, 2vw, 28px)",
        width: "100%",
        maxWidth: "clamp(520px, 70vw, 820px)",
        marginBottom: "clamp(24px, 3vh, 40px)",
      }}>

        {/* SIM Physique */}
        <button
          onClick={() => {
            sessionStorage.removeItem("kiosk_flow");
            router.push("/borne/nouvelle-sim/scan-piece");
          }}
          style={{
            background: "white",
            borderRadius: "clamp(16px, 2vw, 24px)",
            border: "2px solid #E5E7EB",
            padding: "clamp(24px, 3vw, 40px) clamp(20px, 2.5vw, 32px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 16px rgba(31,2,112,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = "2px solid #FFBA08";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(31,2,112,0.13)";
            e.currentTarget.style.transform = "translateY(-5px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = "2px solid #E5E7EB";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(31,2,112,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Badge Instantané */}
          <div style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "#F0FDF4",
            color: "#16A34A",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}>
            ✓ {t.instantLabel}
          </div>

          {/* Icône SIM */}
          <div style={{
            width: "clamp(60px, 7vw, 84px)",
            height: "clamp(60px, 7vw, 84px)",
            borderRadius: "clamp(14px, 1.8vw, 20px)",
            background: "linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "clamp(14px, 1.8vw, 22px)",
            marginTop: "clamp(18px, 2vw, 24px)",
          }}>
            {/* SVG carte SIM */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="2" width="13" height="20" rx="2" stroke="#1F0270" strokeWidth="1.8"/>
              <path d="M12 2L17 7" stroke="#1F0270" strokeWidth="1.8" strokeLinecap="round"/>
              <rect x="7" y="10" width="3" height="3" rx="0.5" fill="#1F0270"/>
              <rect x="11.5" y="10" width="3" height="3" rx="0.5" fill="#1F0270"/>
              <rect x="7" y="14.5" width="3" height="3" rx="0.5" fill="#1F0270"/>
              <rect x="11.5" y="14.5" width="3" height="3" rx="0.5" fill="#1F0270"/>
            </svg>
          </div>

          <h3 style={{
            fontSize: "clamp(16px, 1.8vw, 21px)",
            fontWeight: 800,
            color: "#1F0270",
            margin: "0 0 8px 0",
          }}>
            {t.physiqueTitle}
          </h3>

          <p style={{
            fontSize: "clamp(12px, 1.2vw, 14px)",
            color: "#9CA3AF",
            lineHeight: 1.6,
            margin: "0 0 clamp(16px, 2vw, 24px) 0",
          }}>
            {t.physiqueDesc}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginBottom: "clamp(20px, 2.5vw, 28px)" }}>
            {[t.physFeature1, t.physFeature2, t.physFeature3].map((feat) => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4B5563" }}>
                <span style={{ color: "#16A34A", fontWeight: 700, fontSize: 14 }}>✓</span>
                {feat}
              </div>
            ))}
          </div>

          {/* Flèche CTA */}
          <div style={{
            width: "clamp(40px, 5vw, 52px)",
            height: "clamp(40px, 5vw, 52px)",
            borderRadius: "50%",
            background: "#FFBA08",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(255,186,8,0.4)",
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M13 6L19 12L13 18" stroke="#1F0270" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {/* eSIM */}
        <button
          onClick={() => {
            sessionStorage.setItem("kiosk_flow", "esim");
            router.push("/borne/nouvelle-sim/esim/forfait");
          }}
          style={{
            background: "white",
            borderRadius: "clamp(16px, 2vw, 24px)",
            border: "2px solid #E5E7EB",
            padding: "clamp(24px, 3vw, 40px) clamp(20px, 2.5vw, 32px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 16px rgba(31,2,112,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = "2px solid #1F0270";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(31,2,112,0.18)";
            e.currentTarget.style.transform = "translateY(-5px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = "2px solid #E5E7EB";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(31,2,112,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Badge Nouveau */}
          <div style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "linear-gradient(135deg, #FFBA08, #FF9500)",
            color: "#1F0270",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.03em",
          }}>
            ✦ {t.newLabel}
          </div>

          {/* Icône eSIM */}
          <div style={{
            width: "clamp(60px, 7vw, 84px)",
            height: "clamp(60px, 7vw, 84px)",
            borderRadius: "clamp(14px, 1.8vw, 20px)",
            background: "linear-gradient(135deg, #1F0270 0%, #3B12A6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "clamp(14px, 1.8vw, 22px)",
            marginTop: "clamp(18px, 2vw, 24px)",
            boxShadow: "0 8px 24px rgba(31,2,112,0.22)",
          }}>
            {/* SVG Signal / eSIM */}
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12.5C5 9.46 7.24 6.96 10.16 6.55" stroke="#FFBA08" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M19 12.5C19 9.46 16.76 6.96 13.84 6.55" stroke="#FFBA08" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M2 12.5C2 7.81 5.36 3.92 9.79 3.1" stroke="#FFBA08" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.55"/>
              <path d="M22 12.5C22 7.81 18.64 3.92 14.21 3.1" stroke="#FFBA08" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.55"/>
              <circle cx="12" cy="12.5" r="2.2" fill="#FFBA08"/>
            </svg>
          </div>

          <h3 style={{
            fontSize: "clamp(16px, 1.8vw, 21px)",
            fontWeight: 800,
            color: "#1F0270",
            margin: "0 0 8px 0",
          }}>
            {t.esimTitle}
          </h3>

          <p style={{
            fontSize: "clamp(12px, 1.2vw, 14px)",
            color: "#9CA3AF",
            lineHeight: 1.6,
            margin: "0 0 clamp(16px, 2vw, 24px) 0",
          }}>
            {t.esimDesc}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginBottom: "clamp(20px, 2.5vw, 28px)" }}>
            {[t.esimFeature1, t.esimFeature2, t.esimFeature3].map((feat) => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4B5563" }}>
                <span style={{ color: "#1F0270", fontWeight: 700, fontSize: 14 }}>✓</span>
                {feat}
              </div>
            ))}
          </div>

          {/* Flèche CTA */}
          <div style={{
            width: "clamp(40px, 5vw, 52px)",
            height: "clamp(40px, 5vw, 52px)",
            borderRadius: "50%",
            background: "#1F0270",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(31,2,112,0.4)",
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M13 6L19 12L13 18" stroke="#FFBA08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Bouton Retour */}
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "white",
          border: "1.5px solid #E5E7EB",
          borderRadius: 12,
          padding: "10px 22px",
          color: "#6B7280",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.18s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#1F0270";
          e.currentTarget.style.color = "#1F0270";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E5E7EB";
          e.currentTarget.style.color = "#6B7280";
        }}
      >
        <ArrowLeft size={16} />
        {t.back}
      </button>
    </div>
  );
}
