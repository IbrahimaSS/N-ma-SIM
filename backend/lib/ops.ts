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

export type ResultatActivation =
  | { ok: true; numero: string; message: string }
  | { ok: false; message: string; simDejaUtilisee?: boolean }

/**
 * Crée et active la ligne pour la carte `imsi`.
 * Si OPS signale que le numéro existe déjà (numéro créé hors N'ma SIM), on en tire un autre.
 */
export async function activerLigne(params: { requestId: string; imsi: string }): Promise<ResultatActivation> {
  if (!opsConfigure()) return { ok: false, message: 'Service opérateur (OPS) non configuré sur le serveur' }

  const url = new URL('/ops/provisioning', process.env.OPS_URL)
  url.searchParams.set('login', process.env.OPS_LOGIN || 'test')
  url.searchParams.set('pass', process.env.OPS_PASS || 'test')
  const sim = `${process.env.OPS_PREFIXE_SIM || '61101'}${params.imsi}`
  const exclus = new Set<string>()

  for (let essai = 0; essai < 5; essai++) {
    const numero = await tirerNumeroLibre(exclus)
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: params.requestId,
          typeAction: 'ACTIVATION',
          numero,
          sim,
          profil: 'prepaid',
          cle: process.env.OPS_CLE || '0',
        }),
        signal: AbortSignal.timeout(20000),
      })
    } catch (e) {
      console.error('[OPS] injoignable', e)
      return { ok: false, message: 'Service opérateur injoignable' }
    }

    const data: ReponseOps = await res.json().catch(() => ({}))
    if (res.ok && data.status === '0') return { ok: true, numero, message: data.message || 'Activée' }

    const message = data.message || `Erreur OPS (HTTP ${res.status})`
    if (res.status === 409 && /numero/i.test(message) && !/sim/i.test(message)) {
      exclus.add(numero) // numéro déjà créé côté opérateur → on en essaie un autre
      continue
    }
    return { ok: false, message, simDejaUtilisee: res.status === 409 && /sim/i.test(message) }
  }
  return { ok: false, message: 'Aucun numéro libre accepté par l\'opérateur après plusieurs essais' }
}
