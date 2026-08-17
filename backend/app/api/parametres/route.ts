import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const params: any[] = await prisma.$queryRawUnsafe(`SELECT cle, valeur, type FROM "ParametreSysteme"`)
    
    // Convert array of { cle, valeur, type } into an object
    const paramsObj: Record<string, any> = {}
    params.forEach(p => {
      if (p.type === 'BOOLEAN') {
        paramsObj[p.cle] = p.valeur === 'true'
      } else if (p.type === 'NUMBER') {
        paramsObj[p.cle] = Number(p.valeur)
      } else {
        paramsObj[p.cle] = p.valeur
      }
    })

    return apiSuccess(paramsObj)
  } catch (error) {
    console.error('[PARAMETRES GET]', error)
    return apiError('Erreur interne', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return apiError('Non autorisé (Admin requis)', 403)
    }

    const body = await request.json()
    const keys = Object.keys(body)

    // Start a transaction to update all parameters
    const operations = keys.map(key => {
      const val = body[key]
      const type = typeof val === 'boolean' ? 'BOOLEAN' : typeof val === 'number' ? 'NUMBER' : 'STRING'
      const stringVal = String(val)

      return prisma.$executeRawUnsafe(`
        INSERT INTO "ParametreSysteme" (cle, valeur, type, "updatedAt") 
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, type = EXCLUDED.type, "updatedAt" = EXCLUDED."updatedAt"
      `, key, stringVal, type)
    })

    await Promise.all(operations)

    // Log the change
    await prisma.log.create({
      data: {
        type: "Mise à jour paramètres",
        description: `Mise à jour de ${keys.length} paramètres par ${authUser.email}`,
        utilisateurId: authUser.id,
      }
    })

    return apiSuccess({ message: "Paramètres mis à jour avec succès" })
  } catch (error) {
    console.error('[PARAMETRES POST]', error)
    return apiError('Erreur interne lors de la mise à jour des paramètres', 500)
  }
}
