web-install:
	cd web && npm install

dev-up: web-install
	export UID=$(id -u)
	export GID=$(id -g)
	docker-compose -f docker-compose.dev.yml up -d --build

dev-up-log: web-install
	export UID=$(id -u)
	export GID=$(id -g)
	docker-compose -f docker-compose.dev.yml up --build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d --build

prod-up-log:
	docker-compose -f docker-compose.prod.yml up --build

dev-down:
	docker-compose -f docker-compose.dev.yml down

prod-down:
	docker-compose -f docker-compose.prod.yml down
