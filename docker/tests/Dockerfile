# ======================
# Test
# ======================
FROM node:20-alpine AS test

RUN apk add --no-cache git python3 make g++
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# 1. Copy workspace root manifests + lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 2. Copy package.json for ALL workspace packages (pnpm needs the full graph)
COPY packages/app/package.json ./packages/app/
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# 3. Install only server + shared deps (skip the heavy app package)
RUN pnpm install --filter "@tenpercent/server..." --filter "tenpercent/shared..."

# 4. Copy shared source and build it
COPY packages/shared ./packages/shared
RUN pnpm --filter "tenpercent/shared" build

# 5. Copy server source
COPY packages/server/tsconfig.json ./packages/server/
COPY packages/server/types.d.ts ./packages/server/
COPY packages/server/jest.config.js ./packages/server/
COPY packages/server/jest.setup.ts ./packages/server/
COPY packages/server/src ./packages/server/src
COPY packages/server/tests ./packages/server/tests

WORKDIR /app/packages/server
CMD ["pnpm", "run", "jest-test"]
