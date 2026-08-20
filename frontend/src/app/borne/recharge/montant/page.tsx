"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ChevronRight, Banknote } from "lucide-react";

const MONTANTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function RechargeMontant() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
  }, []);

  // Écoute les commandes de sélection de montant de l'Agent IA
  useEffect(() => {
    const handleAiFill = (e: Event) => {
      const { target, value } = (e as CustomEvent).detail;
      if (target === "select-recharge-montant") {
        const montant = parseInt(value);
        if (!isNaN(montant) && montant >= 1000) {
          setSelected(montant);
          setCustom("");
        } else if (!isNaN(montant)) {
          // Montant libre
          setCustom(String(montant));
          setSelected(null);
        }
      }
    };
    document.addEventListener("ai-fill", handleAiFill);
    return () => document.removeEventListener("ai-fill", handleAiFill);
  }, []);

  const t = {
    title: lang === "en" ? "Step 2/3 — Amount" : "Étape 2/3 — Montant",
    subtitle: lang === "en" ? "Choose or enter the amount to top up." : "Choisissez ou saisissez le montant à recharger.",
    custom: lang === "en" ? "Other amount (GNF)" : "Autre montant (GNF)",
    back: lang === "en" ? "Back" : "Retour",
    next: lang === "en" ? "Continue to payment" : "Continuer vers le paiement",
  };

  const finalAmount = selected ?? (custom ? parseInt(custom.replace(/\s/g, "")) : null);

  const handleNext = () => {
    if (!finalAmount || finalAmount < 1000) return;
    sessionStorage.setItem("recharge_montant", String(finalAmount));
    router.push("/borne/recharge/paiement");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-4">
      <CardHeader>
        <CardTitle className="text-2xl">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Banknote className="w-8 h-8 text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            {MONTANTS.map((m) => (
              <button
                key={m}
                onClick={() => { setSelected(m); setCustom(""); }}
                style={{
                  padding: "14px 8px",
                  borderRadius: 12,
                  border: selected === m ? "2px solid #1F0270" : "1.5px solid #E5E7EB",
                  background: selected === m ? "#EEF2FF" : "white",
                  color: selected === m ? "#1F0270" : "#374151",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {m.toLocaleString("fr-FR")} GNF
              </button>
            ))}
          </div>
          <div className="w-full max-w-md">
            <label style={{ fontSize: 13, color: "#6B7280", display: "block", marginBottom: 6 }}>{t.custom}</label>
            <input
              type="number"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
              placeholder="Ex : 15000"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: custom ? "2px solid #1F0270" : "1.5px solid #E5E7EB",
                fontSize: 16, outline: "none", color: "#111827",
              }}
            />
          </div>
          {finalAmount && finalAmount >= 1000 && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 24px", textAlign: "center" }}>
              <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 2 }}>{lang === "en" ? "Selected amount" : "Montant sélectionné"}</p>
              <p style={{ color: "#1F0270", fontWeight: 800, fontSize: 24 }}>{finalAmount.toLocaleString("fr-FR")} GNF</p>
            </div>
          )}
        </div>
        <div className="flex justify-between pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button
            data-ai-action="btn-continuer-montant"
            onClick={handleNext}
            disabled={!finalAmount || finalAmount < 1000}
          >
            {t.next} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
