"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

const COMPATIBLE_BRANDS = [
  "iPhone XS / XR", "iPhone 11/12/13", "iPhone 14/15/16",
  "Samsung S21/S22", "Samsung S23/S24", "Google Pixel 3+",
  "Google Pixel 6/7/8", "Huawei P40", "Motorola Razr",
  "iPad Pro 2018+", "iPad Air 2019+",
];

export default function EsimCompatibilite() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [answer, setAnswer] = useState<"oui" | "non" | "sais-pas" | null>(null);
  const [showBrands, setShowBrands] = useState(false);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    if (!sessionStorage.getItem("kiosk_esim_forfait")) {
      router.replace("/borne/nouvelle-sim/esim/forfait");
    }
  }, [router]);

  const handleContinue = () => {
    sessionStorage.setItem("kiosk_esim_compat_ok", "true");
    router.push("/borne/nouvelle-sim/esim/scan-piece");
  };

  const steps = [
    {
      num: "01",
      title: lang === "en" ? "Open Settings" : "Paramètres",
      desc: lang === "en" ? "Go to Settings on your phone" : "Ouvrez Paramètres sur votre téléphone",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#1F0270" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#1F0270" strokeWidth="1.8"/></svg>
      ),
    },
    {
      num: "02",
      title: lang === "en" ? "Mobile Network" : "Réseau mobile",
      desc: lang === "en" ? "Tap Mobile Network or SIM card" : "Appuyez sur Réseau mobile ou Carte SIM",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="#1F0270" strokeWidth="1.8"/><circle cx="12" cy="17" r="1" fill="#1F0270"/></svg>
      ),
    },
    {
      num: "03",
      title: lang === "en" ? "Add eSIM" : "Ajouter une eSIM",
      desc: lang === "en" ? 'Look for "Add eSIM" or "Digital SIM"' : 'Cherchez "Ajouter une eSIM" ou "SIM numérique"',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1F0270" strokeWidth="1.8"/><path d="M12 8v8M8 12h8" stroke="#1F0270" strokeWidth="1.8" strokeLinecap="round"/></svg>
      ),
    },
    {
      num: "04",
      title: lang === "en" ? "Compatible!" : "Compatible !",
      desc: lang === "en" ? "You see the option → your phone works" : "Si vous voyez cette option → c'est compatible",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#16A34A" strokeWidth="1.8"/><path d="M8 12.5l2.5 2.5L16 9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ),
    },
  ];

  const options = [
    {
      value: "oui" as const,
      emoji: "✅",
      label: lang === "en" ? "Yes, compatible" : "Oui, il est compatible",
      selectedBg: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
      selectedBorder: "#22C55E",
      selectedColor: "#166534",
    },
    {
      value: "non" as const,
      emoji: "✖",
      label: lang === "en" ? "No, not compatible" : "Non, pas compatible",
      selectedBg: "linear-gradient(135deg, #FEF2F2, #FECACA)",
      selectedBorder: "#EF4444",
      selectedColor: "#991B1B",
    },
    {
      value: "sais-pas" as const,
      emoji: "❓",
      label: lang === "en" ? "I don't know" : "Je ne sais pas",
      selectedBg: "linear-gradient(135deg, #FFFBEB, #FDE68A)",
      selectedBorder: "#FBBF24",
      selectedColor: "#92400E",
    },
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      paddingBottom: 32,
      animation: "fadeIn 0.4s ease",
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ maxWidth: 680, width: "100%" }}>

        {/* ── En-tête ── */}
        <div style={{ textAlign: "center", marginBottom: "clamp(20px, 3vh, 36px)" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64, height: 64,
            borderRadius: 18,
            background: "linear-gradient(135deg, #1F0270 0%, #3B12A6 100%)",
            boxShadow: "0 8px 24px rgba(31,2,112,0.22)",
            marginBottom: 18,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5C5 9.46 7.24 6.96 10.16 6.55" stroke="#FFBA08" strokeWidth="2" strokeLinecap="round"/>
              <path d="M19 12.5C19 9.46 16.76 6.96 13.84 6.55" stroke="#FFBA08" strokeWidth="2" strokeLinecap="round"/>
              <path d="M2 12.5C2 7.81 5.36 3.92 9.79 3.1" stroke="#FFBA08" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"/>
              <path d="M22 12.5C22 7.81 18.64 3.92 14.21 3.1" stroke="#FFBA08" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"/>
              <circle cx="12" cy="12.5" r="2.5" fill="#FFBA08"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "clamp(20px, 2.8vw, 30px)", fontWeight: 900, color: "#1F0270", margin: "0 0 10px" }}>
            {lang === "en" ? "Is your phone eSIM compatible?" : "Votre téléphone est-il compatible eSIM ?"}
          </h2>
          <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0, maxWidth: 460, marginInline: "auto", lineHeight: 1.6 }}>
            {lang === "en"
              ? "An eSIM is a built-in digital SIM. Check if your phone supports it."
              : "L'eSIM est une SIM numérique intégrée à votre appareil. Vérifiez la compatibilité."}
          </p>
        </div>

        {/* ── Choix ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {options.map((opt) => {
            const isSelected = answer === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAnswer(opt.value)}
                style={{
                  background: isSelected ? opt.selectedBg : "white",
                  border: `2px solid ${isSelected ? opt.selectedBorder : "#E5E7EB"}`,
                  borderRadius: 18,
                  padding: "20px 12px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  transform: isSelected ? "scale(1.04) translateY(-3px)" : "scale(1)",
                  boxShadow: isSelected ? `0 8px 24px ${opt.selectedBorder}30` : "0 2px 8px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? opt.selectedColor : "#374151", margin: 0, lineHeight: 1.4 }}>
                  {opt.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Non compatible ── */}
        {answer === "non" && (
          <div style={{
            background: "linear-gradient(135deg, #FEF2F2 0%, #fff 100%)",
            border: "2px solid #FECACA",
            borderRadius: 18,
            padding: "20px 24px",
            marginBottom: 20,
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>📵</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, color: "#991B1B", margin: "0 0 6px", fontSize: 15 }}>
                {lang === "en" ? "Your phone doesn't support eSIM" : "Votre téléphone ne supporte pas l'eSIM"}
              </p>
              <p style={{ fontSize: 13, color: "#B91C1C", margin: "0 0 14px", lineHeight: 1.5 }}>
                {lang === "en"
                  ? "No problem! You can get a standard physical SIM card."
                  : "Pas de problème ! Vous pouvez obtenir une carte SIM physique standard."}
              </p>
              <button
                onClick={() => { sessionStorage.removeItem("kiosk_flow"); router.push("/borne/nouvelle-sim/scan-piece"); }}
                style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <span>→</span>
                {lang === "en" ? "Switch to Physical SIM" : "Basculer vers SIM Physique"}
              </button>
            </div>
          </div>
        )}

        {/* ── Guide 4 étapes (sais-pas) ── */}
        {answer === "sais-pas" && (
          <div style={{
            background: "linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 100%)",
            border: "2px solid #C7D2FE",
            borderRadius: 20,
            padding: "22px 20px",
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1F0270", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="#FFBA08" strokeWidth="2"/><circle cx="12" cy="17" r="1.2" fill="#FFBA08"/></svg>
              </div>
              <p style={{ fontWeight: 900, color: "#1F0270", margin: 0, fontSize: 15 }}>
                {lang === "en" ? "How to check in 4 steps" : "Comment vérifier en 4 étapes"}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  background: "white",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  border: "1px solid #E0E7FF",
                  boxShadow: "0 2px 8px rgba(31,2,112,0.05)",
                }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: i === 3 ? "#F0FDF4" : "#EEF2FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 13, color: "#1F0270", margin: "0 0 3px" }}>{s.title}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Marques */}
            <button
              onClick={() => setShowBrands(!showBrands)}
              style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: "#1F0270", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: showBrands ? 10 : 0 }}
            >
              <span style={{ transition: "transform 0.2s", display: "inline-block", transform: showBrands ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
              {lang === "en" ? "See compatible phones" : "Voir les téléphones compatibles"}
            </button>
            {showBrands && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {COMPATIBLE_BRANDS.map((b) => (
                  <span key={b} style={{ background: "#EEF2FF", color: "#3730A3", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>{b}</span>
                ))}
              </div>
            )}

            {/* CTA rapide */}
            <button
              onClick={() => setAnswer("oui")}
              style={{
                marginTop: 16,
                background: "linear-gradient(135deg, #1F0270, #3B12A6)",
                color: "white", border: "none", borderRadius: 12,
                padding: "12px 20px",
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                width: "100%",
                boxShadow: "0 4px 14px rgba(31,2,112,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              ✓ {lang === "en" ? "Yes, my phone is compatible — Continue" : "Oui, mon téléphone est compatible — Continuer"}
            </button>
          </div>
        )}

        {/* ── Navigation ── */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4 }}>
          <button
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "white", border: "1.5px solid #E5E7EB",
              borderRadius: 12, padding: "12px 24px",
              color: "#6B7280", fontSize: 15, fontWeight: 600, cursor: "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1F0270"; e.currentTarget.style.color = "#1F0270"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#6B7280"; }}
          >
            <ArrowLeft size={18} />
            {lang === "en" ? "Back" : "Retour"}
          </button>
          <button
            onClick={handleContinue}
            disabled={answer !== "oui"}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: answer === "oui" ? "linear-gradient(135deg, #1F0270, #3B12A6)" : "#E5E7EB",
              border: "none", borderRadius: 12, padding: "12px 36px",
              color: answer === "oui" ? "white" : "#9CA3AF",
              fontSize: 15, fontWeight: 700,
              cursor: answer === "oui" ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: answer === "oui" ? "0 4px 18px rgba(31,2,112,0.35)" : "none",
            }}
          >
            {lang === "en" ? "Continue" : "Continuer"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
