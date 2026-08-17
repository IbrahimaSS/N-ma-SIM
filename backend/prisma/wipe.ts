import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'
import * as path from 'path'

// Charger le .env
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^[\"']|[\"']$/g, '')
        if (!process.env[key]) process.env[key] = value
      }
    }
  })
}

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🗑️  Suppression de toutes les données...')
  await prisma.paiement.deleteMany()
  console.log('  ✓ Paiements supprimés')
  await prisma.log.deleteMany()
  console.log('  ✓ Logs supprimés')
  await prisma.demandeSIM.deleteMany()
  console.log('  ✓ Demandes supprimées')
  await prisma.client.deleteMany()
  console.log('  ✓ Clients supprimés')
  console.log('✅ Base vidée avec succès !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
