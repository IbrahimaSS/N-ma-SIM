"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Phone, ChevronRight, ArrowLeft, User as UserIcon, Info } from "lucide-react";

export default function Identification() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
  }, []);

  const t = {
    title: lang === "en" ? "SIM Reactivation" : "Réactivation des puces",
    subtitle: lang === "en" ? "Follow the steps to reactivate your SIM card." : "Suivez les étapes pour réactiver votre puce SIM.",
    personalInfo: lang === "en" ? "Personal information" : "Informations personnelles",
    personalSub: lang === "en" ? "Please fill in your information to start the reactivation." : "Veuillez renseigner vos informations pour commencer la réactivation.",
    numberLabel: lang === "en" ? "Number to reactivate" : "Numéro à réactiver",
    numberPlaceholder: "Ex. : 621 00 22 90",
    reasonLabel: lang === "en" ? "Reason for reactivation" : "Motif de réactivation",
    selectReason: lang === "en" ? "Select reason" : "Sélectionnez le motif",
    lost: lang === "en" ? "Lost SIM card" : "Perte de la carte SIM",
    inactive: lang === "en" ? "Long period of inactivity" : "Longue période d'inactivité",
    disabled: lang === "en" ? "Disabled SIM" : "Puce désactivée",
    frequentTitle: lang === "en" ? "Frequently called numbers" : "Numéros appelés fréquemment",
    frequentSub: lang === "en" ? "For security reasons, provide two numbers you call often." : "Pour des raisons de sécurité, indiquez deux numéros que vous appelez souvent.",
    freq1: lang === "en" ? "Frequently called number 1" : "Numéro appelé fréquemment 1",
    freq2: lang === "en" ? "Frequently called number 2" : "Numéro appelé fréquemment 2",

    back: lang === "en" ? "Back" : "Retour",
    continue: lang === "en" ? "Continue" : "Continuer",
    agentTitle: lang === "en" ? "Possible validation by an agent" : "Validation possible par un agent",
    agentSub: lang === "en" ? "Your request may be validated by an agent for additional verification." : "Votre demande pourra être validée par un agent en cas de vérification complémentaire.",
    additionalTitle: lang === "en" ? "In case of additional verification" : "En cas de vérification complémentaire",
    additionalSub: lang === "en" ? "Please wait while your file is being analysed." : "Veuillez patienter le temps de l'analyse de votre dossier.",
  };

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-3xl text-primary font-bold">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>

      <CardContent className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <div>
          <h3 className="font-bold text-primary mb-1">{t.personalInfo}</h3>
          <p className="text-sm text-text-muted mb-4">{t.personalSub}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label={t.numberLabel} required placeholder={t.numberPlaceholder} />
            <Select label={t.reasonLabel} required defaultValue="">
              <option value="" disabled>{t.selectReason}</option>
              <option value="perte">{t.lost}</option>
              <option value="inactivite">{t.inactive}</option>
              <option value="desactivee">{t.disabled}</option>
            </Select>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent rounded-full text-primary"><Phone className="w-5 h-5" /></div>
              <div>
                <h4 className="font-bold text-primary">{t.frequentTitle}</h4>
                <p className="text-xs text-text-muted">{t.frequentSub}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t.freq1} required placeholder="Ex. : 623 76 54 32" className="bg-white" />
              <Input label={t.freq2} required placeholder="Ex. : 620 11 22 33" className="bg-white" />
            </div>
          </div>



          <div className="flex justify-between items-center pt-4 border-t border-border-light">
            <Button variant="secondary" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
            </Button>
            <Button onClick={() => router.push("/borne/reactivation/piece-identite")} className="px-8">
              {t.continue} <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-gray-50 border border-border-light rounded-2xl p-6 flex gap-4">
            <div className="bg-accent/10 p-3 rounded-full h-fit flex-shrink-0"><UserIcon className="w-6 h-6 text-accent" /></div>
            <div>
              <h4 className="font-bold text-primary mb-2">{t.agentTitle}</h4>
              <p className="text-sm text-text-muted">{t.agentSub}</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm h-fit flex-shrink-0 text-primary"><Info className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-primary mb-2">{t.additionalTitle}</h4>
              <p className="text-sm text-text-muted">{t.additionalSub}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
