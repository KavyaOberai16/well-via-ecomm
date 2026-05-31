# Deployment — CI/CD to AWS EC2 (GitHub Actions + GHCR)

Push to `main` → GitHub Actions builds the backend & frontend Docker images,
pushes them to **GHCR**, then SSHes into your **EC2** to pull the new images,
restart the stack, and run DB migrations. The app is served over **HTTP on the
EC2's public IP**.

```
GitHub push (main)
   └─ Actions: build backend img ─┐
                build frontend img ┘→ push to ghcr.io
   └─ Actions: ssh → EC2 → docker compose pull + up -d + alembic upgrade head
EC2 host:  [frontend+nginx :80] ──proxy──> [backend :8000] ──> existing MySQL
                                              [redis]            (external)
```

The database stays **external** (your current MySQL) — configured only in
`backend/.env` on the EC2. There is no MySQL container in production.

---

## 1. One-time: GitHub repository secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 public IP (e.g. `1.2.3.4`) |
| `EC2_USER` | SSH user — `ubuntu` (Ubuntu AMI) or `ec2-user` (Amazon Linux) |
| `EC2_SSH_KEY` | **Full contents** of the private key (`.pem`) you SSH in with |
| `EC2_APP_DIR` | App directory on the host, e.g. `/home/ubuntu/app` |
| `GHCR_PAT` | A GitHub **classic PAT** with the `read:packages` scope (used by the EC2 to pull images) |

> `GHCR_PAT`: GitHub → Settings → Developer settings → Personal access tokens →
> Tokens (classic) → Generate, tick **`read:packages`**. (Pushing from Actions
> uses the built-in `GITHUB_TOKEN`; the PAT is only for the EC2 to pull.)

---

## 2. One-time: EC2 host setup

SSH into the instance and run:

```bash
# --- Docker + compose plugin (Ubuntu) ---
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER      # then log out & back in (or: newgrp docker)

# --- App directory + production env ---
mkdir -p ~/app/backend
cd ~/app
# Create backend/.env from the template in the repo and FILL IT IN:
nano backend/.env        # paste backend/.env.production.example, set real values
```

Fill `backend/.env` (see `backend/.env.production.example`). Critical values:
- `SECRET_KEY` → run `openssl rand -hex 32` and paste the result
- `MYSQL_*` → **your existing DB connection** (keep current values)
- `MEDIA_BASE_URL`, `CORS_ORIGINS`, `FRONTEND_URL` → `http://<EC2-public-IP>`

> Make sure `EC2_APP_DIR` (the secret) matches this directory (`/home/ubuntu/app`).

### Security group
- **Inbound 80/tcp** open to `0.0.0.0/0` (public web).
- **Inbound 22/tcp** open to your IP (SSH).
- The EC2 must be able to reach your MySQL host/port (it already is —
  you're "already connected").

### GHCR package visibility
First successful pipeline run creates two private packages
(`simple-com-backend`, `simple-com-frontend`). The EC2 pulls them using
`GHCR_PAT` (handled automatically by the pipeline's `docker login`). If you'd
rather skip auth, set both packages to **Public** in GitHub → your profile →
Packages → each package → Package settings → Change visibility.

---

## 3. Deploy

```bash
git push origin main      # or run "Build & Deploy to EC2" from the Actions tab
```

Watch progress in the repo's **Actions** tab. On success the site is live at:

```
http://<EC2-public-IP>/          # storefront
http://<EC2-public-IP>/docs      # API docs
```

Every deploy is tagged by git SHA in GHCR, so deploys are reproducible.

---

## 4. Verify

```bash
ssh <user>@<EC2-IP>
cd ~/app
docker compose -f docker-compose.deploy.yml ps          # all "Up"/"healthy"
docker compose -f docker-compose.deploy.yml logs -f backend
curl -fsS http://localhost/api/v1/footer | head -c 200   # API reachable
```

---

## 5. Rollback

Images are tagged by commit SHA. To roll back to a previous good commit:

```bash
ssh <user>@<EC2-IP> && cd ~/app
IMAGE_TAG=<previous-git-sha> docker compose -f docker-compose.deploy.yml up -d
```

(Or revert the commit on `main` and let the pipeline redeploy.)

---

## 6. Migrations

The pipeline runs `alembic upgrade head` automatically each deploy (idempotent).
To run manually:

```bash
cd ~/app
docker compose -f docker-compose.deploy.yml exec -T backend alembic upgrade head
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Actions deploy step: `permission denied (publickey)` | `EC2_SSH_KEY` must be the **entire** private key incl. `-----BEGIN/END-----`. `EC2_USER` correct (`ubuntu` vs `ec2-user`). |
| EC2 `docker login` / pull fails | `GHCR_PAT` needs `read:packages`; or make the packages Public. |
| Site loads but images 404 | `MEDIA_BASE_URL` in `backend/.env` must equal `http://<EC2-IP>`; re-`up -d` the backend. |
| 413 on upload | Already handled (`client_max_body_size 20m` in the frontend nginx) — rebuild/pull the frontend image. |
| Backend can't reach DB | EC2 must reach your MySQL host/port; check the DB firewall/security group and `MYSQL_*` in `backend/.env`. |
| Port 80 unreachable | Open inbound 80 in the EC2 security group. |

---

## Adding a domain + HTTPS later

When you have a domain: point its DNS A-record at the EC2 IP, then either add
Caddy (automatic Let's Encrypt) in front, or run certbot with nginx. Update
`MEDIA_BASE_URL`, `CORS_ORIGINS`, `FRONTEND_URL` to `https://<domain>` and
redeploy. Ask and I'll wire it up.
