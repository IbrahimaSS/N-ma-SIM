"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { KIOSK_STEP_REQUIREMENTS } from "@/lib/kiosk-guard";

/**
 * Empêche d'accéder directement (URL copiée, historique, retour arrière) à une étape
 * avancée du parcours sans être passé par les étapes précédentes : si la clé
 * sessionStorage attendue est absente, renvoie vers l'étape de départ du sous-parcours.
 * Ne bloque jamais l'affichage : pour un utilisateur normal (clé déjà présente), cette
 * vérification est un no-op silencieux et ne change rien au rendu existant.
 */
export function KioskStepGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const rule = KIOSK_STEP_REQUIREMENTS[pathname];
    if (rule && !sessionStorage.getItem(rule.key)) {
      router.replace(rule.fallback);
    }
  }, [pathname, router]);

  return null;
}
