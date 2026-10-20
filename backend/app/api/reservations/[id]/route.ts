import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { envoyerRecuReservation } from '@/lib/recu-reservation'

/**
 * @swagger
 * /api/reservations/{id}:
 *   patch:
 *     summary: Annuler une réservation active, ou renvoyer son reçu par e-mail (admin, ou partenaire propriétaire)
 *     description: |
 *       { action: "annuler" } → passe la réservation en ANNULEE.
 *       { action: "envoyer-recu", email? } → (re)envoie le reçu ; un e-mail fourni remplace celui enregistré.
 *     tags: [Reservations]
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request, { autoriserPartenaire: true })
    if (!authUser) return apiError('Non authentifié', 401)
    if (!['ADMIN', 'PARTENAIRE'].includes(authUser.role)) return apiError('Accès refusé', 403)

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    if (!['annuler', 'envoyer-recu'].includes(body?.action)) return apiError('Action non supportée', 400)

    const reservation = await prisma.reservationSIM.findUnique({ where: { id }, include: { offre: { select: { nom: true } } } })
    if (!reservation) return apiError('Réservation introuvable', 404)
    if (authUser.role === 'PARTENAIRE' && reservation.creeParId !== authUser.id) return apiError('Accès refusé', 403)
    if (reservation.statut !== 'ACTIVE') {
      return apiError(body.action === 'annuler' ? 'Seule une réservation active peut être annulée' : 'Le reçu ne peut être envoyé que pour une réservation active', 409)
    }

    if (body.action === 'envoyer-recu') {
      let email = reservation.email
      if (body.email !== undefined) {
        email = String(body.email).trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError('Adresse e-mail invalide', 400)
        if (email !== reservation.email) await prisma.reservationSIM.update({ where: { id }, data: { email } })
      }
      if (!email) return apiError('Aucune adresse e-mail pour ce voyageur', 400)

      const envoi = await envoyerRecuReservation({ ...reservation, email })
      if (!envoi.envoye) return apiError(envoi.raison || 'Envoi impossible', 502)
      await prisma.log.create({
        data: {
          type: 'Réservation SIM',
          description: `Reçu de la réservation ${reservation.code} envoyé à ${email} par ${authUser.email}`,
          entiteId: id,
          entiteType: 'ReservationSIM',
          utilisateurId: authUser.id,
        },
      })
      return apiSuccess({ email, recuEnvoyeLe: new Date() }, `Reçu envoyé à ${email}`)
    }

    const maj = await prisma.reservationSIM.update({ where: { id }, data: { statut: 'ANNULEE' } })
    await prisma.log.create({
      data: {
        type: 'Réservation SIM',
        description: `Réservation ${maj.code} annulée par ${authUser.email}`,
        entiteId: id,
        entiteType: 'ReservationSIM',
        utilisateurId: authUser.id,
      },
    })
    return apiSuccess(maj, 'Réservation annulée')
  } catch (error) {
    console.error('[RESERVATION PATCH]', error)
    return apiError('Erreur interne', 500)
  }
}
