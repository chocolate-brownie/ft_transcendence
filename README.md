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

Setting up a Docker development environment can sometimes present challenges, from host-specific permission errors (often due to security features like SELinux) to application startup failures inside the container.

We have documented the process of diagnosing and resolving these initial setup issues in our developer log. If you encounter errors like `EACCES: permission denied` or `ERR_CONNECTION_REFUSED` when trying to run the project, please refer to the detailed troubleshooting guide:

- **[Developer Log: Docker Setup & Troubleshooting](./docs/dev-log.md)**
