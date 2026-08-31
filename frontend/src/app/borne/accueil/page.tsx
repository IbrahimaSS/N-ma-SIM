"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Globe, Briefcase, User as UserIcon,
  HelpCircle, ArrowRight, Check, Hand,
} from "lucide-react";

export default function Accueil() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [lang, setLang] = useState<"fr" | "en" | "sus" | "pou">("fr");
  const [profile, setProfile] = useState<"resident" | "etranger" | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Sauvegarde globale de la session pour l'Agent IA et les autres pages
  useEffect(() => {
    if (lang) sessionStorage.setItem("kiosk_lang", lang);
    if (profile) sessionStorage.setItem("kiosk_profile", profile);
  }, [lang, profile]);

  // Le bouton est actif si tout est sélectionné
  const canStart = accepted && lang !== null && profile !== null;

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
        <span style={{ color: "#1F0270" }}>{lang === "en" ? "Your SIM, " : "Votre SIM, "}</span>
        <span style={{ color: "#FFBA08" }}>{lang === "en" ? "simply." : "en toute simplicité."}</span>
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
          {lang === "en" ? "Welcome!" : "Bienvenue !"}
        </h1>

        <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "#6B7280", marginBottom: 24, maxWidth: 420, lineHeight: 1.6 }}>
          {lang === "en" 
            ? "Get your SIM, manage your services quickly and securely." 
            : "Obtenez votre SIM, gérez vos services rapidement et en toute sécurité."}
        </p>

        {/* =============================================
            SÉLECTEURS LANGUE ET PROFIL
        ============================================= */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Langue — 3 options : Français | English | Soussou */}
          <div style={{
            width: "100%", background: "#F9FAFB", borderRadius: 16,
            display: "flex", overflow: "hidden", border: "1px solid #E5E7EB"
          }}>
            {/* Français */}
            <button data-ai-action="btn-lang-fr" onClick={() => setLang("fr")} style={{
              flex: 1, height: 54,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 700, fontSize: 13,
              color: lang === "fr" ? "#1F0270" : "#9CA3AF",
              background: lang === "fr" ? "rgba(31,2,112,0.05)" : "transparent",
              border: "none",
              borderBottom: lang === "fr" ? "3px solid #1F0270" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 20 }}>🇫🇷</span>
              Français
            </button>

            {/* English */}
            <button data-ai-action="btn-lang-en" onClick={() => setLang("en")} style={{
              flex: 1, height: 54,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 700, fontSize: 13,
              color: lang === "en" ? "#1F0270" : "#9CA3AF",
              background: lang === "en" ? "rgba(31,2,112,0.05)" : "transparent",
              border: "none",
              borderLeft: "1px solid #E5E7EB",
              borderBottom: lang === "en" ? "3px solid #1F0270" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 20 }}>🇬🇧</span>
              English
            </button>

            {/* Soussou */}
            <button data-ai-action="btn-lang-sus" onClick={() => { setLang("sus"); setProfile("resident"); }} style={{
              flex: 1, height: 54,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontWeight: 700, fontSize: 13,
              color: lang === "sus" ? "#1F6B2D" : "#9CA3AF",
              background: lang === "sus" ? "rgba(31,107,45,0.07)" : "transparent",
              border: "none",
              borderLeft: "1px solid #E5E7EB",
              borderBottom: lang === "sus" ? "3px solid #1F6B2D" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              {/* Icône Soussou — drapeau Guinée + badge SUS */}
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #CE1126 33%, #FCD116 33% 66%, #009A44 66%)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                fontSize: 9, fontWeight: 900, color: "white",
                letterSpacing: 0, flexShrink: 0,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)"
              }}>
                SUS
              </span>
              Soussou
            </button>

            {/* Poular */}
            <button data-ai-action="btn-lang-pou" onClick={() => { setLang("pou"); setProfile("resident"); }} style={{
              flex: 1, height: 54,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontWeight: 700, fontSize: 13,
              color: lang === "pou" ? "#1F6B2D" : "#9CA3AF",
              background: lang === "pou" ? "rgba(31,107,45,0.07)" : "transparent",
              border: "none",
              borderLeft: "1px solid #E5E7EB",
              borderBottom: lang === "pou" ? "3px solid #1F6B2D" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #CE1126 33%, #FCD116 33% 66%, #009A44 66%)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                fontSize: 9, fontWeight: 900, color: "white",
                letterSpacing: 0, flexShrink: 0,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)"
              }}>
                POU
              </span>
              Poular
            </button>
          </div>

          {/* Profil */}
          <div style={{
            width: "100%", background: "#F9FAFB", borderRadius: 16,
            display: "flex", overflow: "hidden", border: "1px solid #E5E7EB"
          }}>
            {([
              { key: "resident", label_fr: "Résident", label_en: "Resident", icon: <UserIcon size={16} /> },
              { key: "etranger", label_fr: "Étranger", label_en: "Foreigner", icon: <Briefcase size={16} /> },
            ] as const).map((p) => (
              <button key={p.key} data-ai-action={`btn-profil-${p.key}`} onClick={() => setProfile(p.key)} style={{
                flex: 1, height: 50,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontWeight: 700, fontSize: 14,
                color: profile === p.key ? "#1F0270" : "#9CA3AF",
                background: profile === p.key ? "rgba(31,2,112,0.05)" : "transparent",
                border: "none",
                borderBottom: profile === p.key ? "3px solid #1F0270" : "3px solid transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {p.icon}
                {lang === "en" ? p.label_en : p.label_fr}
              </button>
            ))}
          </div>
        </div>

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
            marginBottom: 20,
            background: accepted ? "rgba(31,2,112,0.02)" : "#FAFAFA",
            transition: "all 0.2s",
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            style={{
              padding: "4px 8px",
              background: "#1F0270",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {lang === "en" ? "Read" : "Lire"}
          </button>
          <p style={{ fontSize: 13, color: "#1F0270", textAlign: "left", margin: 0, lineHeight: 1.5, userSelect: "none" }}>
            {lang === "en" ? (
              <>— I accept the <strong>Terms of Use</strong> and <strong>Privacy Policy</strong></>
            ) : (
              <>— J'accepte les <strong>conditions d'utilisation</strong> et la <strong>politique de confidentialité</strong></>
            )}
          </p>
        </div>

        {/* Bouton principal */}
        <button
          data-ai-action="btn-accepter"
          onClick={() => canStart && router.push("/borne/services")}
          style={{
            width: "100%", height: 58,
            background: canStart ? "#FFBA08" : "#F3F4F6",
            color: canStart ? "#1F0270" : "#9CA3AF",
            fontWeight: 800, fontSize: "clamp(16px, 1.4vw, 20px)",
            borderRadius: 14, border: "none",
            cursor: canStart ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            boxShadow: canStart ? "0 4px 24px rgba(255,186,8,0.40)" : "none",
            transition: "all 0.2s",
          }}
        >
          {lang === "en" ? "I accept and start" : "J'accepte et je commence"}
          <div style={{
            position: "absolute", right: 14,
            width: 42, height: 42, borderRadius: "50%",
            border: `2px solid ${canStart ? "#1F0270" : "#D1D5DB"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArrowRight size={20} color={canStart ? "#1F0270" : "#9CA3AF"} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Modal Conditions d'utilisation */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20
        }}>
          <div style={{
            background: "white",
            borderRadius: 24,
            padding: "32px",
            maxWidth: 600,
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            textAlign: "left"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1F0270", marginBottom: 20 }}>
              {lang === "en" ? "Terms of Use and Privacy Policy" : "Conditions d’utilisation et politique de confidentialité"}
            </h2>
            
            <div style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 16 }}>
              {lang === "en" ? (
                <>
                  <p>By using N’ma SIM, you agree that certain information will be collected and used only for processing your request.</p>
                  
                  <div>
                    <p style={{ fontWeight: 700, color: "#1F0270", marginBottom: 8 }}>The data that may be collected includes:</p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>your photo or selfie;</li>
                      <li>your ID document;</li>
                      <li>information extracted from your ID document;</li>
                      <li>your user profile;</li>
                      <li>information related to the requested service.</li>
                    </ul>
                  </div>

                  <div>
                    <p style={{ fontWeight: 700, color: "#1F0270", marginBottom: 8 }}>This information is used to:</p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>verify your identity;</li>
                      <li>secure your request;</li>
                      <li>enable the processing of the chosen service;</li>
                      <li>transmit necessary information to the operator;</li>
                      <li>track your operation.</li>
                    </ul>
                  </div>

                  <p>N’ma SIM must not use this data for other purposes without authorization. The information must be protected and processed securely.</p>
                  
                  <p style={{ fontWeight: 700, color: "#1F0270" }}>By checking the box, you confirm that you have read and accepted these terms.</p>
                </>
              ) : (
                <>
                  <p>En utilisant N’ma SIM, vous acceptez que certaines informations soient collectées et utilisées uniquement pour le traitement de votre demande.</p>
                  
                  <div>
                    <p style={{ fontWeight: 700, color: "#1F0270", marginBottom: 8 }}>Les données pouvant être collectées sont :</p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>votre photo ou selfie ;</li>
                      <li>votre pièce d’identité ;</li>
                      <li>les informations extraites de votre pièce d’identité ;</li>
                      <li>votre profil utilisateur ;</li>
                      <li>les informations liées au service demandé.</li>
                    </ul>
                  </div>

                  <div>
                    <p style={{ fontWeight: 700, color: "#1F0270", marginBottom: 8 }}>Ces informations sont utilisées pour :</p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>vérifier votre identité ;</li>
                      <li>sécuriser votre demande ;</li>
                      <li>permettre le traitement du service choisi ;</li>
                      <li>transmettre les informations nécessaires à l’opérateur ;</li>
                      <li>assurer le suivi de votre opération.</li>
                    </ul>
                  </div>

                  <p>N’ma SIM ne doit pas utiliser ces données à d’autres fins sans autorisation. Les informations doivent être protégées et traitées de manière sécurisée.</p>
                  
                  <p style={{ fontWeight: 700, color: "#1F0270" }}>En cochant la case, vous confirmez avoir lu et accepté ces conditions.</p>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: 24,
                width: "100%",
                height: 50,
                background: "#FFBA08",
                color: "#1F0270",
                fontWeight: 800,
                fontSize: 16,
                borderRadius: 12,
                border: "none",
                cursor: "pointer"
              }}
            >
              {lang === "en" ? "Close" : "Fermer"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
