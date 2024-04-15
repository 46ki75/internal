export default eventHandler(async (event) => {
  deleteCookie(event, 'token')
  return { message: 'LOGOUT SUCCESS' }
})
