import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasDb: !!process.env.DATABASE_URL,
    hasJwt: !!process.env.JWT_SECRET,
    hasRefresh: !!process.env.REFRESH_TOKEN_SECRET,
    nodeEnv: process.env.NODE_ENV
  })
}
