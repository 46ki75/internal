import jwt from 'jsonwebtoken'
import { factory } from '~~/utils/Factory'

function verifyToken(token: string, secretKey: string): boolean {
  try {
    jwt.verify(token, secretKey) as string | jwt.JwtPayload
    return true
  } catch (_) {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const JWT_SECRET = await factory.getParameter('/internal/web/prod/jwt/secret')

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
    event.path !== '/up' &&
    event.path !== '/auth/login' &&
    event.path !== '/auth/logout'
  ) {
    setResponseStatus(event, 403)
    return { error: 'The token is not valid. Please login again.' }
  }
})
