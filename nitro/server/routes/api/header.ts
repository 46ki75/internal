export default eventHandler((event) => {
  const headers = getHeaders(event)
  if ('cookie' in headers) {
    const { cookie, ...header } = headers
    return header
  }
  return headers
})
