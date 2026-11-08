const ORIGIN_SEPARATOR = ','
const ALLOWED_METHODS = 'GET'
const VARY_ON_ORIGIN = { Vary: 'Origin' }
const FORBIDDEN_STATUS = 403
const NO_CONTENT_STATUS = 204

export function isAllowedOrigin(origin: string | null, allowedOrigins: string): origin is string {
  const allowedList = allowedOrigins.split(ORIGIN_SEPARATOR).map((allowed) => allowed.trim())

  return origin !== null && allowedList.includes(origin)
}

export function corsHeaders(origin: string) {
  return { ...VARY_ON_ORIGIN, 'Access-Control-Allow-Origin': origin }
}

export function forbiddenResponse() {
  return new Response(null, { status: FORBIDDEN_STATUS, headers: VARY_ON_ORIGIN })
}

export function preflightResponse(origin: string) {
  return new Response(null, {
    status: NO_CONTENT_STATUS,
    headers: { ...corsHeaders(origin), 'Access-Control-Allow-Methods': ALLOWED_METHODS },
  })
}
