.PHONY: build-tests
build-tests: ## Build the development docker image.
	COMPOSE_BAKE=true docker compose -f docker/tests/compose.yaml build

.PHONY: start-tests
start-tests: ## Start the development docker container.
	docker compose -f docker/tests/compose.yaml up -d

.PHONY: stop-tests
stop-tests: ## Stop the development docker container.
	docker compose -f docker/tests/compose.yaml down

.PHONY: test-ci
test-ci:
	docker compose -f docker/tests/compose.yaml up \
		--build \
		--abort-on-container-exit \
		--exit-code-from ten-percent
	docker compose -f docker/tests/compose.yaml down

# ======================
# Production image
# ======================
# Built with buildx directly rather than `docker compose build`: compose
# interpolates the whole file before it builds anything, so the `${...:?}` guards
# on the runtime environment would demand a filled-in .env for an operation that
# needs no configuration at all. The image carries code only - every value reaches
# it through the container environment at start.
#
# A dirty working tree gets a `-dirty` tag, so an image built from uncommitted
# code is never mistaken in the registry for one built from a commit.
PROD_IMAGE ?= tenpercent-server
PROD_TAG ?= $(shell git rev-parse --short HEAD)$(shell test -z "$$(git status --porcelain)" || echo -dirty)
# Registry path for a release build, e.g. ghcr.io/<user>. No default on purpose.
PROD_REGISTRY ?=
# Must match the deployment host: linux/arm64 for a t4g instance, linux/amd64 for
# t3/t2. A mismatch only shows up at runtime, as `exec format error`.
PROD_PLATFORM ?= linux/arm64

.PHONY: build-prod
build-prod: ## Build the production server image for this machine's architecture.
	docker buildx build \
		-f docker/prod/Dockerfile \
		-t $(PROD_IMAGE):$(PROD_TAG) \
		-t $(PROD_IMAGE):latest \
		--load \
		.

.PHONY: push-prod
push-prod: ## Build for the deployment platform and push. Needs PROD_REGISTRY=<registry path>.
	@test -n "$(PROD_REGISTRY)" || { echo "PROD_REGISTRY is required, e.g. make push-prod PROD_REGISTRY=ghcr.io/<user>"; exit 1; }
	docker buildx build \
		--platform $(PROD_PLATFORM) \
		-f docker/prod/Dockerfile \
		-t $(PROD_REGISTRY)/$(PROD_IMAGE):$(PROD_TAG) \
		--push \
		.
	@echo
	@echo "pushed $(PROD_REGISTRY)/$(PROD_IMAGE):$(PROD_TAG)"
	@echo "in docker/prod/.env on the instance set:"
	@echo "  SERVER_IMAGE=$(PROD_REGISTRY)/$(PROD_IMAGE)"
	@echo "  SERVER_IMAGE_TAG=$(PROD_TAG)"
	@echo "  SENTRY_RELEASE=$(PROD_TAG)"

.PHONY: start-prod
start-prod: ## Start the production stack locally. Needs a filled-in docker/prod/.env.
	docker compose -f docker/prod/compose.yaml up -d --no-build

.PHONY: stop-prod
stop-prod: ## Stop the production server container.
	docker compose -f docker/prod/compose.yaml down
