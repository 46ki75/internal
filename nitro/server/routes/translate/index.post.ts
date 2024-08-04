import OpenAI from 'openai'
import { factory } from '~~/utils/Factory'

const prompt = `Please translate the following Japanese into natural English.`

export default eventHandler(async (event) => {
  const body = await readBody(event)
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
        content: body.message
      }
    ],
    model: 'gpt-4o'
  })

  const result = completion.choices[0].message.content

  return { result }
})
