import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { genererCode, calculerExpiration, calculerMontant, expirerReservations } from '@/lib/reservations'
import { envoyerRecuReservation } from '@/lib/recu-reservation'
import { z } from 'zod'

const ROLES_AUTORISES = ['ADMIN', 'PARTENAIRE']

const createSchema = z.object({
  nom: z.string().trim().min(2),
  prenom: z.string().trim().min(1),
  nationalite: z.string().trim().optional(),
  numeroPasseport: z.string().trim().min(5, 'Numéro de passeport invalide'),
  email: z.string().trim().email().optional().or(z.literal('')),
  telephone: z.string().trim().optional(),
  formatSim: z.enum(['PHYSIQUE', 'ESIM']),
  offreId: z.string().optional().nullable(),
  montantRecharge: z.number().int().min(0).optional().nullable(),
  dateArrivee: z.string().refine((v) => !isNaN(Date.parse(v)), 'Date d\'arrivée invalide'),
  // Admin uniquement : établissement pour lequel il crée la réservation
  partenaireNom: z.string().trim().min(2).optional(),
})

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Liste des réservations SIM (admin = toutes, partenaire = les siennes)
 *     tags: [Reservations]
 *   post:
 *     summary: Créer une réservation SIM (admin ou partenaire)
 *     tags: [Reservations]
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request, { autoriserPartenaire: true })
    if (!authUser) return apiError('Non authentifié', 401)
    if (!ROLES_AUTORISES.includes(authUser.role)) return apiError('Accès refusé', 403)

    await expirerReservations()
    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut') || ''

    const reservations = await prisma.reservationSIM.findMany({
      where: {
        ...(authUser.role === 'PARTENAIRE' ? { creeParId: authUser.id } : {}),
        ...(statut ? { statut: statut as any } : {}),
      },
      include: { offre: { select: { nom: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(reservations)
  } catch (error) {
    console.error('[RESERVATIONS GET]', error)
    return apiError('Erreur interne', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request, { autoriserPartenaire: true })
    if (!authUser) return apiError('Non authentifié', 401)
    if (!ROLES_AUTORISES.includes(authUser.role)) return apiError('Accès refusé', 403)

    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) return apiError('Données invalides', 400, parsed.error.flatten())
    const d = parsed.data

    // Établissement : celui du compte partenaire, ou celui saisi par l'admin
    const createur = await prisma.utilisateur.findUnique({ where: { id: authUser.id }, select: { partenaireNom: true, statut: true } })
    if (!createur || createur.statut !== 'ACTIF') return apiError('Compte inactif', 403)
    const partenaireNom = authUser.role === 'PARTENAIRE' ? createur.partenaireNom : (d.partenaireNom || 'N\'ma SIM')
    if (!partenaireNom) return apiError('Établissement partenaire non renseigné sur ce compte', 400)

    const dateArrivee = new Date(d.dateArrivee)
    const expireLe = calculerExpiration(dateArrivee)
    if (expireLe < new Date()) return apiError('La date d\'arrivée est trop ancienne', 400)

    let montantInfo
    try {
      montantInfo = await calculerMontant({ formatSim: d.formatSim, offreId: d.offreId, montantRecharge: d.montantRecharge })
    } catch (e) {
      return apiError(e instanceof Error ? e.message : 'Offre invalide', 400)
    }

    // Code unique (nouvel essai en cas de collision, très improbable)
    let reservation = null
    for (let essai = 0; essai < 5 && !reservation; essai++) {
      try {
        reservation = await prisma.reservationSIM.create({
          data: {
            code: genererCode(),
            nom: d.nom.toUpperCase(),
            prenom: d.prenom,
            nationalite: d.nationalite || null,
            numeroPasseport: d.numeroPasseport.toUpperCase().replace(/\s/g, ''),
            email: d.email || null,
            telephone: d.telephone || null,
            formatSim: d.formatSim,
            offreId: montantInfo.offre?.id ?? null,
            montantRecharge: d.formatSim === 'PHYSIQUE' && d.montantRecharge ? d.montantRecharge : null,
            montant: montantInfo.montant,
            dateArrivee,
            expireLe,
            partenaireNom,
            creeParId: authUser.id,
          },
          include: { offre: { select: { nom: true, type: true } } },
        })
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e // P2002 = code déjà existant → on régénère
      }
    }
    if (!reservation) return apiError('Impossible de générer un code unique, réessayez', 500)

    await prisma.log.create({
      data: {
        type: 'Réservation SIM',
        description: `Réservation ${reservation.code} créée pour ${reservation.prenom} ${reservation.nom} (${partenaireNom}) par ${authUser.email}`,
        entiteId: reservation.id,
        entiteType: 'ReservationSIM',
        utilisateurId: authUser.id,
      },
    })

    // Reçu envoyé au voyageur s'il a donné son e-mail (la réservation reste créée si l'envoi échoue)
    const envoiRecu = reservation.email ? await envoyerRecuReservation(reservation) : null
    return apiSuccess({ ...reservation, envoiRecu }, 'Réservation créée', 201)
  } catch (error) {
    console.error('[RESERVATIONS POST]', error)
    return apiError('Erreur interne', 500)
  }
}
