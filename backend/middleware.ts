import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get('origin') ?? ''
  
  // Autoriser toutes les origines en développement (ou configurer pour la prod)
  const isAllowedOrigin = true // On autorise tout pour la borne/dashboard

  // Préparer les headers CORS
  const headers = new Headers({
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  })

  // Gérer la requête de pré-vérification (Preflight / OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers })
  }

  // Passer à la route suivante en injectant les headers
  const response = NextResponse.next()
  
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: '/api/:path*',
}
