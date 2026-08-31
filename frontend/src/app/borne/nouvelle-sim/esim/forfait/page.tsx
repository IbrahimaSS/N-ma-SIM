"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Wifi, Check, Star } from "lucide-react";
import { ESIM_FORFAITS_DEMO } from "@/data/esim-forfaits";
import type { EsimForfait } from "@/data/esim-forfaits";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Mappe une offre backend (type SIM_ESIM) vers le format d'affichage du kiosque
function mapOffre(o: {
  id: string; nom: string; description: string | null; prix: number;
  data: string | null; appels: string | null; sms: string | null;
  duree: string | null; couleur: string | null;
}, index: number): EsimForfait {
  return {
    id: o.id,
    nom: o.nom,
    description: o.description || "",
    prixGNF: o.prix,
    data: o.data || "—",
    appels: o.appels || "—",
    sms: o.sms || "—",
    duree: o.duree || "30 jours",
    couleur: o.couleur || "#1F0270",
    populaire: index === 1, // met en avant le 2e forfait
  };
}

export default function EsimForfait() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [selected, setSelected] = useState<EsimForfait | null>(null);
  const [forfaits, setForfaits] = useState<EsimForfait[]>(ESIM_FORFAITS_DEMO);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");

    // Charge les forfaits eSIM gérés en back-office ; fallback sur les données locales
    fetch(`${BACKEND_URL}/api/offres?type=SIM_ESIM`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list = data.data || data || [];
        if (Array.isArray(list) && list.length > 0) {
          setForfaits(list.map(mapOffre));
        }
      })
      .catch(() => { /* on garde ESIM_FORFAITS_DEMO */ });
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    sessionStorage.setItem("kiosk_esim_forfait", JSON.stringify(selected));
    sessionStorage.setItem("kiosk_flow", "esim"); // marque le flux pour les pages partagées
    router.push("/borne/nouvelle-sim/esim/compatibilite");
  };

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Titre */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: "clamp(20px, 2.5vw, 30px)", fontWeight: 900, color: "#1F0270", margin: "0 0 8px 0" }}>
          {lang === "en" ? "Choose your eSIM plan" : "Choisissez votre forfait eSIM"}
        </h2>
        <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>
          {lang === "en" ? "Select a plan adapted to your needs" : "Sélectionnez le forfait adapté à vos besoins"}
        </p>
      </div>

      {/* Forfaits */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        {forfaits.map((forfait) => (
          <div
            key={forfait.id}
            onClick={() => setSelected(forfait)}
            style={{
              flex: 1,
              minWidth: "240px",
              background: "white",
              borderRadius: 20,
              border: selected?.id === forfait.id
                ? "2.5px solid #1F0270"
                : forfait.populaire ? "2px solid #FFBA08" : "2px solid #E5E7EB",
              padding: "clamp(20px, 2vw, 28px)",
              cursor: "pointer",
              position: "relative",
              transform: selected?.id === forfait.id ? "scale(1.02)" : "scale(1)",
              transition: "all 0.2s",
              boxShadow: selected?.id === forfait.id
                ? "0 8px 30px rgba(31,2,112,0.15)"
                : forfait.populaire ? "0 4px 20px rgba(255,186,8,0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {/* Badge populaire */}
            {forfait.populaire && (
              <div style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#FFBA08",
                color: "#1F0270",
                borderRadius: 20,
                padding: "4px 14px",
                fontSize: 11,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}>
                <Star size={11} fill="currentColor" />
                {lang === "en" ? "Most popular" : "Le plus populaire"}
              </div>
            )}

            {/* Badge sélectionné */}
            {selected?.id === forfait.id && (
              <div style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#1F0270",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Check size={14} color="white" strokeWidth={3} />
              </div>
            )}

            {/* Icône */}
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: forfait.couleur === "#FFBA08" ? "#1F0270" : `${forfait.couleur}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}>
              <Wifi size={24} color={forfait.couleur === "#FFBA08" ? "#FFBA08" : forfait.couleur} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1F0270", margin: "0 0 4px 0" }}>{forfait.nom}</h3>
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 16px 0" }}>{forfait.description}</p>

            {/* Prix */}
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#1F0270" }}>
                {forfait.prixGNF.toLocaleString("fr-FR")}
              </span>
              <span style={{ fontSize: 14, color: "#9CA3AF", marginLeft: 4 }}>GNF</span>
              <span style={{ display: "block", fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>/ {forfait.duree}</span>
            </div>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: lang === "en" ? "Data" : "Données", value: forfait.data },
                { label: lang === "en" ? "Calls" : "Appels", value: forfait.appels },
                { label: "SMS", value: forfait.sms },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#6B7280" }}>{f.label}</span>
                  <span style={{ fontWeight: 700, color: "#1F0270" }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "white", border: "1.5px solid #E5E7EB",
            borderRadius: 12, padding: "12px 24px",
            color: "#6B7280", fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} />
          {lang === "en" ? "Back" : "Retour"}
        </button>
        <button
          onClick={handleContinue}
          disabled={!selected}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: selected ? "#1F0270" : "#E5E7EB",
            border: "none", borderRadius: 12, padding: "12px 32px",
            color: selected ? "white" : "#9CA3AF",
            fontSize: 15, fontWeight: 700,
            cursor: selected ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: selected ? "0 4px 14px rgba(31,2,112,0.3)" : "none",
          }}
        >
          {lang === "en" ? "Continue" : "Continuer"}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
