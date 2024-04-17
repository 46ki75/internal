export default eventHandler((event) => {
  return { status: 'running', uptime: process.uptime(), path: event.path }
})
