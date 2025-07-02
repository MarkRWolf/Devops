# DevOps Monitoring Dashboard

A self-hosted, containerized dashboard for monitoring your pipelines. Runs locally via Docker Compose or in Azure Container Apps.

---

## 1. ASP .NET Core API (`Devops/`)

- **Framework**: .NET 8 Web API with ASP NET Core Identity & EF Core
- **Authentication**:
  - Issues a JWT in an HTTP-only cookie on signup/login
  - Validates only requests forwarded by the Next.js frontend
- **Endpoints** under `/API/*` everything else is proxied to nextjs
- **Runs on** port **5205**
- **Dockerfile**: multi-stage build, publishes to `/app/out`

---

## 2. Next.js 15 Frontend (`client/`)

- **Rendering**: Full SSR — data fetched on the server, HTML hydrated for interactivity
- **API proxy**:
  - Frontend calls `/account/*` with `credentials: 'include'`
  - Nginx routes `/API/*` → .NET API, all other traffic → Next.js
- **Runs on** port **3000**
- **Dockerfile**: installs deps, builds static assets, runs production server

---

## 3. Nginx Reverse Proxy (`nginx.conf`)

```nginx
server {
  listen 80;
  server_name _;

  location /API/ {
    proxy_pass http://server:5205;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://client:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}


```
