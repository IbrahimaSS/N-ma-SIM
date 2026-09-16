import { prisma } from '@/lib/prisma'

export const MAX_SIM_PAR_PIECE = 5

/**
 * Nombre de demandes Nouvelle SIM (physique + eSIM) validées liées à un numéro de pièce
 * d'identité donné — agrège via la relation client, donc reste fiable même si d'anciens
 * doublons de Client existent déjà en base pour le même numéro.
 */
export async function compterSimValideesParPiece(numeroPiece: string): Promise<number> {
  return prisma.demandeSIM.count({
    where: {
      type: 'NOUVELLE_SIM',
      statut: 'VALIDEE',
      client: { numeroPiece },
    },
  })
}
