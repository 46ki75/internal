export default eventHandler((event) => {
  const headers = getHeaders(event)
  return headers
})
