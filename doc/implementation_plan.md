# Implementation Plan - ft_transcendence

## Goal: Classic Pong with Multiplayer & Social Features (14 Points)

This plan outlines the strategy to build a robust multiplayer Pong application, adhering to the 42 subject requirements and securing 14 evaluation points.

### Team Roles (Ref: Subject II.1.1)
*   **Product Owner (PO)**: Defines feature scope, prioritizes "14-point" modules, verifies final delivery.
*   **Project Manager (PM)**: Tracks progress against the 7-day timeline, manages the repo/tasks (GitHub Project/Issues).
*   **Tech Lead**: Sets up Docker, CI/CD, Repo structure, chooses libraries (NestJS, React, Prisma).
*   **Backend Developer**: Implements API, Auth, Database, WebSocket Gateway (NestJS).
*   **Frontend Developer**: Implements UI/UX, React Components, Game Canvas (React).
*   **Game Developer**: Specific focus on Game Loop, Physics, and visual rendering (Canvas/Three.js).

---

## Proposed Modules (14 Points Target)

| Category | Module | Points | Responsibility |
| :--- | :--- | :--- | :--- |
| **Web** | **Major**: Use Frameworks (React + NestJS) | 2 | Tech Lead / Fullstack |
| **Web** | **Minor**: User Management (Standard) | 2 | Backend / Frontend |
| **User Mgmt** | **Major**: Web-based Game (Pong) | 2 | Game Dev |
| **Gaming** | **Major**: Remote Players (Online 1v1) | 2 | Backend / Game Dev |
| **Gaming** | **Minor**: Game Customization | 1 | Game Dev |
| **Gaming** | **Minor**: Tournament System | 1 | Backend / PM |
| **User Mgmt** | **Minor**: Remote Auth (OAuth) | 1 | Backend |
| **Web** | **Minor**: Use Database ORM (Prisma) | 1 | Backend |
| **AI** | **Major**: AI Opponent | 2 | AI / Game Dev |

---

## Architecture

*   **Frontend**: React (Vite) + TailwindCSS
*   **Backend**: NestJS (Node.js) + Socket.io
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **DevOps**: Docker + Docker Compose

---

## Verification Plan

### Automated Tests
*   `npm run test` (Backend Unit Tests)
*   `npm run lint` (Code Quality)
*   `docker-compose up --build` (Full Integration Test)

### Manual Verification
*   **Deployment**: One-command setup checks.
*   **Browser**: Chrome compatibility check.
*   **Privacy**: Verify Policy/ToS pages exist.
*   **Gameplay**: Lag-free local and remote play.
