"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resetKioskSession } from "@/lib/kiosk-guard";

const INACTIVITY_MS = 60_000;
const HOME_PATH = "/borne/accueil";
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/**
 * Gardien de session du parcours borne, monté une fois dans le layout.
 * - Quitter l'onglet / mettre l'app en arrière-plan (Page Visibility API) réinitialise
 *   immédiatement le parcours en cours, pour éviter qu'un tiers le reprenne.
 * - Une inactivité (aucun clic/touche/scroll) de 60s fait de même.
 * Volontairement basé sur `visibilitychange` et non `blur` : `blur` se déclenche aussi à
 * l'ouverture du sélecteur de fichier natif ("Importer une photo"), ce qui casserait cette
 * fonctionnalité existante alors que la page reste, elle, bien visible.
 */
export function KioskSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const goHome = () => {
      if (pathRef.current === HOME_PATH) return;
      resetKioskSession().finally(() => router.replace(HOME_PATH));
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(goHome, INACTIVITY_MS);
    };

    const handleVisibility = () => {
      if (document.hidden) goHome();
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);

  return null;
}
