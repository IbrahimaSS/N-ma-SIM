"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ChevronRight, Phone } from "lucide-react";

export default function RechargeNumero() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [numero, setNumero] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
  }, []);

  // Écoute les commandes de remplissage de l'Agent IA
  useEffect(() => {
    const handleAiFill = (e: Event) => {
      const { target, value } = (e as CustomEvent).detail;
      if (target === "input-recharge-numero") {
        setNumero(value);
        setError("");
      }
    };
    document.addEventListener("ai-fill", handleAiFill);
    return () => document.removeEventListener("ai-fill", handleAiFill);
  }, []);

  const t = {
    title: lang === "en" ? "Step 1/3 — Phone number" : "Étape 1/3 — Numéro de téléphone",
    subtitle: lang === "en" ? "Enter the number you want to top up." : "Saisissez le numéro que vous souhaitez recharger.",
    label: lang === "en" ? "Phone number" : "Numéro de téléphone",
    placeholder: lang === "en" ? "Ex: 622 000 000" : "Ex : 622 000 000",
    back: lang === "en" ? "Back" : "Retour",
    next: lang === "en" ? "Continue" : "Continuer",
    error: lang === "en" ? "Please enter a valid Guinean number (9 digits)." : "Veuillez entrer un numéro guinéen valide (9 chiffres).",
  };

  const handleNext = () => {
    const clean = numero.replace(/\s/g, "");
    if (!/^\d{9}$/.test(clean)) {
      setError(t.error);
      return;
    }
    sessionStorage.setItem("recharge_numero", clean);
    router.push("/borne/recharge/montant");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-4">
      <CardHeader>
        <CardTitle className="text-2xl">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Phone className="w-10 h-10 text-primary" />
          </div>
          <div className="w-full max-w-sm">
            <Input
              data-ai-action="input-recharge-numero"
              label={t.label}
              placeholder={t.placeholder}
              value={numero}
              onChange={(e) => { setNumero(e.target.value); setError(""); }}
              type="tel"
              className="text-center text-2xl tracking-widest"
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
        </div>
        <div className="flex justify-between pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button
            data-ai-action="btn-continuer-recharge"
            onClick={handleNext}
            disabled={!numero}
          >
            {t.next} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
