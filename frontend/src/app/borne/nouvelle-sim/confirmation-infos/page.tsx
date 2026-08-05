"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Info, ChevronRight, ArrowLeft, FileText, User as UserIcon, Clock } from "lucide-react";

export default function ConfirmationInfos() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [profile, setProfile] = useState("resident");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    setProfile(sessionStorage.getItem("kiosk_profile") || "resident");
  }, []);

  const t = {
    title: lang === "en" ? "Step 2/6 — Confirm your information" : "Étape 2/6 — Confirmation des informations",
    subtitle: lang === "en"
      ? "The information below was pre-filled from your ID document. Please verify and correct if necessary."
      : "Les informations ci-dessous ont été pré-remplies automatiquement à partir de votre pièce d'identité. Vérifiez et corrigez si nécessaire.",
    service: lang === "en" ? "Service:" : "Service :",
    serviceVal: lang === "en" ? "New SIM" : "Nouvelle SIM",
    profileLabel: lang === "en" ? "Profile:" : "Profil :",
    profileVal: profile === "etranger" ? (lang === "en" ? "Foreigner" : "Étranger") : (lang === "en" ? "Resident" : "Résident"),
    status: lang === "en" ? "Status:" : "Statut :",
    statusVal: lang === "en" ? "In progress" : "En cours",
    lastName: lang === "en" ? "Last name" : "Nom",
    firstName: lang === "en" ? "First name" : "Prénom",
    dob: lang === "en" ? "Date of birth" : "Date de naissance",
    address: lang === "en" ? "Address / District" : "Adresse / Quartier",
    profileType: lang === "en" ? "Profile type" : "Type de profil",
    resident: lang === "en" ? "Resident" : "Résident",
    foreigner: lang === "en" ? "Foreigner" : "Étranger",
    idType: lang === "en" ? "Document type" : "Type de pièce",
    cni: lang === "en" ? "National ID Card" : "Carte Nationale d'Identité",
    passport: lang === "en" ? "Passport" : "Passeport",
    idNumber: lang === "en" ? "Document number" : "Numéro de pièce",
    infoNote: lang === "en" ? "You can edit fields in case of extraction error." : "Vous pouvez modifier les champs en cas d'erreur d'extraction.",
    back: lang === "en" ? "Back" : "Retour",
    confirm: lang === "en" ? "Confirm and continue" : "Confirmer et continuer",
  };

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex flex-col md:flex-row md:items-start justify-between pb-4 gap-4">
        <div>
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <p className="text-text-muted mt-2 max-w-xl">{t.subtitle}</p>
        </div>
        <div className="bg-gray-50 border border-border-light rounded-xl p-4 min-w-[250px]">
          <div className="flex items-center gap-3 text-sm text-text-main mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-text-muted w-20">{t.service}</span>
            <span className="font-bold">{t.serviceVal}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-main mb-2">
            <UserIcon className="w-4 h-4 text-primary" />
            <span className="text-text-muted w-20">{t.profileLabel}</span>
            <span className="font-bold">{t.profileVal}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-main">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-text-muted w-20">{t.status}</span>
            <span className="font-bold text-warning">{t.statusVal}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-5">
          <Input label={t.lastName} required defaultValue="MANDJOU" />
          <Input label={t.firstName} required defaultValue="MARADOU" />
          <Input label={t.dob} required defaultValue="15/05/1995" type="date" />
          <Input label={t.address} required defaultValue="Bonamoussadi, Douala" />
          <Select label={t.profileType} required defaultValue="resident">
            <option value="resident">{t.resident}</option>
            <option value="etranger">{t.foreigner}</option>
          </Select>
          <Select label={t.idType} required defaultValue="cni">
            <option value="cni">{t.cni}</option>
            <option value="passeport">{t.passport}</option>
          </Select>
          <Input label={t.idNumber} required defaultValue="R67234567" />
        </div>

        <div className="flex items-center gap-3 text-sm text-text-muted mb-4">
          <Info className="w-5 h-5 text-primary" />
          {t.infoNote}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button onClick={() => router.push("/borne/nouvelle-sim/selfie")}>
            {t.confirm} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
