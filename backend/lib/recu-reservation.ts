import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { envoyerEmail, emailConfigure } from '@/lib/email'

interface ReservationRecu {
  id: string
  code: string
  nom: string
  prenom: string
  numeroPasseport: string
  email: string | null
  formatSim: 'PHYSIQUE' | 'ESIM'
  offre: { nom: string } | null
  montantRecharge: number | null
  montant: number
  dateArrivee: Date
  expireLe: Date
  partenaireNom: string
}

const echapper = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fmt = (n: number) => `${n.toLocaleString('fr-FR')} GNF`
const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { timeZone: 'Africa/Conakry' })

function produit(r: ReservationRecu): string {
  const extras = [r.offre?.nom, r.montantRecharge ? `recharge ${fmt(r.montantRecharge)}` : null].filter(Boolean)
  return `${r.formatSim === 'ESIM' ? 'eSIM' : 'SIM physique / Physical SIM'}${extras.length ? ' — ' + extras.join(' + ') : ''}`
}

/**
 * E-mail bilingue (FR / EN) avec le code et son QR code, à présenter à la borne.
 * Le QR affiché vient de api.qrserver.com, comme l'e-mail eSIM (Brevo ne gère pas les images « cid: ») ;
 * le même QR est aussi joint en PNG pour rester disponible hors connexion.
 */
export async function construireEmail(r: ReservationRecu) {
  const qr = await QRCode.toBuffer(r.code, { width: 360, margin: 1, color: { dark: '#1B2B4B' } })
  const lignes: [string, string][] = [
    ['Voyageur / Traveller', `${r.prenom} ${r.nom}`],
    ['Passeport / Passport', r.numeroPasseport],
    ['Produit / Product', produit(r)],
    ['Arrivée prévue / Expected arrival', fmtDate(r.dateArrivee)],
    ['Valable jusqu\'au / Valid until', fmtDate(r.expireLe)],
    ['Réservée par / Booked by', r.partenaireNom],
    ['Montant payé / Amount paid', fmt(r.montant)],
  ]
  const etapes = [
    ['Rendez-vous à une borne N\'ma SIM à votre arrivée en Guinée.', 'Go to an N\'ma SIM kiosk when you arrive in Guinea.'],
    ['Choisissez « J\'ai un code de réservation » et scannez le QR code.', 'Choose « I have a reservation code » and scan the QR code.'],
    ['Scannez votre passeport puis faites un selfie.', 'Scan your passport, then take a selfie.'],
    ['Récupérez votre SIM : elle est déjà payée.', 'Collect your SIM: it is already paid.'],
  ]

  const html = `<!doctype html><html><body style="margin:0;background:#F4F7FC;font-family:Arial,Helvetica,sans-serif;color:#1B2B4B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FC;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#2656A2;padding:22px 28px;color:#ffffff">
    <div style="font-size:22px;font-weight:bold">N'ma <span style="color:#F5BB02">SIM</span></div>
    <div style="font-size:13px;opacity:.85;margin-top:4px">Votre SIM réservée · Your reserved SIM</div>
  </td></tr>
  <tr><td style="height:5px;background:#F5BB02"></td></tr>
  <tr><td style="padding:26px 28px 8px">
    <p style="margin:0 0 6px;font-size:16px">Bonjour ${echapper(r.prenom)}, / Hello ${echapper(r.prenom)},</p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#55607A">Votre carte SIM vous attend à la borne N'ma SIM. Gardez cet e-mail : vous en aurez besoin à l'arrivée.<br>
    Your SIM card is waiting for you at the N'ma SIM kiosk. Keep this e-mail: you will need it on arrival.</p>
  </td></tr>
  <tr><td align="center" style="padding:18px 28px">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&amp;margin=8&amp;data=${encodeURIComponent(r.code)}" width="180" height="180" alt="QR code ${echapper(r.code)}" style="display:block">
    <div style="margin-top:10px;font-family:'Courier New',monospace;font-size:24px;font-weight:bold;letter-spacing:2px;color:#2656A2">${echapper(r.code)}</div>
    <div style="font-size:12px;color:#55607A;margin-top:4px">À scanner sur la borne · Scan at the kiosk</div>
  </td></tr>
  <tr><td style="padding:0 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E3E8F2;border-radius:12px;font-size:13px">
      ${lignes.map(([l, v], i) => `<tr><td style="padding:10px 14px;color:#55607A;${i ? 'border-top:1px solid #E3E8F2;' : ''}">${l}</td><td style="padding:10px 14px;text-align:right;font-weight:bold;${i ? 'border-top:1px solid #E3E8F2;' : ''}">${echapper(v)}</td></tr>`).join('')}
    </table>
  </td></tr>
  <tr><td style="padding:22px 28px 6px">
    <div style="font-weight:bold;font-size:15px;color:#2656A2;margin-bottom:10px">Récupérer votre SIM · Collect your SIM</div>
    ${etapes.map(([fr, en], i) => `<div style="margin:0 0 10px;font-size:13px;line-height:1.45"><b style="color:#2656A2">${i + 1}.</b> ${fr}<br><span style="color:#55607A">${en}</span></div>`).join('')}
  </td></tr>
  <tr><td style="padding:10px 28px 26px">
    <div style="background:#FFF8E1;border-radius:10px;padding:12px 14px;font-size:12px;line-height:1.5;color:#6B5200">
      Ce code est personnel et à usage unique. Le passeport présenté à la borne doit être celui indiqué ci-dessus.<br>
      This code is personal and single-use. The passport shown at the kiosk must match the one above.
    </div>
  </td></tr>
</table>
<p style="font-size:11px;color:#8A93A8;margin:14px 0 0">N'ma SIM · support.nmasim@gmail.com</p>
</td></tr></table></body></html>`

  const text = [
    `Bonjour ${r.prenom}, / Hello ${r.prenom},`,
    '',
    `Code de réservation / Reservation code : ${r.code}`,
    ...lignes.map(([l, v]) => `${l} : ${v}`),
    '',
    ...etapes.map(([fr, en], i) => `${i + 1}. ${fr} / ${en}`),
    '',
    'Ce code est personnel et à usage unique. / This code is personal and single-use.',
  ].join('\n')

  return { html, text, qr }
}

/**
 * Envoie le reçu au voyageur et note la date d'envoi.
 * Ne lève jamais : renvoie { envoye: false, raison } si l'e-mail n'a pas pu partir.
 */
export async function envoyerRecuReservation(r: ReservationRecu): Promise<{ envoye: boolean; raison?: string }> {
  if (!r.email) return { envoye: false, raison: 'Aucune adresse e-mail pour ce voyageur' }
  if (!emailConfigure()) return { envoye: false, raison: 'Envoi d\'e-mails non configuré sur le serveur' }
  try {
    const { html, text, qr } = await construireEmail(r)
    await envoyerEmail({
      to: r.email,
      toName: `${r.prenom} ${r.nom}`,
      subject: `Votre SIM N'ma SIM est réservée · ${r.code}`,
      html,
      text,
      pieces: [{ nom: `${r.code}.png`, contenu: qr }],
    })
    await prisma.reservationSIM.update({ where: { id: r.id }, data: { recuEnvoyeLe: new Date() } })
    return { envoye: true }
  } catch (e) {
    console.error('[RESERVATION EMAIL]', e)
    return { envoye: false, raison: 'L\'e-mail n\'a pas pu être envoyé' }
  }
}
