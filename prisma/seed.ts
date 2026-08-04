import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// Charger les variables d'environnement manuellement
import * as fs from 'fs'
import * as path from 'path'

// Lire le .env manuellement
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) process.env[key] = value
      }
    }
  })
}

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter } as any)

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Seeding database...')
  console.log('📡 Connexion à:', process.env.DATABASE_URL?.substring(0, 50) + '...')

  // Admin par défaut
  const adminExists = await prisma.utilisateur.findUnique({
    where: { email: 'admin@nmasim.gn' }
  })

  if (!adminExists) {
    await prisma.utilisateur.create({
      data: {
        nom: 'Admin Principal',
        email: 'admin@nmasim.gn',
        motDePasse: await hashPassword('admin123'),
        role: 'ADMIN',
        statut: 'ACTIF',
        permissions: ['all'],
      }
    })
    console.log('✅ Admin créé : admin@nmasim.gn / admin123')
  } else {
    console.log('ℹ️ Admin déjà existant')
  }

  // Offres SIM par défaut
  const offresCount = await prisma.offre.count()
  if (offresCount === 0) {
    await prisma.offre.createMany({
      data: [
        {
          nom: 'SIM Standard',
          description: 'Carte SIM de base pour les appels et SMS',
          prix: 5000,
          type: 'SIM_STANDARD',
          duree: 'Illimité',
          appels: '100 min/mois',
          sms: '50 SMS/mois',
          couleur: '#4F46E5',
          estActif: true,
        },
        {
          nom: 'SIM + Internet',
          description: 'SIM avec forfait data inclus',
          prix: 15000,
          type: 'SIM_INTERNET',
          duree: '30 jours',
          data: '5 Go',
          appels: '300 min/mois',
          sms: '200 SMS/mois',
          couleur: '#059669',
          estActif: true,
        },
        {
          nom: 'SIM Étudiant',
          description: 'Forfait spécial étudiant avec réduction',
          prix: 10000,
          type: 'SIM_ETUDIANT',
          duree: '30 jours',
          data: '3 Go',
          appels: '200 min/mois',
          sms: '100 SMS/mois',
          couleur: '#D97706',
          estActif: true,
        },
        {
          nom: 'SIM Entreprise',
          description: 'Solution professionnelle multi-lignes',
          prix: 50000,
          type: 'SIM_ENTREPRISE',
          duree: '30 jours',
          data: '20 Go',
          appels: 'Illimité',
          sms: 'Illimité',
          couleur: '#7C3AED',
          estActif: true,
        },
      ]
    })
    console.log('✅ 4 offres SIM créées')
  } else {
    console.log('ℹ️ Offres déjà existantes')
  }

  console.log('✅ Seed terminé !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
