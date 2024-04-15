import bcrypt from 'bcrypt'

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  return hashedPassword
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

  return { result: await hashPassword(password) }
})
