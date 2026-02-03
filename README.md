# ft_transcendence

This document outlines the setup and configuration for the ft_transcendence project.

## Project Setup

The project is containerized using Docker and managed with Docker Compose. It consists of three main services:

- `db`: A PostgreSQL database.
- `backend`: A NestJS application.
- `frontend`: A React/Vite application.

The intended setup uses volume mounts to sync local source code with the code inside the containers for a smooth development experience.

To start the application, run:

```bash
docker-compose up --build
```

## Docker for Local Development

Setting up a Docker development environment on Linux can sometimes lead to file permission issues between the host machine and the container. This is often due to security features like SELinux.

We have documented the process of diagnosing and resolving these issues in our developer log. If you encounter any `EACCES: permission denied` errors when running `docker-compose up`, please refer to the detailed troubleshooting guide:

- **[Developer Log: Resolving Docker Permission Issues](./docs/dev-log.md)**
