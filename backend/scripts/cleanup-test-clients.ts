import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

import * as fs from 'fs'
import * as path from 'path'

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

async function main() {
  // Deux lots de données de test identifiés manuellement :
  // 1. "Inconnu Inconnu" — créés en testant l'URL /nouvelle-sim/recu directement (05/10/2026)
  // 2. "User Fake141..187" — données de test pré-existantes (25/09/2026)
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { nom: 'Inconnu', prenom: 'Inconnu' },
        { prenom: 'User', nom: { startsWith: 'Fake' } },
      ],
    },
    include: { demandes: true },
  })

  console.log(`Trouvé ${clients.length} client(s) de test à supprimer :`)
  for (const c of clients) {
    console.log(`  - ${c.prenom} ${c.nom} (${c.id}) — ${c.demandes.length} demande(s)`)
  }

  if (clients.length === 0) {
    console.log('Rien à supprimer.')
    return
  }

  const clientIds = clients.map((c) => c.id)
  const demandeIds = clients.flatMap((c) => c.demandes.map((d) => d.id))

  const paiementsDeleted = await prisma.paiement.deleteMany({ where: { demandeId: { in: demandeIds } } })
  const demandesDeleted = await prisma.demandeSIM.deleteMany({ where: { id: { in: demandeIds } } })
  const clientsDeleted = await prisma.client.deleteMany({ where: { id: { in: clientIds } } })

  console.log(`Supprimé : ${paiementsDeleted.count} paiement(s), ${demandesDeleted.count} demande(s), ${clientsDeleted.count} client(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
