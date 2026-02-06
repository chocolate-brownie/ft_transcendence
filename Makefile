NAME = ft_transcendence

all: up

up:
	@echo "Starting ${NAME}..."
	@docker-compose up -d

down:
	@echo "Stopping ${NAME}..."
	@docker-compose down

build:
	@echo "Building ${NAME}..."
	@docker-compose up -d --build

logs:
	@docker-compose logs -f

clean: down
	@echo "Cleaning containers..."
	@docker-compose down -v --remove-orphans

fclean: clean
	@echo "Deep cleaning (images, volumes)..."
	@docker-compose down --rmi all --volumes --remove-orphans

re: fclean all

.PHONY: all up down build logs clean fclean re
