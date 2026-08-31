import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/esim/envoyer-email
 * Envoi réel du QR Code eSIM par e-mail via l'API HTTP Brevo (transactionnel).
 *
 * Variables d'environnement requises (frontend/.env.local) :
 *   BREVO_API_KEY        clé API Brevo (obligatoire pour l'envoi réel)
 *   ESIM_MAIL_FROM       adresse expéditrice VALIDÉE dans Brevo (obligatoire)
 *   ESIM_MAIL_FROM_NAME  nom affiché de l'expéditeur (optionnel, défaut "N'ma SIM")
 *
 * Sans BREVO_API_KEY / ESIM_MAIL_FROM → réponse 501 explicite (pas de faux succès).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function qrImageUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(data)}`;
}

function buildHtml(opts: {
  nomClient?: string;
  reference?: string;
  numeroDossier?: string;
  qrString: string;
}) {
  const { nomClient, reference, numeroDossier, qrString } = opts;
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#F4F5F9;font-family:Arial,Helvetica,sans-serif;color:#1F0270;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#1a1464 0%,#2d27a0 60%,#f5a800 100%);border-radius:20px 20px 0 0;padding:24px;color:#fff;">
      <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.7;">Activation</p>
      <h1 style="margin:4px 0 0;font-size:22px;">eSIM N'ma SIM</h1>
    </div>
    <div style="background:#fff;border:1px solid #E5E7EB;border-top:0;border-radius:0 0 20px 20px;padding:24px;">
      <p style="font-size:15px;">Bonjour ${nomClient || "cher client"},</p>
      <p style="font-size:14px;color:#374151;line-height:1.6;">
        Votre profil eSIM est prêt. Scannez le QR Code ci-dessous depuis les réglages de votre téléphone
        (Réseau mobile &rarr; Ajouter une eSIM) pour l'installer.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <img src="${qrImageUrl(qrString)}" width="260" height="260" alt="QR Code eSIM"
             style="border:8px solid #EEF2FF;border-radius:16px;" />
      </div>
      <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;">
        ${reference ? `<tr><td style="padding:6px 0;color:#6B7280;">Référence</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${reference}</td></tr>` : ""}
        ${numeroDossier ? `<tr><td style="padding:6px 0;color:#6B7280;">Dossier</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${numeroDossier}</td></tr>` : ""}
      </table>
      <p style="font-size:12px;color:#6B7280;margin-top:16px;">
        Si le scan est impossible, saisissez ce code d'activation manuellement :
      </p>
      <p style="font-family:monospace;font-size:12px;background:#F4F5F9;border:1px solid #E5E7EB;border-radius:8px;padding:10px;word-break:break-all;">
        ${qrString}
      </p>
      <ol style="font-size:13px;color:#374151;line-height:1.7;padding-left:18px;">
        <li>Ouvrez les <b>Réglages</b> de votre téléphone.</li>
        <li>Allez dans <b>Réseau mobile</b> puis <b>Ajouter une eSIM</b>.</li>
        <li>Scannez le QR Code de cet e-mail.</li>
        <li>Suivez les instructions à l'écran pour finaliser l'activation.</li>
      </ol>
      <p style="font-size:11px;color:#9CA3AF;margin-top:24px;">
        Ce QR Code est unique et à usage unique. N'ma SIM &middot; Guinée Conakry.
      </p>
    </div>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, reference, numeroDossier, nomClient, qrString } = body ?? {};

    if (!email || !EMAIL_RE.test(String(email))) {
      return NextResponse.json({ success: false, error: "Adresse e-mail invalide" }, { status: 400 });
    }
    if (!qrString) {
      return NextResponse.json({ success: false, error: "Profil eSIM manquant" }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.ESIM_MAIL_FROM;
    const fromName = process.env.ESIM_MAIL_FROM_NAME || "N'ma SIM";

    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Service e-mail non configuré. Définir BREVO_API_KEY et ESIM_MAIL_FROM dans frontend/.env.local.",
        },
        { status: 501 },
      );
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: String(email), name: nomClient || undefined }],
        subject: "Votre eSIM N'ma SIM — QR Code d'activation",
        htmlContent: buildHtml({ nomClient, reference, numeroDossier, qrString }),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[ESIM/ENVOYER-EMAIL] Brevo KO", res.status, data);
      return NextResponse.json(
        { success: false, error: data?.message || "Échec de l'envoi (fournisseur e-mail)" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      sentTo: email,
      reference: reference || null,
      messageId: data?.messageId || null,
    });
  } catch (err) {
    console.error("[ESIM/ENVOYER-EMAIL]", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de l'envoi de l'e-mail" },
      { status: 500 },
    );
  }
}
