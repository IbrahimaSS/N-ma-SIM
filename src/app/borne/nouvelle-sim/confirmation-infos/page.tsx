"use client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Info, ChevronRight, ArrowLeft, FileText, User as UserIcon, Clock } from "lucide-react";

export default function ConfirmationInfos() {
  const router = useRouter();

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex flex-col md:flex-row md:items-start justify-between pb-6 gap-4">
        <div>
          <CardTitle className="text-2xl">Étape 2/6 — Confirmation des informations</CardTitle>
          <p className="text-text-muted mt-2 max-w-xl">
            Les informations ci-dessous ont été pré-remplies automatiquement à partir de votre pièce d'identité. Vérifiez et corrigez si nécessaire.
          </p>
        </div>
        
        {/* Encart récapitulatif comme sur la maquette */}
        <div className="bg-gray-50 border border-border-light rounded-xl p-4 min-w-[250px]">
          <div className="flex items-center gap-3 text-sm text-text-main mb-2">
            <FileText className="w-4 h-4 text-primary" /> <span className="text-text-muted w-16">Service :</span> <span className="font-bold">Nouvelle SIM</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-main mb-2">
            <UserIcon className="w-4 h-4 text-primary" /> <span className="text-text-muted w-16">Profil :</span> <span className="font-bold">Résident</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-main">
            <Clock className="w-4 h-4 text-primary" /> <span className="text-text-muted w-16">Statut :</span> <span className="font-bold text-warning">En cours</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Formulaire pré-rempli */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
          <Input label="Nom" required defaultValue="MANDJOU" />
          <Input label="Prénom" required defaultValue="MARADOU" />
          <Input label="Date de naissance" required defaultValue="15/05/1995" type="date" />
          <Input label="Adresse / Quartier" required defaultValue="Bonamoussadi, Douala" />
          
          <Select label="Type de profil" required defaultValue="resident">
            <option value="resident">Résident</option>
            <option value="etranger">Étranger</option>
          </Select>
          
          <Select label="Type de pièce" required defaultValue="cni">
            <option value="cni">Carte Nationale d'Identité</option>
            <option value="passeport">Passeport</option>
          </Select>

          <Input label="Numéro de pièce" required defaultValue="R67234567" />
        </div>

        <div className="flex items-center gap-3 text-sm text-text-muted mb-8">
          <Info className="w-5 h-5 text-primary" />
          Vous pouvez modifier les champs en cas d'erreur d'extraction.
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </Button>
          <Button onClick={() => router.push("/borne/nouvelle-sim/selfie")}>
            Confirmer et continuer <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
