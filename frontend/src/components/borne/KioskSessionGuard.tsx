"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resetKioskSession } from "@/lib/kiosk-guard";

const INACTIVITY_MS = 90_000;        // aucune interaction (tactile OU vocale) -> retour accueil
const HIDDEN_GRACE_MS = 12_000;      // onglet masqué : délai avant reset (tolère un aller-retour bref)
const HOME_PATH = "/borne/accueil";
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/**
 * Gardien de session du parcours borne, monté une fois dans le layout.
 * - Onglet masqué / app en arrière-plan (Page Visibility API) : réinitialise le parcours
 *   APRÈS un court délai de grâce, pour éviter qu'un tiers reprenne une session abandonnée
 *   tout en tolérant un basculement bref (notification, coup d'œil console...).
 * - Inactivité de 90s (aucun clic/touche/scroll ET aucune interaction vocale) : idem.
 * L'interaction vocale (Agent IA en soussou) émet un évènement `kiosk-activity` qui compte
 * comme une activité — sinon un utilisateur qui n'utilise que la voix serait renvoyé à
 * l'accueil en pleine opération.
 * Volontairement basé sur `visibilitychange` et non `blur` : `blur` se déclenche aussi à
 * l'ouverture du sélecteur de fichier natif ("Importer une photo").
 */
export function KioskSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (document.hidden) {
        if (hiddenTimerRef.current) clearTimeout(hiddenTimerRef.current);
        hiddenTimerRef.current = setTimeout(goHome, HIDDEN_GRACE_MS);
      } else if (hiddenTimerRef.current) {
        clearTimeout(hiddenTimerRef.current);
        hiddenTimerRef.current = null;
        resetTimer();
      }
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    window.addEventListener("kiosk-activity", resetTimer);
    document.addEventListener("visibilitychange", handleVisibility);
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.removeEventListener("kiosk-activity", resetTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hiddenTimerRef.current) clearTimeout(hiddenTimerRef.current);
    };
  }, [router]);

  return null;
}
