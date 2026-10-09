"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * Lance automatiquement une action après un délai (5 s par défaut), une seule fois par « clé »
 * (ex. le couple d'images recto/verso). Renvoie les secondes restantes (null si inactif) et
 * `annuler` : le client garde la main et lancera lui-même (bouton).
 *
 * - `pret`     : toutes les conditions sont réunies pour lancer ;
 * - `enCours`  : l'action tourne déjà (lancée seule ou par un clic) — la clé est alors
 *                marquée comme traitée, pour ne pas relancer seul après une erreur sur les
 *                mêmes images. Une nouvelle image (nouvelle clé) réarme le lancement.
 * Le décompte repart de zéro à chaque fois que `pret` redevient vrai.
 */
export function useLancementAuto(cle: string | null, pret: boolean, enCours: boolean, lancer: () => void, delaiMs = 5000) {
  const dejaLance = useRef<string | null>(null);
  const lancerRef = useRef(lancer);
  const [restant, setRestant] = useState<number | null>(null);
  const [annuleePour, setAnnuleePour] = useState<string | null>(null);

  useEffect(() => {
    lancerRef.current = lancer;
  });

  useEffect(() => {
    if (enCours && cle) dejaLance.current = cle;
    if (enCours || !pret || !cle || dejaLance.current === cle || annuleePour === cle) {
      setRestant(null);
      return;
    }
    const debut = Date.now();
    setRestant(Math.ceil(delaiMs / 1000));
    const tick = setInterval(() => {
      setRestant(Math.max(1, Math.ceil((delaiMs - (Date.now() - debut)) / 1000)));
    }, 200);
    const timer = setTimeout(() => {
      dejaLance.current = cle;
      setRestant(null);
      lancerRef.current();
    }, delaiMs);
    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [cle, pret, enCours, annuleePour, delaiMs]);

  const annuler = useCallback(() => setAnnuleePour(cle), [cle]);
  return { restant, annuler };
}

/**
 * Suit l'ouverture de la fenêtre de choix de fichier : tant qu'elle est ouverte, `ouverte`
 * vaut true (le lancement automatique doit attendre). Fermée par un choix (appeler `fermer`
 * dans onChange), par « Annuler » (événement cancel) ou au retour du focus sur la page.
 */
export function useSelectionFichier() {
  const [ouverte, setOuverte] = useState(false);
  const fermer = useCallback(() => setOuverte(false), []);

  useEffect(() => {
    if (!ouverte) return;
    // Repli si l'événement « cancel » n'est pas émis : la page reprend le focus à la fermeture
    // de la fenêtre ; on laisse à onChange le temps d'arriver avant de libérer.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const auRetour = () => { timer = setTimeout(() => setOuverte(false), 1000); };
    window.addEventListener("focus", auRetour);
    return () => {
      window.removeEventListener("focus", auRetour);
      if (timer) clearTimeout(timer);
    };
  }, [ouverte]);

  const ouvrir = useCallback((ref: RefObject<HTMLInputElement | null>) => {
    const input = ref.current;
    if (!input) return;
    setOuverte(true);
    input.addEventListener("cancel", () => setOuverte(false), { once: true });
    input.click();
  }, []);

  return { ouverte, ouvrir, fermer };
}
