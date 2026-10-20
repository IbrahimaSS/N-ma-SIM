/**
 * Limiteur d'essais en mémoire (par clé, ex. adresse IP de la borne) :
 * après MAX_ECHECS échecs, la clé est bloquée BLOCAGE_MS. Remis à zéro après un succès.
 * (Mémoire du processus : suffisant pour une borne ; à passer en base/Redis si plusieurs serveurs.)
 */
const MAX_ECHECS = 5
const BLOCAGE_MS = 15 * 60 * 1000
const etats = new Map<string, { echecs: number; bloqueJusqua: number }>()

export function cleClient(request: Request): string {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local'
}

/** Millisecondes restantes de blocage (0 si la clé peut essayer). */
export function blocageRestant(cle: string): number {
  const e = etats.get(cle)
  if (!e) return 0
  const reste = e.bloqueJusqua - Date.now()
  if (reste <= 0 && e.bloqueJusqua > 0) { etats.delete(cle); return 0 }
  return Math.max(0, reste)
}

export function enregistrerEchec(cle: string): void {
  const e = etats.get(cle) ?? { echecs: 0, bloqueJusqua: 0 }
  e.echecs += 1
  if (e.echecs >= MAX_ECHECS) { e.bloqueJusqua = Date.now() + BLOCAGE_MS; e.echecs = 0 }
  etats.set(cle, e)
}

export function enregistrerSucces(cle: string): void {
  etats.delete(cle)
}
