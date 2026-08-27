import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  const authUser = getAuthUser(request)
  if (!authUser) return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  if (authUser.role !== 'ADMIN') return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })

  return NextResponse.json({
    hasDb: !!process.env.DATABASE_URL,
    hasJwt: !!process.env.JWT_SECRET,
    hasRefresh: !!process.env.REFRESH_TOKEN_SECRET,
    nodeEnv: process.env.NODE_ENV
  })
}
