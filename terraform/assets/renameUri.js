function handler(event) {
	const request = event.request;
	const uri = request.uri;

	if (!uri.includes(".")) {
		request.uri += uri.endsWith("/") ? "index.html" : "/index.html";
	}

	return request;
}
