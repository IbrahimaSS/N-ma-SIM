import { prisma } from '@/lib/prisma'

/** Tarifs de la borne (GNF), réglés par l'administrateur (Paramètres → Paiements). */
export interface TarifsBorne {
  tarif_nouvelle_sim: number
  tarif_reactivation: number
}

// Valeurs utilisées tant que l'administrateur n'a rien enregistré
export const TARIFS_DEFAUT: TarifsBorne = { tarif_nouvelle_sim: 5000, tarif_reactivation: 3000 }

/** Lit les tarifs dans ParametreSysteme ; valeur absente ou invalide → valeur par défaut. */
export async function lireTarifs(): Promise<TarifsBorne> {
  const params: { cle: string; valeur: string }[] = await prisma.$queryRawUnsafe(
    `SELECT cle, valeur FROM "ParametreSysteme" WHERE cle IN ('tarif_nouvelle_sim', 'tarif_reactivation')`
  )
  const tarifs = { ...TARIFS_DEFAUT }
  for (const p of params) {
    const n = Number(p.valeur)
    if (Number.isFinite(n) && n > 0) tarifs[p.cle as keyof TarifsBorne] = Math.round(n)
  }
  return tarifs
}
