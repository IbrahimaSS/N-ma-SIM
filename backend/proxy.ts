import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '*'

  // Headers CORS — autorise tout domaine (borne Vercel, admin, etc.)
  // Pas de "Allow-Credentials: true" ici : l'auth se fait par Bearer token (pas par cookies),
  // donc ce header n'est pas nécessaire et sa combinaison avec un Origin reflété est risquée.
  const corsHeaders = new Headers({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-internal-service',
  })

  // Répondre immédiatement aux requêtes de pré-vérification (Preflight OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders })
  }

  // Injecter les headers CORS dans toutes les réponses API
  const response = NextResponse.next()
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: '/api/:path*',
}
