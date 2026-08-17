import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numeroPiece = searchParams.get('numeroPiece')
    
    if (!numeroPiece) {
      return apiError('Le numéro de pièce est requis', 400)
    }

    // Chercher le client par numéro de pièce
    const client = await prisma.client.findFirst({
      where: { numeroPiece },
      include: {
        demandes: {
          include: {
            offre: true,
            paiement: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!client) {
      // Si on ne trouve pas de client, on renvoie une structure vide pour que l'interface affiche "0 numéros" etc.
      return apiSuccess({
        trouve: false,
        client: null,
        numeros: []
      })
    }

    // Simuler des numéros associés (ou extraire des demandes existantes)
    // Dans un vrai SI opérateur, on interrogerait le système de facturation
    // Ici, on va lister les demandes "VALIDEE" comme étant des numéros actifs
    const numerosActifs = client.demandes
      .filter(d => d.statut === 'VALIDEE')
      .map(d => ({
        id: d.id,
        numero: d.numeroAReactiver || `622 ${Math.floor(100000 + Math.random() * 900000)}`, // Simulé si pas de vrai numéro
        offre: d.offre?.nom || 'SIM Standard',
        dateActivation: d.updatedAt,
        statut: 'Actif'
      }))

    return apiSuccess({
      trouve: true,
      client: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        typePiece: client.typePiece,
        numeroPiece: client.numeroPiece,
        telephoneContact: client.telephone,
        email: client.email,
        statut: client.statut,
        dateEnregistrement: client.createdAt
      },
      numerosActifs,
      historiqueDemandes: client.demandes.map(d => ({
        id: d.id,
        type: d.type,
        statut: d.statut,
        date: d.createdAt
      }))
    })

  } catch (error) {
    console.error('[CLIENTS CHECK]', error)
    return apiError('Erreur interne', 500)
  }
}
