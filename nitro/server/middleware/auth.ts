import jwt from 'jsonwebtoken'

function verifyToken(token: string, secretKey: string): boolean {
  try {
    jwt.verify(token, secretKey) as string | jwt.JwtPayload
    return true
  } catch (_) {
    return false
  }
}

export default defineEventHandler((event) => {
  const JWT_SECRET = process.env.JWT_SECRET

  if (JWT_SECRET == null) {
    setResponseStatus(event, 500)
    return {
      error: `The secret key for JSON Web Token was not found.`
    }
  }

  const token = getCookie(event, 'token')
  const isValid = verifyToken(token, JWT_SECRET)

  if (
    !isValid &&
    event.path !== '/api/auth/login' &&
    event.path !== '/api/auth/logout'
  ) {
    setResponseStatus(event, 403)
    return { error: 'The token is not valid. Please login again.' }
  }
})
