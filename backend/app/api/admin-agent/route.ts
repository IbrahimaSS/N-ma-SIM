import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface AdminAgentAction {
  type: 'none' | 'navigate' | 'print' | 'refresh';
  target: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message = '', currentPath = '' } = body;

    // ════════════════════════════════════════════════════════════════
    // RÉCUPÉRATION DES STATS POUR LE CONTEXTE DE L'IA
    // ════════════════════════════════════════════════════════════════
    const [totalClients, totalDemandes, paiementsMetrics, totalUtilisateurs] = await Promise.all([
      prisma.client.count(),
      prisma.demandeSIM.count(),
      prisma.paiement.aggregate({
        where: { statut: 'CONFIRME' },
        _sum: { montant: true },
        _count: true
      }),
      prisma.utilisateur.count()
    ]);

    const systemPrompt = `
Tu es N'ma IA, l'Assistant IA Administrateur (Copilote) du tableau de bord N'ma SIM.
Ton rôle est d'aider l'administrateur à naviguer dans le système, effectuer des actions sur la page actuelle, et répondre aux questions sur les statistiques.

CONTEXTE ACTUEL (Données en temps réel) :
- Total Clients : ${totalClients}
- Total Demandes SIM : ${totalDemandes}
- Total Utilisateurs (Admins) : ${totalUtilisateurs}
- Total Paiements Confirmés : ${paiementsMetrics._count}
- Chiffre d'Affaires (Montant total) : ${paiementsMetrics._sum.montant || 0} GNF

RÈGLE ABSOLUE :
Tu dois toujours retourner un JSON STRICT avec cette structure exacte, sans markdown ni texte autour :
{
  "answer": "Ta réponse vocale courte",
  "action": {
    "type": "none" | "navigate" | "print" | "refresh",
    "target": "URL ou cible"
  }
}

ACTIONS POSSIBLES :
1. "navigate" : Si l'utilisateur veut aller sur une page.
   - Accueil / Dashboard -> target = "/admin"
   - Demandes SIM -> target = "/admin/demandes-sim"
   - Utilisateurs -> target = "/admin/utilisateurs"
   - Clients -> target = "/admin/clients"
   - Bornes -> target = "/admin/bornes"
   - Paramètres -> target = "/admin/parametres"
   - Paiements -> target = "/admin/paiements"
   - Offres -> target = "/admin/offres"
   - Logs / Historique -> target = "/admin/logs"
2. "print" : Si l'utilisateur veut imprimer la page actuelle ou la liste.
   - target = ""
3. "refresh" : Si l'utilisateur veut rafraîchir les données.
   - target = ""

CONSIGNES :
Réponds brièvement et poliment.
`;

    const grokApiKey = process.env.GROK_API_KEY;

    // ════════════════════════════════════════════════════════════════
    // RÈGLES DÉTERMINISTES
    // ════════════════════════════════════════════════════════════════
    if (message && message.trim().length > 0) {
      const msg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      if (/imprimer|impression|imprime/.test(msg)) {
        if (/clients/.test(msg)) {
          return NextResponse.json({ answer: "Je navigue vers les clients et lance l'impression.", action: { type: 'print', target: '/admin/clients' } });
        }
        if (/demandes/.test(msg)) {
          return NextResponse.json({ answer: "Je navigue vers les demandes et lance l'impression.", action: { type: 'print', target: '/admin/demandes-sim' } });
        }
        if (/utilisateurs/.test(msg)) {
          return NextResponse.json({ answer: "J'imprime la liste des utilisateurs.", action: { type: 'print', target: '/admin/utilisateurs' } });
        }
        if (/paiements/.test(msg)) {
          return NextResponse.json({ answer: "J'imprime la liste des paiements.", action: { type: 'print', target: '/admin/paiements' } });
        }
        return NextResponse.json({ answer: "Très bien, je lance l'impression de la page actuelle.", action: { type: 'print', target: '' } });
      }
      if (/rafraichir|actualiser|recharger/.test(msg)) {
        return NextResponse.json({ answer: "J'actualise les données de la page.", action: { type: 'refresh', target: '' } });
      }
      if (/liste des demandes|page des demandes|aller aux demandes/.test(msg)) {
        return NextResponse.json({ answer: "Je vous amène sur la page des demandes SIM.", action: { type: 'navigate', target: '/admin/demandes-sim' } });
      }
      if (/liste des utilisateurs|page des utilisateurs|comptes administrateurs/.test(msg)) {
        return NextResponse.json({ answer: "Ouverture de la gestion des utilisateurs.", action: { type: 'navigate', target: '/admin/utilisateurs' } });
      }
      if (/liste des clients|page des clients|base de donnees clients/.test(msg)) {
        return NextResponse.json({ answer: "Voici la liste des clients.", action: { type: 'navigate', target: '/admin/clients' } });
      }
      if (/liste des bornes|page des bornes|gestion des kiosques/.test(msg)) {
        return NextResponse.json({ answer: "Je vous amène sur la gestion des bornes.", action: { type: 'navigate', target: '/admin/bornes' } });
      }
      if (/ouvrir les parametres|configuration du systeme/.test(msg)) {
        return NextResponse.json({ answer: "Ouverture des paramètres du système.", action: { type: 'navigate', target: '/admin/parametres' } });
      }
      if (/liste des paiements|page des paiements|transactions recemment/.test(msg)) {
        return NextResponse.json({ answer: "Je vous affiche la liste des paiements.", action: { type: 'navigate', target: '/admin/paiements' } });
      }
      if (/liste des offres|page des offres|gestion des forfaits/.test(msg)) {
        return NextResponse.json({ answer: "Voici la gestion des offres.", action: { type: 'navigate', target: '/admin/offres' } });
      }
      if (/historique des actions|page des logs/.test(msg)) {
        return NextResponse.json({ answer: "Ouverture de l'historique des actions (logs).", action: { type: 'navigate', target: '/admin/logs' } });
      }
      if (/retour a l'accueil|aller au tableau de bord|dashboard principal/.test(msg)) {
        return NextResponse.json({ answer: "Retour à l'accueil du tableau de bord.", action: { type: 'navigate', target: '/admin' } });
      }
    }

    if (!grokApiKey) {
      return NextResponse.json({ answer: "Clé API manquante.", action: { type: 'none', target: '' } });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `[Path: ${currentPath}] ${message}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error("[ADMIN AGENT IA] Erreur Groq API:", await response.text());
      return NextResponse.json({ answer: "Désolé, je rencontre une difficulté technique.", action: { type: 'none', target: '' } });
    }

    const data = await response.json();
    const resultContent = data.choices[0].message.content;

    try {
      const cleanContent = resultContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return NextResponse.json({
        answer: parsed.answer || "Je suis à votre écoute.",
        action: parsed.action || { type: 'none', target: '' }
      });
    } catch (parseError) {
      return NextResponse.json({ answer: "Désolé, je n'ai pas compris votre demande.", action: { type: 'none', target: '' } });
    }

  } catch (error) {
    console.error('[ADMIN AGENT IA] Erreur générale:', error);
    return NextResponse.json({ answer: "Une erreur interne s'est produite.", action: { type: 'none', target: '' } });
  }
}
