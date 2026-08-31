"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCcw, Microchip, Lock, Globe, User as UserIcon, Briefcase, BatteryCharging, ShieldCheck } from "lucide-react";

export default function Services() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [profile, setProfile] = useState("resident");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    setProfile(sessionStorage.getItem("kiosk_profile") || "resident");
  }, []);

  const services = [
    {
      id: "nouvelle-sim",
      title: lang === "en" ? "New SIM" : "Nouvelle SIM",
      description: lang === "en" ? "Get a new SIM card in minutes." : "Obtenez une nouvelle carte SIM en quelques minutes.",
      icon: <Microchip size={52} strokeWidth={1.5} style={{ color: "#1F0270", marginBottom: 20 }} />,
      action: () => router.push("/borne/nouvelle-sim/format"),
      disabled: false,
    },
    {
      id: "reactivation",
      title: lang === "en" ? "Reactivation" : "Réactivation",
      description: lang === "en" ? "Reactivate a disabled chip safely." : "Réactivez une puce désactivée en toute sécurité.",
      icon: <RefreshCcw size={52} strokeWidth={1.5} style={{ color: "#1F0270", marginBottom: 20 }} />,
      action: () => router.push("/borne/reactivation/identification"),
      disabled: false,
    },
    {
      id: "recharge",
      title: lang === "en" ? "Recharge" : "Recharge",
      description: lang === "en" ? "Top up your number quickly." : "Rechargez votre numéro rapidement.",
      icon: <BatteryCharging size={52} strokeWidth={1.5} style={{ color: "#1F0270", marginBottom: 20 }} />,
      action: () => router.push("/borne/recharge/numero"),
      disabled: false,
    },
    {
      id: "verification",
      title: lang === "en" ? "Verification" : "Vérification",
      description: lang === "en" ? "Check the information linked to your ID." : "Vérifiez les informations associées à votre pièce d'identité.",
      icon: <ShieldCheck size={52} strokeWidth={1.5} style={{ color: "#1F0270", marginBottom: 20 }} />,
      action: () => router.push("/borne/verification/scan-piece"),
      disabled: false,
    },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      width: "100%",
      maxWidth: "clamp(560px, 80vw, 1000px)",
      paddingBottom: 24,
    }}>

      {/* Titre */}
      <div style={{ textAlign: "center", marginBottom: "clamp(14px, 2vh, 28px)" }}>
        <h1 style={{
          fontSize: "clamp(24px, 3vw, 36px)",
          fontWeight: 900, color: "#1F0270", margin: "0 0 10px 0"
        }}>
          {lang === "en" ? "Choose a service" : "Choisissez un service"}
        </h1>
        <p style={{ fontSize: "clamp(13px, 1.4vw, 16px)", color: "#9CA3AF", margin: 0 }}>
          {lang === "en" ? "What would you like to do today?" : "Que souhaitez-vous faire aujourd'hui ?"}
        </p>
      </div>

      {/* Grille 2x2 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "clamp(10px, 1.2vw, 16px)",
        width: "100%",
        marginBottom: "clamp(14px, 2vh, 24px)",
      }}>
        {services.map((service) => (
          <div
            key={service.id}
            data-ai-action={`btn-${service.id}`}
            onClick={!service.disabled ? service.action : undefined}
            style={{
              background: "white",
              borderRadius: "clamp(16px, 2vw, 24px)",
              /* Padding réduit sur petit écran borne */
              padding: "clamp(20px, 2.5vw, 36px) clamp(16px, 2vw, 28px)",
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center",
              cursor: service.disabled ? "not-allowed" : "pointer",
              opacity: service.disabled ? 0.6 : 1,
              boxShadow: "0 4px 20px rgba(31,2,112,0.07)",
              border: "1.5px solid transparent",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!service.disabled) {
                (e.currentTarget as HTMLDivElement).style.border = "1.5px solid #FFBA08";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = "1.5px solid transparent";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            {/* Icône — taille réduite sur borne */}
            <div style={{ fontSize: "clamp(32px, 4vw, 52px)", marginBottom: "clamp(10px, 1.2vw, 20px)" }}>
              {service.icon}
            </div>

            <h3 style={{
              fontSize: "clamp(14px, 1.6vw, 18px)", fontWeight: 800,
              color: service.disabled ? "#C0C0D8" : "#1F0270",
              margin: "0 0 8px 0",
            }}>
              {service.title}
            </h3>
            <p style={{
              fontSize: "clamp(12px, 1.2vw, 14px)", color: "#9CA3AF",
              margin: "0 0 clamp(14px, 1.8vw, 24px) 0",
              lineHeight: 1.5, flexGrow: 1,
            }}>
              {service.description}
            </p>

            {service.disabled ? (
              <div style={{
                width: "clamp(36px, 4vw, 48px)", height: "clamp(36px, 4vw, 48px)",
                borderRadius: "50%", background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Lock size={18} color="#C0C0D8" />
              </div>
            ) : (
              <div style={{
                width: "clamp(36px, 4vw, 48px)", height: "clamp(36px, 4vw, 48px)",
                borderRadius: "50%", background: "#FFBA08",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(255,186,8,0.35)",
              }}>
                <ArrowRight size={20} color="#1F0270" strokeWidth={2.5} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sélecteurs langue/profil */}
      <div style={{ display: "flex", gap: 12, opacity: 0.85 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "white", padding: "10px 22px",
          borderRadius: 999, boxShadow: "0 2px 10px rgba(31,2,112,0.08)",
          fontSize: 14, fontWeight: 700, color: "#1F0270",
        }}>
          <Globe size={15} color="#1F0270" /> {lang === "en" ? "English" : "Français"}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "white", padding: "10px 22px",
          borderRadius: 999, boxShadow: "0 2px 10px rgba(31,2,112,0.08)",
          fontSize: 14, fontWeight: 700, color: "#1F0270",
        }}>
          {profile === "etranger" ? <Briefcase size={15} color="#1F0270" /> : <UserIcon size={15} color="#1F0270" />}
          {profile === "etranger" ? (lang === "en" ? "Foreigner" : "Étranger") : (lang === "en" ? "Resident" : "Résident")}
        </div>
      </div>

    </div>
  );
}
