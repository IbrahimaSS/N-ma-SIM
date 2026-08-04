import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'

// =============================================
// HASH PASSWORD
// =============================================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// =============================================
// JWT TOKENS
// =============================================
export function generateAccessToken(payload: { id: string; role: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function generateRefreshToken(payload: { id: string }) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string }
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { id: string }
  } catch {
    return null
  }
}

// =============================================
// API RESPONSE HELPERS
// =============================================
export function apiSuccess(data: unknown, message = 'Succès', status = 200) {
  return Response.json({ success: true, message, data }, { status })
}

export function apiError(message: string, status = 400, details?: unknown) {
  return Response.json({ success: false, message, details }, { status })
}

// =============================================
// GET AUTH USER FROM REQUEST
// =============================================
export function getAuthUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyAccessToken(token)
}
