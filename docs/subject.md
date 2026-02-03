# 🏓 ft_transcendence

**The Final Showdown: Single Page Application & Pong Tournament**

---

## 📑 Table of Contents

1. [Overview](https://www.google.com/search?q=%23-overview)
2. [General Instructions](https://www.google.com/search?q=%23-general-instructions)
3. [Mandatory Part](https://www.google.com/search?q=%23-mandatory-part)

- [Tech Stack Constraints](https://www.google.com/search?q=%23-tech-stack-constraints)
- [Security & Infrastructure](https://www.google.com/search?q=%23-security--infrastructure)

4. [The Modules System](https://www.google.com/search?q=%23-the-modules-system)

- [🌐 Web](https://www.google.com/search?q=%23-web)
- [👤 User Management](https://www.google.com/search?q=%23-user-management)
- [🎮 Gameplay & Experience](https://www.google.com/search?q=%23-gameplay--experience)
- [🤖 AI & Algorithms](https://www.google.com/search?q=%23-ai--algorithms)
- [🔐 Cybersecurity](https://www.google.com/search?q=%23-cybersecurity)
- [🚀 DevOps](https://www.google.com/search?q=%23-devops)
- [🎨 Graphics](https://www.google.com/search?q=%23-graphics)
- [♿ Accessibility](https://www.google.com/search?q=%23-accessibility)
- [💾 Object Oriented](https://www.google.com/search?q=%23-object-oriented)

---

## 🌟 Overview

**Summary:** This project is about creating a website for a Pong contest. You will build a **Single Page Application (SPA)** that allows users to play Pong against each other in real-time.

- **Group Size:** 3 to 5 members.
- **Goal:** Build a solid infrastructure and add "Modules" to reach a required score.
- **Required Points:** You must validate modules worth at least **7 Major Modules** (or equivalent point value) to reach the goal.

> **⚠️ The Golden Rule:** Everything must run via a single command: `docker-compose up --build`.

---

## 🛠 General Instructions

- **Repository:** All code must be in a Git repository.
- **Errors:** No errors, warnings, or leaks are allowed.
- **Norm:** No Norminette! You are free to choose your coding style, but it must be clean and consistent.
- **Language:** The website must be in **English**.
- **Crash Policy:** If any container crashes or the app stops working during the defense, it is a fail (0).

---

## 💀 Mandatory Part

You must adhere to the following technical constraints. If you fail these, you get 0.

### 🧱 Tech Stack Constraints

- **Backend:** You must use **NestJS**.
- **Frontend:** You must use a TypeScript framework (**React**, Angular, Vue, etc.).
- **Database:** You must use **PostgreSQL**.
- **Language:** The entire codebase must be written in **TypeScript**.
- **SPA:** The website must be a Single Page Application. The "Back" and "Forward" buttons of the browser must work correctly (History API).

### 🔒 Security & Infrastructure

- **Docker:** Everything must run in containers (docker-compose).
- **Ports:**
- Allowed: `80`, `443`, `3000`, or specific framework ports (e.g., `5173`).
- Everything else must be blocked or internal.

- **Passwords:** Any password stored in the database must be **hashed**.
- **Sanitization:** Protection against SQL Injection and XSS is mandatory.
- **Validation:** Any form input must be validated on the backend.
- **Secrets:** API keys and credentials must be stored in `.env` files (do not commit them!).

---

## 📦 The Modules System

You start with **0 Points**. You need to select modules to reach the passing grade.

- **Minor Module:** 0.5 - 1 Point (Small features).
- **Major Module:** 2+ Points (Complex features).

---

### 🌐 Web

_Focus on Frameworks and Browser compatibility._

| Module                              | Type      | Description                                                                                             |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| **Use a Framework as Microservice** | **Major** | Use a different framework/language for a specific microservice (not the main backend).                  |
| **Standard User Management**        | **Major** | Users can sign up, login, upload avatar, add friends, check profiles, and see game stats (wins/losses). |
| **Remote Players**                  | **Major** | Ability to play online via WebSockets (not just locally on one keyboard).                               |
| **Multiplayer (4+ players)**        | **Minor** | Support for a Battle Royale or Tournament mode with more than 2 players.                                |
| **Add Another Language**            | **Minor** | Support multiple languages (French, Spanish, etc.) switchable on the site.                              |

---

### 👤 User Management

_Focus on Auth and Socials._

| Module                    | Type      | Description                                                                       |
| ------------------------- | --------- | --------------------------------------------------------------------------------- |
| **Standard Auth**         | **Major** | Secure login system (Session/JWT), Avatar upload, Friend system, Profile viewing. |
| **Remote Authentication** | **Major** | "Login with 42", "Login with Google", etc. (OAuth2).                              |
| **Two-Factor Auth (2FA)** | **Major** | Use Google Authenticator or SMS/Email for 2FA.                                    |

---

### 🎮 Gameplay & Experience

_Focus on the Pong implementation._

| Module                 | Type      | Description                                                                            |
| ---------------------- | --------- | -------------------------------------------------------------------------------------- |
| **Server-Side Pong**   | **Major** | The ball logic/physics runs on the Backend (authoritative server) to prevent cheating. |
| **Live Chat**          | **Major** | Global chat, Direct Messages (DM), Blocking users, Inviting to play via chat.          |
| **Game Customization** | **Minor** | Power-ups, different maps, different ball colors/skins.                                |

---

### 🤖 AI & Algorithms

_Focus on Bots and Stats._

| Module                       | Type      | Description                                                      |
| ---------------------------- | --------- | ---------------------------------------------------------------- |
| **Introduce an AI Opponent** | **Major** | A bot player. It must be decent (not just random movement).      |
| **User & Game Stats Dash**   | **Minor** | Detailed dashboard: Win rates, timestamps, match history graphs. |

---

### 🔐 Cybersecurity

_Focus on Hardening._

| Module                | Type      | Description                                                           |
| --------------------- | --------- | --------------------------------------------------------------------- |
| **WAF / ModSecurity** | **Major** | Implement a Web Application Firewall.                                 |
| **GDPR Compliance**   | **Minor** | Options to see all my data, download it, or anonymize/delete account. |
| **JWT Authorization** | **Major** | Secure token-based auth implementation.                               |

---

### 🚀 DevOps

_Focus on Deployment and Monitoring._

| Module                              | Type      | Description                                                                                     |
| ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| **Infrastructure Setup**            | **Major** | Using Docker Compose, Environment Variables, Setup Scripts (this is usually Mandatory/Default). |
| **Microservices**                   | **Major** | Splitting the backend into distinct services (Auth Service, Game Service, Chat Service).        |
| **Monitoring (Prometheus/Grafana)** | **Major** | Visualize server load, requests per second, database health.                                    |
| **Log Management (ELK)**            | **Major** | ElasticSearch, Logstash, Kibana setup for logs.                                                 |

---

### 🎨 Graphics

_Focus on 3D and Visuals._

| Module                | Type      | Description                                                                     |
| --------------------- | --------- | ------------------------------------------------------------------------------- |
| **3D Pong (ThreeJS)** | **Major** | The game is rendered in 3D (using Three.js or Babylon.js) instead of 2D Canvas. |

---

### ♿ Accessibility

_Focus on usability for all._

| Module                            | Type      | Description                                                                        |
| --------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| **Server-Side Rendering (SSR)**   | **Major** | Use Next.js (or similar) to render pages on the server for better SEO/Performance. |
| **Browser Compatibility**         | **Minor** | Ensure the site works perfectly on Firefox, Chrome, Safari, and Edge.              |
| **Accessibility (Screen Reader)** | **Minor** | Compliance with WCAG (Screen readers, high contrast mode, keyboard navigation).    |

---

### 💾 Object Oriented

_Focus on Code Quality._

| Module                           | Type      | Description                                                                            |
| -------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| **Replacing Imperative with OO** | **Major** | Designing the entire backend using strict Object-Oriented patterns (SOLID principles). |

---

### 🏆 Grading Scheme

- **0 Points:** If Mandatory part fails.
- **Points Calculation:** Sum of all validated modules.
- **100% Grade:** You need at least **14 points** worth of modules.

> _Good luck, and may the code be with you!_ 🚀
