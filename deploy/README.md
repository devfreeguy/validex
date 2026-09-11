# Validex API - OCI deployment

Deploys `apps/api` (only) as two GHCR images — `validex-api` (the running
service) and `validex-migrator` (a one-shot `prisma migrate deploy` runner)
— to the shared OCI VM at `129.213.16.57`.

## First-time server setup

```bash
sudo mkdir -p /opt/apps/validex/scripts
sudo chown "$USER":"$USER" /opt/apps/validex -R
```

Copy the compose file and scripts (the GitHub Actions deploy job does this
automatically on every push; do it manually once to bootstrap):

```bash
scp deploy/compose.yml   user@129.213.16.57:/opt/apps/validex/compose.yml
scp deploy/scripts/*.sh  user@129.213.16.57:/opt/apps/validex/scripts/
chmod +x /opt/apps/validex/scripts/deploy.sh
```

Create the real env file from the template — never committed, never synced
by CI:

```bash
cp deploy/.env.example /opt/apps/validex/.env
chmod 600 /opt/apps/validex/.env
# edit /opt/apps/validex/.env and fill in every REPLACE_ME
```

Seed `image.env` so the first deploy has something to compare against /
roll back to:

```bash
cat > /opt/apps/validex/image.env <<'EOF'
IMAGE_OWNER=devfreeguy
REPO_NAME=validex
IMAGE_TAG=latest
EOF
chmod 600 /opt/apps/validex/image.env
```

### Systemd unit

Mirrors `sitelenz.service` — starts the API after the shared `postgres` /
`redis` infra is up, and after Docker itself.

`/etc/systemd/system/validex.service`:

```ini
[Unit]
Description=Validex API
After=docker.service infra.service
Requires=docker.service
Wants=infra.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/apps/validex
EnvironmentFile=/opt/apps/validex/image.env
ExecStart=/usr/bin/docker compose -f /opt/apps/validex/compose.yml up -d
ExecStop=/usr/bin/docker compose -f /opt/apps/validex/compose.yml down

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now validex.service
```

### Caddy

Add to the shared Caddyfile:

```
api.validex.space {
    reverse_proxy 127.0.0.1:3003
}
```

```bash
sudo systemctl reload caddy
```

### GitHub repository secrets

| Secret | Purpose |
| --- | --- |
| `SERVER_HOST` | `129.213.16.57` |
| `SERVER_USER` | SSH user for the deploy |
| `SERVER_KEY` | SSH private key for that user |
| `GHCR_USER` | GitHub account the VM uses to `docker pull` from GHCR (`devfreeguy`) |
| `GHCR_TOKEN` | A GHCR read-scoped PAT for `GHCR_USER` |

`GITHUB_TOKEN` (built in) is used by the workflow itself to *push* images;
`GHCR_USER`/`GHCR_TOKEN` are separate credentials the VM uses to *pull* them.

## Normal deploys

Push to `main`, or run the `Deploy Production` workflow manually. The
pipeline:

1. `verify` — installs and builds/lints/tests `apps/api` only.
2. `build-and-push` — builds `validex-api` and `validex-migrator` for
   `linux/amd64,linux/arm64`, pushes both to GHCR, confirms both
   architectures exist in both manifests.
3. `deploy` — syncs `deploy/compose.yml` and `deploy/scripts/` to the VM
   (never `.env`) and runs `scripts/deploy.sh`, which:
   - pulls both images (aborts if either pull fails),
   - runs the migrator once against `DATABASE_DIRECT_URL` (aborts before
     touching the running API container if migration fails),
   - recreates `validex-api`,
   - polls `http://localhost:3003/v1/health` until it passes,
   - only then atomically rewrites `image.env` with the new tag,
   - prunes dangling images so old layers don't fill the disk.

## Rollback

`image.env` on the VM always records the last **successfully deployed**
tag. To roll back to a known-good previous tag (e.g. a prior commit SHA
from the GHCR package page or workflow run history):

```bash
ssh user@129.213.16.57
sudo -i
IMAGE_OWNER=devfreeguy REPO_NAME=validex IMAGE_TAG=<previous-sha> \
  GHCR_USER=devfreeguy GHCR_TOKEN=<pat> \
  /opt/apps/validex/scripts/deploy.sh
```

This runs the same pull → migrate → recreate → health-check → record
sequence as a normal deploy, just pinned to the older tag. Because
migrations only ever run forward (`prisma migrate deploy` applies pending
migrations, it does not revert them), a rollback that needs to undo a
schema change requires a manual down-migration first — the migrator image
alone cannot reverse a migration.
