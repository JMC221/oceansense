# Local development

This is an academic prototype. Use a disposable local database and sample accounts. The backend currently permits requests without server-side authorisation; do not expose it as a live public service.

## Requirements

- Java 21 (as specified by back-end/pom.xml), Node.js compatible with Vite 7, and npm.
- PostgreSQL with PostGIS available. Create an empty `oceansense` database; its user needs permission to enable PostGIS, or enable it yourself first.

## Backend (PowerShell)

Set these in the terminal where you run the backend, using your own local database password:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/oceansense"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "YOUR_LOCAL_DATABASE_PASSWORD"
cd back-end
.\mvnw.cmd spring-boot:run
```

On macOS/Linux, export the same variables, then use `sh ./mvnw spring-boot:run`. The SQL initialisation configuration creates the schema and reference data. No shared database or demo login credentials are supplied. Create a sample Manager through `POST /api/users` using the fields in `User.java`; choose your own password. This endpoint hashes it before storage.

## Frontend (separate terminal)

```text
cd front-end
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). Vite proxies `/api` to the backend on port 8080.

The original optional tunnel script is included for reference. Its token and optional hostname now come from `.env` (see `.env.example`); the normal local commands above do not start it. Review backend access controls before enabling any remote access.

## Verification scope

The publication copy was checked for excluded files, exposed configuration values and JSON/XML syntax. It was not started against a database or subjected to a new end-to-end test run. The case study describes checks performed during the original project.
