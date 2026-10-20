import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'
import { lireTarifs } from '@/lib/tarifs'

/** Durée de validité d'un code après la date d'arrivée prévue. */
export const VALIDITE_JOURS = 30

// Sans caractères ambigus (0/O, 1/I/L) : le code se lit et se tape sans erreur
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Code au format NMA-XXXX-XXXX (8 caractères aléatoires ≈ 8,5 × 10^11 combinaisons). */
export function genererCode(): string {
  const bloc = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `NMA-${bloc()}-${bloc()}`
}

/** Normalise une saisie (« nma 7k4p92qx », « NMA-7K4P-92QX ») vers le format officiel, ou null. */
export function normaliserCode(saisie: unknown): string | null {
  const brut = String(saisie ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^NMA/, '')
  if (brut.length !== 8) return null
  return `NMA-${brut.slice(0, 4)}-${brut.slice(4)}`
}

/** Comparaison de numéros de passeport insensible aux espaces, tirets et à la casse. */
export function passeportCorrespond(attendu: string, lu: unknown): boolean {
  const n = (v: unknown) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return n(attendu).length > 0 && n(attendu) === n(lu)
}

export function calculerExpiration(dateArrivee: Date): Date {
  const d = new Date(dateArrivee)
  d.setDate(d.getDate() + VALIDITE_JOURS)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Montant prépayé d'une réservation (GNF) :
 *  - SIM physique : tarif nouvelle SIM (réglé par l'admin) + offre éventuelle + recharge éventuelle
 *  - eSIM : prix du forfait eSIM choisi
 */
export async function calculerMontant(params: {
  formatSim: 'PHYSIQUE' | 'ESIM'
  offreId?: string | null
  montantRecharge?: number | null
}): Promise<{ montant: number; offre: { id: string; nom: string; prix: number; type: string } | null }> {
  const offre = params.offreId
    ? await prisma.offre.findUnique({ where: { id: params.offreId }, select: { id: true, nom: true, prix: true, type: true, estActif: true } })
    : null
  if (params.offreId && (!offre || !offre.estActif)) throw new Error('Offre introuvable ou inactive')

  if (params.formatSim === 'ESIM') {
    if (!offre || offre.type !== 'SIM_ESIM') throw new Error('Un forfait eSIM est requis pour une réservation eSIM')
    return { montant: offre.prix, offre }
  }

  if (offre && offre.type === 'SIM_ESIM') throw new Error('Un forfait eSIM ne peut pas être ajouté à une SIM physique')
  const tarifs = await lireTarifs()
  const recharge = params.montantRecharge && params.montantRecharge > 0 ? params.montantRecharge : 0
  // Une offre RECHARGE n'a pas de prix fixe : c'est le montant de recharge qui compte
  const prixOffre = offre && offre.type !== 'RECHARGE' ? offre.prix : 0
  return { montant: tarifs.tarif_nouvelle_sim + prixOffre + recharge, offre }
}

/** Passe en EXPIREE les réservations actives dont la date est dépassée. */
export async function expirerReservations(): Promise<void> {
  await prisma.reservationSIM.updateMany({
    where: { statut: 'ACTIVE', expireLe: { lt: new Date() } },
    data: { statut: 'EXPIREE' },
  })
}

/** Raison lisible d'un code inutilisable (affichée à la borne). */
export function raisonIndisponible(statut: string): string {
  switch (statut) {
    case 'UTILISEE': return 'Ce code a déjà été utilisé.'
    case 'EXPIREE': return 'Ce code a expiré.'
    case 'ANNULEE': return 'Cette réservation a été annulée.'
    default: return 'Ce code n\'est pas valide.'
  }
}
