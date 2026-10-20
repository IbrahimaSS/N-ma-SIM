import { apiSuccess, apiError } from '@/lib/auth'
import { lireTarifs } from '@/lib/tarifs'

/**
 * @swagger
 * /api/parametres/tarifs:
 *   get:
 *     summary: Tarifs de la borne (nouvelle SIM, réactivation)
 *     description: Endpoint public en lecture seule (affichage borne). La modification se fait
 *       uniquement par un administrateur via POST /api/parametres.
 *     tags: [Parametres]
 *     responses:
 *       200:
 *         description: "{ tarif_nouvelle_sim: number, tarif_reactivation: number } (GNF)"
 */
export async function GET() {
  try {
    return apiSuccess(await lireTarifs())
  } catch (error) {
    console.error('[PARAMETRES TARIFS GET]', error)
    return apiError('Erreur interne', 500)
  }
}
