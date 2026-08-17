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

  // Offres par défaut
  try { await prisma.offre.deleteMany(); } catch (e) { console.log("Could not delete old offers, maybe referenced"); }
  const offresCount = await prisma.offre.count()
  if (offresCount === 0) {
    await prisma.offre.createMany({
      data: [
        {
          nom: 'Recharge',
          description: 'Rechargez votre crédit de communication rapidement',
          prix: 0,
          type: 'RECHARGE',
          couleur: '#4F46E5',
          estActif: true,
        },
        {
          nom: 'Forfait Pass',
          description: 'Achetez des forfaits appels, internet ou mixtes',
          prix: 0,
          type: 'FORFAIT_PASS',
          couleur: '#059669',
          estActif: true,
        },
        {
          nom: 'Dépôt',
          description: 'Effectuez un dépôt sécurisé sur votre compte',
          prix: 0,
          type: 'DEPOT',
          couleur: '#D97706',
          estActif: true,
        },
      ]
    })
    console.log('✅ 3 nouvelles offres créées (Recharge, Forfait Pass, Dépôt)')
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
