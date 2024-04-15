import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export default eventHandler(async (event) => {
  const body = await readBody(event)
  if (!('password' in body)) {
    setResponseStatus(event, 400)
    return { error: `The request body does not contain a 'password'.` }
  }

  if (typeof body.password !== 'string') {
    setResponseStatus(event, 400)
    return {
      error: `The type of 'password' must be a string. The received type is a ${typeof body.password}.`
    }
  }

  const { password }: { password: string } = body

  // TODO: implement password fetching logic
  const isPasswordValid = await verifyPassword(
    password,
    '$2b$10$Xv6CUXdioRNorkVQrTbVbOdMR77MQTUxJ.EGxi0szWd2EaelJM8B6'
  )

  if (!isPasswordValid) {
    setResponseStatus(event, 503)
    return { error: `Password is invalid.` }
  }

  const EXPERS_IN = 7 // [days]
  const JWT_SECRET = process.env.JWT_SECRET

  if (JWT_SECRET == null) {
    setResponseStatus(event, 500)
    return {
      error: `The secret key for JSON Web Token was not found.`
    }
  }

  const token = jwt.sign({}, JWT_SECRET, { expiresIn: `${EXPERS_IN}d` })

  setCookie(event, 'token', token, {
    maxAge: EXPERS_IN * 24 * 60 * 60,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development'
  })

  return { message: 'LOGIN SUCCESS' }
})
