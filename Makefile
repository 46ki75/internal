dev-up:
	docker-compose -f docker-compose.dev.yml up -d --build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d --build

dev-down:
	docker-compose -f docker-compose.dev.yml down

prod-down:
	docker-compose -f docker-compose.prod.yml down
