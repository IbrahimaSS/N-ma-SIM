import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: "ID manquant." }, { status: 400 });
    }

    const borne = await prisma.borne.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: borne });
  } catch (error: any) {
    console.error("Erreur PATCH /bornes/[id]:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID manquant." }, { status: 400 });
    }

    await prisma.borne.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Borne supprimée." });
  } catch (error: any) {
    console.error("Erreur DELETE /bornes/[id]:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
