import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bornes = await prisma.borne.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: bornes });
  } catch (error: any) {
    console.error("Erreur GET /bornes:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, emplacement } = body;

    if (!nom || !emplacement) {
      return NextResponse.json({ success: false, message: "Nom et emplacement sont requis." }, { status: 400 });
    }

    // Générer un ID BRN-XXX
    const count = await prisma.borne.count();
    const numeroReference = `BRN-${String(count + 1).padStart(3, "0")}`;
    
    // Générer une clé d'activation TKN-XXXX-XXXX-XXXX
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleActivation = `TKN-${randomHex()}-${randomHex()}-${randomHex()}`;

    const borne = await prisma.borne.create({
      data: {
        nom,
        emplacement,
        numeroReference,
        cleActivation,
        statut: "HORS_LIGNE",
      },
    });

    return NextResponse.json({ success: true, data: borne });
  } catch (error: any) {
    console.error("Erreur POST /bornes:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
