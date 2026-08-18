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

.PHONY: build-prod
build-prod: ## Build the production server image.
	COMPOSE_BAKE=true docker compose -f docker/prod/compose.yaml build

.PHONY: start-prod
start-prod: ## Start the production server container.
	docker compose -f docker/prod/compose.yaml up -d

.PHONY: stop-prod
stop-prod: ## Stop the production server container.
	docker compose -f docker/prod/compose.yaml down
