function handler(event) {
  var request = event.request
  var uri = request.uri

  if (!uri.includes('.')) {
    request.uri += uri.endsWith('/') ? 'index.html' : '/index.html'
  }

  return request
}
