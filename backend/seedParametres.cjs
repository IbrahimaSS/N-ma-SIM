require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultParams = [
  // Informations générales
  { cle: "Nom de l'organisation",         valeur: "N'ma SIM",                           type: "STRING" },
  { cle: "Email de contact",              valeur: "contact@nmasim.com",                  type: "STRING" },
  { cle: "Téléphone",                     valeur: "+224 620 12 34 56",                   type: "STRING" },
  { cle: "Adresse",                       valeur: "Conakry, République de Guinée",       type: "STRING" },
  { cle: "Fuseau horaire",                valeur: "(GMT) Afrique/Conakry",               type: "STRING" },
  { cle: "Format de date",                valeur: "DD/MM/YYYY",                          type: "STRING" },
  { cle: "Devise par défaut",             valeur: "GNF - Franc guinéen",                 type: "STRING" },
  // Sécurité
  { cle: "Expiration de session (minutes)", valeur: "60",                                type: "NUMBER" },
  { cle: "Tentatives de connexion max.",  valeur: "5",                                   type: "NUMBER" },
  { cle: "Verrouillage de compte (minutes)", valeur: "15",                               type: "NUMBER" },
  { cle: "2FA",                           valeur: "false",                               type: "BOOLEAN" },
  // Notifications
  { cle: "Nouvelles demandes SIM",        valeur: "true",                                type: "BOOLEAN" },
  { cle: "Validation de demande",         valeur: "true",                                type: "BOOLEAN" },
  { cle: "Paiements confirmés",           valeur: "true",                                type: "BOOLEAN" },
  { cle: "Alertes système",               valeur: "false",                               type: "BOOLEAN" },
  // Paiements
  { cle: "Validation automatique",        valeur: "true",                                type: "BOOLEAN" },
  { cle: "Délai d'attente (minutes)",     valeur: "10",                                  type: "NUMBER" },
  { cle: "Méthode par défaut",            valeur: "Orange Money",                        type: "STRING" },
  { cle: "Orange Money",                  valeur: "true",                                type: "BOOLEAN" },
  { cle: "MTN Mobile Money",              valeur: "true",                                type: "BOOLEAN" },
  { cle: "PayCard",                       valeur: "true",                                type: "BOOLEAN" },
  { cle: "Cartes Bancaires (Visa, Mastercard)", valeur: "false",                         type: "BOOLEAN" },
  // API & Intégrations
  { cle: "URL de l'Endpoint (Base URL)", valeur: "https://api.orange.simulator.local/v1", type: "STRING" },
  { cle: "Délai Timeout (secondes)",      valeur: "30",                                  type: "NUMBER" },
  { cle: "Environnement",                 valeur: "Sandbox / Test",                      type: "STRING" },
  { cle: "Clé secrète API (Token)",       valeur: "secret_token_123456789",              type: "STRING" },
  // Modèles & Langues
  { cle: "Modèle par défaut",             valeur: "Modèle Standard N'ma",                type: "STRING" },
  { cle: "Inclure QR Code",               valeur: "true",                                type: "BOOLEAN" },
  { cle: "Inclure le logo N'ma",          valeur: "false",                               type: "BOOLEAN" },
  { cle: "Langue principale",             valeur: "Français (FR)",                       type: "STRING" },
  { cle: "Multi-langues",                 valeur: "true",                                type: "BOOLEAN" },
  { cle: "Anglais",                       valeur: "true",                                type: "BOOLEAN" },
  { cle: "Soussou",                       valeur: "true",                                type: "BOOLEAN" },
  { cle: "Poular",                        valeur: "false",                               type: "BOOLEAN" },
  { cle: "Malinké",                       valeur: "false",                               type: "BOOLEAN" },
  // Système & Maintenance
  { cle: "Maintenance",                   valeur: "false",                               type: "BOOLEAN" },
  { cle: "Auto Backup",                   valeur: "true",                                type: "BOOLEAN" },
];

async function main() {
  console.log("Création de la table ParametreSysteme...");
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ParametreSysteme" (
        "cle" TEXT NOT NULL,
        "valeur" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'STRING',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ParametreSysteme_pkey" PRIMARY KEY ("cle")
      )
    `);
  } catch (e) {
    console.log("Table création check (peut-être déjà existante): ", e.message);
  }

  let inserted = 0;
  let skipped = 0;
  for (const p of defaultParams) {
    try {
      const existing = await prisma.$queryRawUnsafe(`SELECT cle FROM "ParametreSysteme" WHERE cle = $1`, p.cle);
      if (existing.length === 0) {
        await prisma.$executeRawUnsafe(`INSERT INTO "ParametreSysteme" (cle, valeur, type, "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`, p.cle, p.valeur, p.type);
        inserted++;
        console.log(`  ✅ Inséré : "${p.cle}" = ${p.valeur}`);
      } else {
        skipped++;
        console.log(`  ⏭️  Existant : "${p.cle}" (conservé)`);
      }
    } catch(e) {
      console.log(`Erreur pour ${p.cle}: ${e.message}`);
    }
  }
  console.log(`\n🎉 Terminé ! ${inserted} paramètres insérés, ${skipped} déjà existants.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
