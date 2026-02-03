# Developer Log

This log tracks the progress, challenges, and key decisions made throughout the development of the ft_transcendence project.

## February 3rd, 2026: Initial Docker Setup & Troubleshooting

**Author:** mgodawat

**Goal:** Get the initial Docker Compose setup running for local development.

### Part 1: Resolving Host Permission Errors

The initial attempt to launch the application using `docker-compose up --build` failed with `EACCES: permission denied` errors on `package.json`. This was due to a conflict between file ownership on my host machine and the user inside the container.

- **Initial Diagnosis:** A classic user permission problem inside the container.
- **Troubleshooting:**
  1.  **Attempted running as `node` user:** This failed because the non-root user couldn't create `node_modules` in the host-mounted volume.
  2.  **Attempted running as `root` user:** This also failed, which was unexpected and pointed to a deeper issue.
- **Root Cause:** The host machine's SELinux (Security-Enhanced Linux) policy was preventing the container, even as root, from accessing the mounted volume.
- **Solution:** Appended the `:z` flag to the volume definitions in `docker-compose.yml` to have Docker apply the correct SELinux context to the host directories.

### Part 2: Fixing the Frontend Service Startup

After resolving the host permission issues, the backend service started correctly, but the frontend service was unreachable at `http://localhost:5173` with an `ERR_CONNECTION_REFUSED` error.

- **Diagnosis:** I checked the container's logs using `docker logs ft_transcendence-frontend-1`.
- **Root Cause:** The logs showed a clear error message: `You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+.`. The version of Vite in the project was incompatible with the `node:18-alpine` image specified in the `Dockerfile`.
- **Solution:** I updated the `FROM` instruction in both the `frontend/Dockerfile` and `backend/Dockerfile` to use a newer version of Node.js.

  ```dockerfile
  # Before
  FROM node:18-alpine

  # After
  FROM node:20-alpine
  ```

- **Outcome:** After rebuilding the images (`docker-compose up --build`), the Vite development server started successfully, and the frontend application became accessible in the browser.
