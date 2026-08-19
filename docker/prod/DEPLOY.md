# Deploying to an AWS instance

A single EC2 host running the whole stack under Docker Compose: Caddy terminates TLS, the API,
PostgreSQL and Redis sit behind it on a private compose network. Nothing but 80/443 is reachable
from the internet.

Steps 1–9 are the one-time setup. Step 10 onwards is what you repeat on every release.

> **Before you start.** There is no migration tooling in this repo yet — `../local/db/schema.sql`
> is applied once, against an empty volume, and never again. Until migrations exist, every schema
> change after the first deploy is a manual `psql` session against production. Treat that as a
> known gap, not as the intended workflow.

---

## 1. Instance

|         |                                            |
| ------- | ------------------------------------------ |
| Type    | `t4g.small` (2 vCPU, 2 GB, arm64/Graviton) |
| AMI     | Ubuntu Server 24.04 LTS, **arm64**         |
| Storage | 20 GB gp3                                  |

`t4g` is arm64, which matches an Apple Silicon laptop — images build natively on both sides with
no emulation. It is also cheaper than the equivalent `t3`.

2 GB rather than 1: the postgres settings in `compose.yaml` are sized for 1 GB, but the API, Redis
and Caddy share that same GB, and the monitoring stack adds five more containers. 1 GB works only
without monitoring and with nothing else running.

## 2. Security group

| Direction | Port    | Source                          |
| --------- | ------- | ------------------------------- |
| Inbound   | 22/tcp  | your IP only, never `0.0.0.0/0` |
| Inbound   | 80/tcp  | `0.0.0.0/0`                     |
| Inbound   | 443/tcp | `0.0.0.0/0`                     |
| Inbound   | 443/udp | `0.0.0.0/0` (HTTP/3)            |
| Outbound  | all     | anywhere                        |

Port 80 has to stay open **after** the certificate is issued: Let's Encrypt renews over the same
HTTP-01 challenge every ~60 days.

Postgres (5432) and Redis (6379) are deliberately absent — neither is published to the host, so
there is nothing to open. Alloy's UI is bound to `127.0.0.1` and reached over an SSH tunnel.

## 3. Elastic IP and DNS

Allocate an Elastic IP and associate it with the instance, otherwise a stop/start changes the
public address and breaks both DNS and the certificate.

Create an `A` record for `API_DOMAIN` pointing at that IP, and **verify it resolves before the
first start**:

```bash
dig +short api.example.com
```

Caddy asks Let's Encrypt for a certificate the moment it starts. If the name does not resolve yet,
the challenge fails, and repeated failures count against the rate limit (5 failed authorisations
per hostname per hour).

## 4. Base packages and Docker

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER   # log out and back in for this to take effect
sudo systemctl enable --now docker
```

Unattended security updates, so the host does not rot between deploys:

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 5. Swap

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl -w vm.swappiness=10 && echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
```

Not for normal operation — for the moment something spikes. Without swap the kernel OOM-killer
picks a victim, and on this host the largest resident process is usually PostgreSQL.

## 6. Clone the repository

The compose files bind-mount `./Caddyfile`, `../local/db/schema.sql` and
`./monitoring/alloy/config.alloy` from disk, so the repository has to be present even when the
image comes from a registry.

```bash
git clone https://github.com/<user>/intelligent_finance_tool.git ~/app
cd ~/app
```

For a private repository, add a **read-only deploy key** to the GitHub repo rather than putting a
personal SSH key on the instance.

## 7. Fill in `.env`

```bash
cp docker/prod/.env.example docker/prod/.env
chmod 600 docker/prod/.env
```

Generate the secrets — three separate JWT secrets and two passwords:

```bash
for v in JWT_SECRET JWT_LONG_SECRET JWT_RESET_SECRET; do echo "$v=$(openssl rand -hex 64)"; done
echo "DB_PASS=$(openssl rand -hex 32)"
echo "REDIS_PASSWORD=$(openssl rand -hex 32)"
```

**Use hex, not base64, for the two passwords.** `DB_PASS` is interpolated into a connection URL by
the postgres-exporter (`postgresql://user:pass@postgres:5432/db`), where `@ : / # ?` change the
meaning of the URL; and Compose expands `${...}` inside `.env` values, so a `$` in a password is
eaten before anything sees it. Hex avoids both problems.

The remaining `[fill]` values in `.env.example` — `MAIL_NO_REPLY`, `AWS_REGION`,
`RATE_PROVIDER_API`, `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `SENTRY_DSN` — do not block startup,
but the features they drive stay broken while they are empty.

## 8. IAM role and SES

Attach an **instance role** to the EC2 instance with permission to send mail:

```json
{
    "Version": "2012-10-17",
    "Statement": [{ "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "*" }]
}
```

With a role attached, leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` empty — the SDK picks
the role up by itself and no static key exists on disk to leak.

In SES: verify the domain (or at least the `MAIL_NO_REPLY` address), and **request production
access**. A new SES account is in the sandbox, where mail can only be sent to verified addresses —
registration and password reset will silently fail for every real user until that request is
approved, which takes a day or so. Do it early.

## 9. First start

The image should come from a registry, not from a build on this host: building here means a full
`pnpm install` plus compiling `argon2` from source, twice, on a 2 GB box.

Build it on your machine (or in CI) and push:

```bash
make push-prod PROD_REGISTRY=ghcr.io/<user> PROD_PLATFORM=linux/arm64
```

`PROD_PLATFORM` must match the instance: `linux/arm64` for `t4g`, `linux/amd64` for `t3`/`t2`. A
mismatch only surfaces at runtime, as `exec format error`.

The target tags the image with the current git sha and prints the three lines to put in `.env` on
the instance:

```
SERVER_IMAGE=ghcr.io/<user>/tenpercent-server
SERVER_IMAGE_TAG=<sha>
SENTRY_RELEASE=<sha>
```

A `-dirty` suffix on the tag means the image was built from uncommitted changes. Fine while
experimenting, never for a release — there is no commit to go back to.

Then, on the instance:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <user> --password-stdin   # private registry only
docker compose -f docker/prod/compose.yaml pull
docker compose -f docker/prod/compose.yaml up -d --no-build
```

`--no-build` matters. The `server` service still carries a `build:` section, so without it Compose
silently falls back to building from source whenever the tag is missing locally — exactly what
this step is avoiding. (`make start-prod` passes it too, but that target is for trying the
production stack on a laptop — it neither pulls nor updates the tag, so it is not a deploy.)

On this first start Postgres initialises the volume: it creates the role and database from
`DB_USER`/`DB_PASS`/`DB_NAME` and runs `schema.sql`. That happens **once**. On every later start
those variables are ignored and the credentials come from the volume.

### Verify

```bash
docker compose -f docker/prod/compose.yaml ps          # every service `healthy`
docker compose -f docker/prod/compose.yaml logs caddy  # certificate obtained
curl -sS https://api.example.com/                      # -> Hello World!!!
```

If Caddy is retrying the challenge, the cause is almost always DNS (step 3) or a closed port 80
(step 2).

### Monitoring (optional)

```bash
docker compose -f docker/prod/compose.yaml -f docker/prod/compose.monitoring.yaml up -d
```

Both `-f` flags are then required on **every** later command, or Compose treats the monitoring
services as orphans. See `monitoring/README.md` for the Grafana Cloud credentials.

---

## 10. Backups

Nothing above protects the data. One host, one volume — set this up on day one, not after the
first incident.

`/usr/local/bin/pg-backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /home/ubuntu/app/docker/prod
set -a; . ./.env; set +a
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
# --format=custom is already zlib-compressed and is what pg_restore expects.
docker compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" --format=custom > "/tmp/db-$STAMP.dump"
aws s3 cp "/tmp/db-$STAMP.dump" "s3://<bucket>/postgres/db-$STAMP.dump"
rm -f "/tmp/db-$STAMP.dump"
```

```bash
sudo chmod +x /usr/local/bin/pg-backup.sh
( crontab -l 2>/dev/null; echo "17 3 * * * /usr/local/bin/pg-backup.sh >> /var/log/pg-backup.log 2>&1" ) | crontab -
```

The instance role needs `s3:PutObject` on that bucket. Set a lifecycle rule so old dumps expire,
and enable bucket versioning so a corrupted upload cannot overwrite a good backup.

**Restore the dump into a scratch database once a quarter.** A backup nobody has restored is not a
backup.

Also worth keeping: `caddy-data` holds the issued certificates and the ACME account key. Losing it
forces a full re-issue, and Let's Encrypt caps duplicate certificates at 5 per week.

## 11. Releasing a new version

```bash
# laptop, on a clean working tree
make push-prod PROD_REGISTRY=ghcr.io/<user> PROD_PLATFORM=linux/arm64

# instance
cd ~/app && git pull                       # compose files, Caddyfile, monitoring config
sed -i "s/^SERVER_IMAGE_TAG=.*/SERVER_IMAGE_TAG=<sha>/;s/^SENTRY_RELEASE=.*/SENTRY_RELEASE=<sha>/" docker/prod/.env
docker compose -f docker/prod/compose.yaml pull server
docker compose -f docker/prod/compose.yaml up -d --no-build server
docker compose -f docker/prod/compose.yaml ps
```

`SENTRY_RELEASE` moves in the same edit as the tag — it is what ties a Sentry event back to the
code that raised it, and a stale value points every stacktrace at the wrong commit.

Only `server` is recreated; Postgres, Redis and Caddy keep running. Expect a few seconds of 502
while the new container starts — `stop_grace_period` gives the old one 30s to drain in-flight
requests first.

Once migrations exist, they run **here**, between `pull` and `up -d`, as a one-off container from
the same image — never on application start.

## 12. Rollback

```bash
sed -i "s/^SERVER_IMAGE_TAG=.*/SERVER_IMAGE_TAG=<previous sha>/" docker/prod/.env
docker compose -f docker/prod/compose.yaml up -d --no-build server
```

This is the whole reason tags are git shas rather than `latest`: the previous image is still in the
registry and still addressable.

Note that a rollback moves the code back but not the database. Once migrations exist, any migration
that is not backwards-compatible with the previous release makes this unsafe.

## 13. Rotating credentials

**Redis** — applied at every container start, so it is just an edit and a recreate:

```bash
docker compose -f docker/prod/compose.yaml up -d --force-recreate redis server
```

**Postgres** — the password lives in the volume, so `.env` alone changes nothing:

```bash
docker compose -f docker/prod/compose.yaml exec postgres \
  psql -U "$DB_USER" -d "$DB_NAME" -c "ALTER USER \"$DB_USER\" WITH PASSWORD 'new';"
# then update DB_PASS in .env and:
docker compose -f docker/prod/compose.yaml up -d --force-recreate server
```

**JWT secrets** — rotating any of the three invalidates every token signed with the old value, i.e.
it logs every user out. Same for `JWT_ISSUER` and `JWT_AUDIENCE`, which are verified as claims.

## 14. Things that destroy data

- `docker compose down -v` — removes `postgres-data`, `redis-data` and `caddy-data`.
- `docker volume rm`, `docker system prune --volumes` — same.
- Terminating the instance without a current backup in S3.

`docker compose down` without `-v` is safe: it removes containers and keeps volumes.
