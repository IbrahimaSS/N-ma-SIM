import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  nom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional(),
  motDePasse: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'AGENT', 'TECHNICIEN', 'LECTURE_SEULE']).optional(),
  statut: z.enum(['ACTIF', 'BLOQUE', 'INACTIF']).optional(),
  permissions: z.array(z.string()).optional(),
})

/**
 * @swagger
 * /api/utilisateurs/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve details of a specific user.
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
// =============================================
// GET /api/utilisateurs/[id]
// =============================================
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { id } = await params

    const user = await prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true, nom: true, email: true, telephone: true,
        role: true, statut: true, photoProfil: true,
        permissions: true, derniereConnexion: true, createdAt: true,
      }
    })

    if (!user) return apiError('Utilisateur introuvable', 404)

    return apiSuccess(user)

  } catch (error) {
    console.error('[UTILISATEURS GET ID]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/utilisateurs/{id}:
 *   patch:
 *     summary: Update a user
 *     description: Update details of a specific user (Admin only).
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               email:
 *                 type: string
 *               telephone:
 *                 type: string
 *               motDePasse:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, AGENT, TECHNICIEN, LECTURE_SEULE]
 *               statut:
 *                 type: string
 *                 enum: [ACTIF, BLOQUE, INACTIF]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
// =============================================
// PATCH /api/utilisateurs/[id]
// =============================================
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé', 403)

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) return apiError('Données invalides', 400, parsed.error.flatten())

    const data: any = { ...parsed.data }
    if (data.motDePasse) {
      data.motDePasse = await hashPassword(data.motDePasse)
    }

    const updated = await prisma.utilisateur.update({
      where: { id },
      data,
      select: {
        id: true, nom: true, email: true, telephone: true,
        role: true, statut: true, createdAt: true,
      }
    })

    await prisma.log.create({
      data: {
        type: 'Modification utilisateur',
        description: `Utilisateur ${updated.nom} modifié par ${authUser.email}`,
        entiteId: id,
        entiteType: 'Utilisateur',
        utilisateurId: authUser.id,
      }
    })

    return apiSuccess(updated, 'Utilisateur mis à jour')

  } catch (error) {
    console.error('[UTILISATEURS PATCH]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/utilisateurs/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a specific user (Admin only). Cannot delete self.
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Cannot delete self
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
// =============================================
// DELETE /api/utilisateurs/[id]
// =============================================
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé', 403)

    const { id } = await params

    if (authUser.id === id) return apiError('Vous ne pouvez pas supprimer votre propre compte', 400)

    await prisma.utilisateur.delete({ where: { id } })

    return apiSuccess(null, 'Utilisateur supprimé')

  } catch (error) {
    console.error('[UTILISATEURS DELETE]', error)
    return apiError('Erreur interne', 500)
  }
}
