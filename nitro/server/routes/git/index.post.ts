import OpenAI from 'openai'
import { factory } from '~~/utils/Factory'

const prompt = `
You are an assistant that converts received Japanese messages into English Git commit messages.
Git commit messages must follow the Conventional Commits format and be in English.

The basic format of Conventional Commits is as follows:

<type>[optional scope]: <description>

## type
- feat: New feature
- fix: Bug fix
- docs: Documentation update
- style: Changes to code style and format
- refactor: Refactoring
- test: Addition or modification of tests
- chore: Changes to the build process or auxiliary tools

## scope
Optionally, this part specifically indicates the range affected by the changes. For example, the name of a particular module or component might be included.

## Description
Briefly describe the contents of the commit.
`

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
    model: 'gpt-3.5-turbo'
  })

  const result = completion.choices[0].message.content

  return { result }
})
