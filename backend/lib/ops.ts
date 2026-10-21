import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Activation d'une ligne prépayée chez Orange via OPS (POST /ops/provisioning, action ACTIVATION).
 * Pour l'instant OPS est SIMULÉ par ops-mock (github.com/nouhou110512/ops-mock, port 8089).
 *
 * Variables d'environnement :
 *   OPS_URL            ex. http://localhost:8089 (absent → activation indisponible)
 *   OPS_LOGIN/OPS_PASS identifiants passés en paramètres d'URL (mock : test / test)
 *   OPS_PREFIXE_SIM    préfixe ajouté à l'IMSI imprimé pour former le champ « sim » (défaut 61101 = Guinée + Orange)
 *   OPS_CLE            champ « cle » (défaut "0")
 *   OPS_PLAGE_NUMEROS  plage où N'ma SIM choisit le numéro créé (défaut 620900000-620999999)
 */
export function opsConfigure(): boolean {
  return Boolean(process.env.OPS_URL)
}

/** IMSI imprimé sur la carte / dans son code-barres Code 128 : 10 chiffres (ex. 2062359768). */
export function normaliserImsi(saisie: unknown): string | null {
  const brut = String(saisie ?? '').replace(/\D/g, '')
  const prefixe = process.env.OPS_PREFIXE_SIM || '61101'
  // Accepte aussi l'IMSI complet (15 chiffres) s'il est lu tel quel
  const court = brut.length === 15 && brut.startsWith(prefixe) ? brut.slice(prefixe.length) : brut
  return /^\d{10}$/.test(court) ? court : null
}

function plageNumeros(): [number, number] {
  const m = (process.env.OPS_PLAGE_NUMEROS || '620900000-620999999').match(/^(\d{9})-(\d{9})$/)
  const debut = m ? Number(m[1]) : 620900000
  const fin = m ? Number(m[2]) : 620999999
  return debut <= fin ? [debut, fin] : [fin, debut]
}

/** Tire un numéro libre (jamais attribué à une autre demande) dans la plage configurée. */
async function tirerNumeroLibre(exclus: Set<string>): Promise<string> {
  const [debut, fin] = plageNumeros()
  for (let essai = 0; essai < 50; essai++) {
    const numero = String(randomInt(debut, fin + 1))
    if (exclus.has(numero)) continue
    const pris = await prisma.demandeSIM.findUnique({ where: { numeroAttribue: numero }, select: { id: true } })
    if (!pris) return numero
    exclus.add(numero)
  }
  throw new Error('Plus de numéro libre dans la plage configurée (OPS_PLAGE_NUMEROS)')
}

interface ReponseOps {
  status?: string
  message?: string
  responses?: string[] | null
}

type AppelOps =
  | { ok: true; message: string }
  | { ok: false; message: string; numeroExistant?: boolean; simDejaUtilisee?: boolean; injoignable?: boolean }

/**
 * Un appel POST /ops/provisioning, typeAction ACTIVATION : Orange demande d'utiliser cette même action
 * pour tous les services (nouvelle SIM, réactivation, recharge).
 */
async function appelerOps(params: { requestId: string; numero: string; sim: string }): Promise<AppelOps> {
  const url = new URL('/ops/provisioning', process.env.OPS_URL)
  url.searchParams.set('login', process.env.OPS_LOGIN || 'test')
  url.searchParams.set('pass', process.env.OPS_PASS || 'test')
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: params.requestId,
        typeAction: 'ACTIVATION',
        numero: params.numero,
        sim: params.sim,
        profil: 'prepaid',
        cle: process.env.OPS_CLE || '0',
      }),
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    console.error('[OPS] injoignable', e)
    return { ok: false, message: 'Service opérateur injoignable', injoignable: true }
  }

  const data: ReponseOps = await res.json().catch(() => ({}))
  if (res.ok && data.status === '0') return { ok: true, message: data.message || 'Succès' }
  const message = data.message || `Erreur OPS (HTTP ${res.status})`
  const conflitSim = res.status === 409 && /\bsim\b/i.test(message)
  return { ok: false, message, simDejaUtilisee: conflitSim, numeroExistant: res.status === 409 && !conflitSim && /numero/i.test(message) }
}

const simDeCarte = (imsi: string) => `${process.env.OPS_PREFIXE_SIM || '61101'}${imsi}`

/**
 * Identifiant de carte pour une opération sans nouvelle carte (le client garde la sienne, recharge) :
 * OPS exige 15 caractères, on envoie une valeur fictive unique, reconnaissable à « 99 » après le préfixe.
 */
const simFictive = () => `${process.env.OPS_PREFIXE_SIM || '61101'}99${String(randomInt(0, 100_000_000)).padStart(8, '0')}`

export type ResultatActivation =
  | { ok: true; numero: string; message: string }
  | { ok: false; message: string; simDejaUtilisee?: boolean }

/**
 * Nouvelle SIM : crée et active une ligne pour la carte `imsi`.
 * Si OPS signale que le numéro existe déjà (numéro créé hors N'ma SIM), on en tire un autre.
 */
export async function activerLigne(params: { requestId: string; imsi: string }): Promise<ResultatActivation> {
  if (!opsConfigure()) return { ok: false, message: 'Service opérateur (OPS) non configuré sur le serveur' }
  const exclus = new Set<string>()

  for (let essai = 0; essai < 5; essai++) {
    const numero = await tirerNumeroLibre(exclus)
    const r = await appelerOps({ requestId: params.requestId, numero, sim: simDeCarte(params.imsi) })
    if (r.ok) return { ok: true, numero, message: r.message }
    if (r.numeroExistant) { exclus.add(numero); continue } // numéro déjà créé côté opérateur → un autre
    return { ok: false, message: r.message, simDejaUtilisee: r.simDejaUtilisee }
  }
  return { ok: false, message: 'Aucun numéro libre accepté par l\'opérateur après plusieurs essais' }
}

export type ResultatOperation = { ok: true; message: string } | { ok: false; message: string; simDejaUtilisee?: boolean }

/**
 * Réactivation ou recharge : même action ACTIVATION sur un numéro qui existe déjà.
 * `imsi` = nouvelle carte délivrée (réactivation après perte) ; sinon identifiant de carte fictif.
 * Pour ces services, « le numéro existe déjà » signifie que la ligne est bien connue de l'opérateur :
 * c'est un succès, pas une erreur.
 */
export async function operationSurLigne(params: { requestId: string; numero: string; imsi?: string }): Promise<ResultatOperation> {
  if (!opsConfigure()) return { ok: false, message: 'Service opérateur (OPS) non configuré sur le serveur' }
  if (!/^\d{9}$/.test(params.numero)) return { ok: false, message: `Numéro invalide : ${params.numero} (9 chiffres attendus)` }

  const r = await appelerOps({
    requestId: params.requestId,
    numero: params.numero,
    sim: params.imsi ? simDeCarte(params.imsi) : simFictive(),
  })
  if (r.ok) return { ok: true, message: r.message }
  if (r.numeroExistant) return { ok: true, message: `Ligne existante confirmée par l'opérateur (${r.message})` }
  return { ok: false, message: r.message, simDejaUtilisee: r.simDejaUtilisee }
}
