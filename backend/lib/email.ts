/**
 * Envoi d'e-mails transactionnels via l'API HTTP Brevo — même service et mêmes variables
 * que l'envoi du QR Code eSIM (frontend/src/app/api/esim/envoyer-email) :
 *   BREVO_API_KEY        clé API Brevo
 *   ESIM_MAIL_FROM       adresse expéditrice validée dans Brevo
 *   ESIM_MAIL_FROM_NAME  nom affiché (facultatif, défaut « N'ma SIM »)
 */
export function emailConfigure(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.ESIM_MAIL_FROM)
}

export interface MessageEmail {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  pieces?: { nom: string; contenu: Buffer }[]
}

/** Envoie un e-mail. Lève une Error si Brevo n'est pas configuré ou refuse l'envoi. */
export async function envoyerEmail(m: MessageEmail): Promise<void> {
  if (!emailConfigure()) throw new Error('Service e-mail non configuré (BREVO_API_KEY / ESIM_MAIL_FROM absents)')

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.ESIM_MAIL_FROM, name: process.env.ESIM_MAIL_FROM_NAME || 'N\'ma SIM' },
      to: [{ email: m.to, name: m.toName || undefined }],
      subject: m.subject,
      htmlContent: m.html,
      ...(m.text ? { textContent: m.text } : {}),
      ...(m.pieces?.length ? { attachment: m.pieces.map((p) => ({ name: p.nom, content: p.contenu.toString('base64') })) } : {}),
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`Brevo ${res.status} : ${data?.message || 'échec de l\'envoi'}`)
  }
}
