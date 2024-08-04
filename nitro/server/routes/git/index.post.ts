import OpenAI from 'openai'
import { factory } from '~~/utils/Factory'

const prompt = `
You are an assistant that converts received Japanese messages into English Git commit messages.
Git commit messages must follow the Conventional Commits format and be in English.

The basic format of Conventional Commits is as follows:

<type>[optional scope]: <description>
`

export default eventHandler(async (event) => {
  const body = await readBody(event)

  if (!('type' in body)) {
    setResponseStatus(event, 400)
    return { error: `The request body does not contain a 'type'.` }
  }

  if (!('scope' in body)) {
    setResponseStatus(event, 400)
    return { error: `The request body does not contain a 'type'.` }
  }

  if (!('message' in body)) {
    setResponseStatus(event, 400)
    return { error: `The request body does not contain a 'message'.` }
  }

  const openai = new OpenAI({
    apiKey: await factory.getParameter(
      `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/openai/secret`
    )
  })

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: `
        type: ${body.type}
        scope: ${body.scope === '' ? 'NONE' : body.scope}
        changes:
        ${body.message}
        `
      }
    ],
    model: 'gpt-4o'
  })

  const result = completion.choices[0].message.content

  return { result }
})
