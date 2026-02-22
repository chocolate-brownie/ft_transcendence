# Database Management with Prisma Studio

This guide explains how to use **Prisma Studio**, a visual editor for our PostgreSQL database.

## 🚀 Quick Start

1.  **Ensure the app is running:**
    ```bash
    make up
    ```

2.  **Start the Studio:**
    Run this command in a separate terminal window:
    ```bash
    make db-studio
    ```

3.  **Open in Browser:**
    Go to **[http://localhost:5555](http://localhost:5555)**

4.  **Stop:**
    Press `Ctrl + C` in the terminal to stop the studio.

---

## 🛠 What is Prisma Studio?

Prisma Studio is a GUI (Graphical User Interface) that lets you:
- **View all data** in the database (Users, Games, Messages, etc.).
- **Create, edit, and delete** records manually (like a spreadsheet).
- **Visualize relationships** between tables.

It is extremely useful for debugging, checking if users are being created correctly, or manually clearing data during development.

## ⚙️ Configuration Details

To make this work in our Docker environment, the following change was made to `docker-compose.yml`:

```yaml
  backend:
    # ...
    ports:
      - "3000:3000"
      - "5555:5555"  <-- Added this line
```

This maps port `5555` inside the backend container (where Prisma Studio runs) to port `5555` on your host machine.

## ⚠️ Troubleshooting

**"Port 5555 is already in use"**
If `make db-studio` fails, check if you have another instance running.
Run `lsof -i :5555` (Mac/Linux) to see what's using the port.

**"Connection refused"**
Ensure the backend container is running first.
Run `make up` before starting the studio.
