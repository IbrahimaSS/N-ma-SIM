"use client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Phone, ChevronRight, ArrowLeft, User as UserIcon, Info } from "lucide-react";

export default function Identification() {
  const router = useRouter();

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-3xl text-primary font-bold">Réactivation des puces</CardTitle>
        <p className="text-text-muted mt-2">Suivez les étapes pour réactiver votre puce SIM.</p>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Colonne Gauche : Formulaire */}
        <div>
           <h3 className="font-bold text-primary mb-1">Informations personnelles</h3>
           <p className="text-sm text-text-muted mb-4">Veuillez renseigner vos informations pour commencer la réactivation.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input label="Numéro à réactiver" required placeholder="Ex. : 06 12 34 56 78" />
              <Select label="Motif de réactivation" required defaultValue="">
                <option value="" disabled>Sélectionnez le motif</option>
                <option value="perte">Perte de la carte SIM</option>
                <option value="inactivite">Longue période d'inactivité</option>
                <option value="desactivee">Puce désactivée</option>
              </Select>
           </div>

           {/* Zone des numéros fréquents - CRUCIAL */}
           <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-accent rounded-full text-primary">
                    <Phone className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="font-bold text-primary">Numéros appelés fréquemment</h4>
                    <p className="text-xs text-text-muted">Pour des raisons de sécurité, indiquez deux numéros que vous appelez souvent.</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Numéro appelé fréquemment 1" required placeholder="Ex. : 06 98 76 54 32" className="bg-white" />
                 <Input label="Numéro appelé fréquemment 2" required placeholder="Ex. : 07 62 11 22 33" className="bg-white" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Select label="Type de pièce" required defaultValue="">
                <option value="" disabled>Sélectionnez le type de pièce</option>
                <option value="cni">Carte d'identité</option>
                <option value="passeport">Passeport</option>
              </Select>
              <Input label="Numéro de pièce" required placeholder="Entrez le numéro de votre pièce" />
           </div>

           <div className="flex justify-between items-center pt-4 border-t border-border-light">
              <Button variant="secondary" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Retour
              </Button>
              <Button onClick={() => router.push("/borne/reactivation/piece-identite")} className="px-8">
                Continuer <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
           </div>
        </div>

        {/* Colonne Droite : Alertes d'aide */}
        <div className="flex flex-col gap-6">
           <div className="bg-gray-50 border border-border-light rounded-2xl p-6 flex gap-4">
              <div className="bg-accent/10 p-3 rounded-full h-fit flex-shrink-0">
                 <UserIcon className="w-6 h-6 text-accent" />
              </div>
              <div>
                 <h4 className="font-bold text-primary mb-2">Validation possible par un agent</h4>
                 <p className="text-sm text-text-muted">Votre demande pourra être validée par un agent en cas de vérification complémentaire.</p>
              </div>
           </div>
           
           <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm h-fit flex-shrink-0 text-primary">
                 <Info className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="font-bold text-primary mb-2">En cas de vérification complémentaire</h4>
                 <p className="text-sm text-text-muted">Veuillez patienter le temps de l'analyse de votre dossier.</p>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
