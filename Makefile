# **************************************************************************** #
#    ft_transcendence - Makefile                                               #
# **************************************************************************** #

NAME		= ft_transcendence
COMPOSE		= docker compose
-include .env

# Colors
GREEN		= \033[0;32m
YELLOW		= \033[0;33m
RED			= \033[0;31m
RESET		= \033[0m

# ── Default target ──────────────────────────────────────────────────────────

all: build up		## Build and start all containers

# ── Core commands ───────────────────────────────────────────────────────────

build:				## Build all Docker images
	@echo "$(GREEN)Building images...$(RESET)"
	$(COMPOSE) build

up:					## Start containers (detached)
	@echo "$(GREEN)Starting $(NAME)...$(RESET)"
	$(COMPOSE) up -d
	@echo "$(GREEN)✔ Frontend : https://localhost:5173$(RESET)"
	@echo "$(GREEN)✔ Backend  : https://localhost:3000$(RESET)"
	@echo "$(GREEN)✔ Database : localhost:5432$(RESET)"

down:				## Stop containers (keep volumes)
	@echo "$(YELLOW)Stopping $(NAME)...$(RESET)"
	$(COMPOSE) down

stop:				## Stop without removing containers
	$(COMPOSE) stop

start:				## Start stopped containers
	$(COMPOSE) start

# ── Cleanup ─────────────────────────────────────────────────────────────────

clean: down			## Stop + remove containers and networks
	@echo "$(RED)Cleaning containers...$(RESET)"

fclean: clean		## Remove everything: containers, volumes, images
	@echo "$(RED)Full clean: removing volumes and images...$(RESET)"
	$(COMPOSE) down -v --rmi all --remove-orphans 2>/dev/null || true
	@echo "$(RED)✔ All cleaned.$(RESET)"

re: fclean all		## Full rebuild from scratch

# ── Utilities ───────────────────────────────────────────────────────────────

logs:				## Show live logs (all services)
	$(COMPOSE) logs -f

logs-back:			## Show backend logs only
	$(COMPOSE) logs -f backend

logs-front:			## Show frontend logs only
	$(COMPOSE) logs -f frontend

logs-db:			## Show database logs only
	$(COMPOSE) logs -f db

ps:					## Show running containers
	$(COMPOSE) ps

shell-back:			## Open shell in backend container
	$(COMPOSE) exec backend sh

shell-front:		## Open shell in frontend container
	$(COMPOSE) exec frontend sh

shell-db:			## Open psql in database container
	$(COMPOSE) exec db psql -U $${POSTGRES_USER:-myuser} -d $${POSTGRES_DB:-transcendence}

# ── Database ────────────────────────────────────────────────────────────────

db-migrate:			## Run Prisma migrations + regenerate client (container + host)
	$(COMPOSE) exec backend npx prisma migrate dev
	cd backend && npx prisma generate

db-generate:		## Regenerate Prisma client (container + host)
	$(COMPOSE) exec backend npx prisma generate
	cd backend && npx prisma generate

db-studio:			## Open Prisma Studio (DB browser)
	$(COMPOSE) exec backend npx prisma studio

db-seed:			## Seed the database
	$(COMPOSE) exec backend npx prisma db seed

db-reset:			## Reset database (drop all data, re-apply migrations)
	$(COMPOSE) exec backend npx prisma migrate reset --force

# ── Test Data ──────────────────────────────────────────────────────────────

PSQL = $(COMPOSE) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c

seed-users:			## Create 4 test users (Alice, Bob, John, Sarah — pw: Test1234!)
	$(COMPOSE) exec backend npx tsx prisma/seed-users.ts

seed-tournament:	## Create a 4-player tournament from a random user
	$(COMPOSE) exec backend npx tsx prisma/seed-tournament.ts

nuke-tournaments:	## Delete all tournaments, matches, participants, and tournament games
	@echo "$(RED)Deleting all tournaments...$(RESET)"
	@$(PSQL) "DELETE FROM tournament_matches; DELETE FROM tournament_participants; DELETE FROM games WHERE game_type = 'TOURNAMENT'; DELETE FROM tournaments;"
	@echo "$(GREEN)✔ All tournaments deleted.$(RESET)"

nuke-users:			## Delete all users (cascades games, friends, messages, tournaments)
	@echo "$(RED)Deleting all users...$(RESET)"
	@$(PSQL) "TRUNCATE users CASCADE;"
	@echo "$(GREEN)✔ All users deleted.$(RESET)"

nuke-all:			## Delete everything (users + tournaments + games)
	@echo "$(RED)Nuking all data...$(RESET)"
	@$(PSQL) "TRUNCATE users CASCADE;"
	@echo "$(GREEN)✔ All data deleted.$(RESET)"

fresh-test:			## Full reset: nuke all → seed 4 users → create tournament
	@$(MAKE) --no-print-directory nuke-all
	@$(MAKE) --no-print-directory seed-users
	@$(MAKE) --no-print-directory seed-tournament

# ── Help ────────────────────────────────────────────────────────────────────

help:				## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

.PHONY: all build up down stop start clean fclean re \
        logs logs-back logs-front logs-db ps \
        shell-back shell-front shell-db \
        db-migrate db-generate db-studio db-seed db-reset \
        seed-users seed-tournament \
        nuke-tournaments nuke-users nuke-all fresh-test help
