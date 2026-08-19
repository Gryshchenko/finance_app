# Monitoring

Metrics from this host go to **Grafana Cloud**. Nothing is stored locally: the host runs four
exporters, a `/metrics` endpoint inside the API, and Grafana Alloy, which scrapes all of them
and ships the result to the Cloud endpoint.

```bash
docker compose -f compose.yaml -f compose.monitoring.yaml up -d
```

Both `-f` flags are needed on **every** later command too. `docker compose -f compose.yaml
up -d` on its own treats the monitoring services as orphans and offers to remove them.

## Credentials

From the Cloud portal, **Connections → Add new connection → Hosted Prometheus metrics → Send
metrics from a single Prometheus instance**. That page shows the push URL, the numeric instance
id, and a button to generate a token.

| Variable                  | Where it comes from                                                  |
| ------------------------- | -------------------------------------------------------------------- |
| `GRAFANA_CLOUD_PROM_URL`  | `https://prometheus-prod-NN-prod-<region>.grafana.net/api/prom/push` |
| `GRAFANA_CLOUD_PROM_USER` | the numeric instance id on the same page                             |
| `GRAFANA_CLOUD_API_KEY`   | an access policy token, scope `metrics:write` and nothing more       |

They go into the same shell environment as the rest of the deployment (SSM / Secrets Manager),
exactly like `DB_PASS`. Alloy reads them with `sys.env` at startup — this is why the collector
is Alloy and not Prometheus, which cannot expand environment variables in its config file and
would need the token written to a file on disk.

## What arrives in the Cloud stack

| Job        | Contents                                                                    |
| ---------- | --------------------------------------------------------------------------- |
| `server`   | HTTP latency by route, rate-limit refusals, knex pool, node process metrics |
| `node`     | host CPU, memory, disk, network                                             |
| `postgres` | connections, transactions, cache hit ratio, deadlocks                       |
| `redis`    | memory, clients, commands, keyspace                                         |
| `caddy`    | edge request rate, status codes, TLS handshakes                             |
| `cadvisor` | per-container CPU/memory, restarts, OOM kills (thinned — see below)         |
| `alloy`    | delivery health of the collector itself                                     |

Every series carries `env="production"`.

## Dashboards

The community dashboards import into a Cloud stack the same way as into a local Grafana —
**Dashboards → New → Import**, by ID: `1860` (Node Exporter Full), `9628` (PostgreSQL), `763`
(Redis), `19908` (cAdvisor).

The cAdvisor dashboard will have empty panels: `config.alloy` keeps only a handful of
`container_*` metrics on purpose. Widen the `keep` rule if a panel is worth the series.

The API's own metrics have no ready-made dashboard, because the metric names are ours:

```promql
# request rate by route
sum by (route) (rate(http_request_duration_seconds_count[5m]))

# p95 latency by route
histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))

# error ratio
sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m]))
  / sum(rate(http_request_duration_seconds_count[5m]))

# rate-limit refusals, split by which budget ran out
sum by (limiter, reason) (rate(rate_limit_rejections_total[5m]))

# requests queueing for a database connection - latency shows up here first
db_pool_connections{state="pending_acquire"}
```

## Alerts

Grafana Cloud Alerting, with a contact point (Telegram, email, Slack) configured first. The
rules worth having before any others:

- `node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.15` on the postgres volume —
  a full disk stops the database with no application error preceding it.
- `up == 0` for 5m on any job.
- the error-ratio query above `> 0.05` for 10m.
- `db_pool_connections{state="pending_acquire"} > 0` for 5m.
- `redis_memory_used_bytes / redis_memory_max_bytes > 0.9` — Redis runs `noeviction`, so
  hitting the ceiling means writes start failing rather than keys being dropped.

Two of these are worth adding **because** the stack is hosted: an alert on
`prometheus_remote_storage_samples_failed_total` rising, and one on the collector's own `up`.
A collector that stopped delivering looks exactly like a quiet service from inside the Cloud UI.

## The series budget

The free tier caps **active series**, currently around 10k, and it is a hard cap: past it the
Cloud endpoint rejects writes with a 429 and the excess is simply lost. This stack sits around
3–5k. The two things that would change that:

- **cAdvisor**, which emits thousands of series unfiltered. Hence `prometheus.relabel
"cadvisor"` in `config.alloy`.
- **the `route` label**, which the outside world picks. `normalizeRoute`
  (`packages/server/src/middleware/httpMetrics.ts`) closes that set: ids, emails and tokens
  collapse to placeholders, and any path whose first segment is not a mounted router becomes
  `unmatched`. **Add new routers to `KNOWN_PREFIXES` there**, or their traffic disappears into
  `unmatched`.

Current usage lives in the Cloud portal under **Billing and usage**, and in PromQL as
`grafanacloud_instance_active_series` against the `grafanacloud-<org>-usage-insights`
datasource. Check it after widening any filter.

## Logs

Shipping container logs to Cloud Loki is the largest remaining free-tier win — pino already
writes structured JSON — and `config.alloy` carries the block for it, commented out. The reason
it is not on by default is in the comment there: it needs the Docker socket, and holding that
socket is root on the host in practice. Read it before enabling.

## Verifying

Alloy's UI lists every scrape target with its last result, which is the fastest way to see what
is not working:

```bash
ssh -L 12345:127.0.0.1:12345 user@your-host   # then http://localhost:12345
```

```bash
# the API's own metrics, from inside the network
docker compose -f compose.yaml -f compose.monitoring.yaml exec alloy wget -qO- http://server:9464/metrics | head

# is delivery to the Cloud actually happening
docker compose -f compose.yaml -f compose.monitoring.yaml exec alloy \
  wget -qO- http://localhost:12345/metrics | grep prometheus_remote_storage_samples_

# /metrics must NOT be reachable from the internet
curl -s -o /dev/null -w '%{http_code}\n' https://your-api-domain/metrics   # expect 404
```

`..._samples_total` climbing with `..._samples_failed_total` flat is a healthy pipeline. Failures
against a fresh stack are almost always the token scope or a wrong instance id.

Caddy's `metrics` directive is what serves the `:2020` site block in the Caddyfile. If that
target is red in the Alloy UI, check the Caddy version — `docker compose exec caddy caddy version`.
