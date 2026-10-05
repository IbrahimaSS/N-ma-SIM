import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/auth'
import { compterSimValideesParPiece, MAX_SIM_PAR_PIECE } from '@/lib/sim-limit'

/**
 * @swagger
 * /api/clients/count-sim:
 *   get:
 *     summary: Count validated NOUVELLE_SIM requests for an ID document number
 *     description: Public endpoint used by the kiosk to enforce the max-5-SIMs-per-identity rule right after scanning the ID document (no auth — same trust level as the kiosk submission endpoints).
 *     tags: [Clients]
 *     parameters:
 *       - in: query
 *         name: numeroPiece
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Count returned
 *       400:
 *         description: Missing numeroPiece
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numeroPiece = searchParams.get('numeroPiece')

    if (!numeroPiece) return apiError('Le numéro de pièce est requis', 400)

    const count = await compterSimValideesParPiece(numeroPiece)

    // Alerte admin : la pièce a atteint la limite. On n'empêche pas la réponse (la borne
    // bloque déjà l'utilisateur côté UI) — on se contente de prévenir l'admin via les logs,
    // sans créer de client pour cette tentative refusée.
    if (count >= MAX_SIM_PAR_PIECE) {
      await prisma.log.create({
        data: {
          type: 'Rejet — Limite SIM atteinte',
          description: `Tentative d'achat bloquée : la pièce ${numeroPiece} a déjà ${count} SIM validées (limite : ${MAX_SIM_PAR_PIECE}).`,
          entiteType: 'Client',
        },
      }).catch((e) => console.error('[CLIENTS COUNT-SIM] Log alerte échoué', e))
    }

    return apiSuccess({ numeroPiece, count })

  } catch (error) {
    console.error('[CLIENTS COUNT-SIM]', error)
    return apiError('Erreur interne', 500)
  }
}
