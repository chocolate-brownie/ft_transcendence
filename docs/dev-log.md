# Developer Log

This log tracks the progress, challenges, and key decisions made throughout the development of the ft_transcendence project.

## February 3rd, 2026: Resolving Docker Permission Issues on Linux

**Author:** mgodawat

**Goal:** Get the initial Docker Compose setup running for local development.

### The Problem

The initial attempt to launch the application using `docker-compose up --build` failed. Both the `backend` and `frontend` services exited immediately after starting.

The logs pointed to a clear permissions issue: the `npm` process inside the containers could not read the `package.json` file.

```
npm error code EACCES
npm error syscall open
npm error path /usr/src/app/package.json
npm error [Error: Could not read package.json: Error: EACCES: permission denied, open '/usr/src/app/package.json']
```

This error was caused by a conflict between the file ownership on my host machine and the user running the process inside the container.

### Troubleshooting Steps

#### Attempt 1: Using a Non-Root User

My first thought was to follow Docker's security best practice of not running as `root`. I modified the `Dockerfile`s to use the `node` user, which is included in the official Node.js image.

- **Action:** Added `USER node` and used the `--chown=node:node` flag in `COPY` commands to transfer ownership of the files to the `node` user during the image build.
- **Outcome:** This failed with a different permission error. The `node` user did not have permission to create the `node_modules` directory inside the `/usr/src/app` directory, which was a volume mounted from my host. The host's permissions were preventing the container's user from writing to it.

#### Attempt 2: Running as the `root` User

For a local development setup, running as `root` is an acceptable workaround to bypass user permission complexities. I removed the `USER node` and `chown` commands to let the container run with the default `root` user.

- **Action:** Simplified the `Dockerfile`s to run all commands as `root`.
- **Outcome:** Surprisingly, this failed with the exact same `EACCES: permission denied` error as the very first attempt. The `root` user inside the container was still being denied access to the files on the host.

### The Solution: SELinux and the `:z` flag

The failure of the `root` user was the critical clue. It meant the issue wasn't about user permissions *inside* the container but was instead caused by a security policy on my host operating system. My host machine uses an SELinux (Security-Enhanced Linux) kernel module, which strictly isolates containers from the host file system by default.

To solve this, I needed to tell Docker to apply the correct SELinux label to the mounted volumes, allowing the container to access them.

- **Final Action:** I appended the `:z` flag to the volume mount definitions in my `docker-compose.yml` file.

```yaml
# docker-compose.yml (excerpt)
volumes:
  - ./backend:/usr/src/app:z
  - /usr/src/app/node_modules
```

- **Outcome:** This immediately resolved the issue. The `:z` flag instructed Docker to relabel the host directories, making them accessible to the container. The application started successfully.

### Key Takeaways for Today

- When debugging Docker permissions on Linux, if running as `root` in the container doesn't solve the problem, the cause is almost certainly a host-level security module like SELinux or AppArmor.
- The `:z` flag in a volume mount is the standard way to solve SELinux-related permission issues for development.
