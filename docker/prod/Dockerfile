# ======================
# Production
# ======================
# Two independent installs off the same base: `build` gets the full dev
# toolchain to compile TypeScript, `prod-deps` resolves runtime dependencies
# only. The runtime image copies the result of both, so neither the compiler
# nor the native build toolchain ships to production.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ----------------------
# Build: shared -> server
# ----------------------
FROM base AS build
# argon2 is a native module and has no musl prebuild
RUN apk add --no-cache python3 make g++

# 1. Workspace root manifests + lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 2. package.json for ALL workspace packages (pnpm needs the full graph)
COPY packages/app/package.json ./packages/app/
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# 3. Install server + shared deps (skip the heavy app package)
RUN pnpm install --frozen-lockfile --filter "@tenpercent/server..."

# 4. Build shared, then compile the server against it
COPY packages/shared ./packages/shared
RUN pnpm --filter "@tenpercent/shared" build

COPY packages/server/tsconfig.json packages/server/tsconfig.build.json packages/server/types.d.ts ./packages/server/
COPY packages/server/src ./packages/server/src
RUN pnpm --filter "@tenpercent/server" run build

# ----------------------
# Runtime dependencies
# ----------------------
# pnpm always installs the workspace root's own dependencies, and the root
# carries the Expo/React Native app - ~200MB of tooling the server never loads.
# Stripping the root manifest and the app package here keeps them out of the
# image; every version still comes from the committed lockfile.
FROM base AS prod-deps
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.dependencies;delete p.devDependencies;delete p.scripts;fs.writeFileSync('package.json',JSON.stringify(p,null,4));" \
    && printf 'packages:\n    - packages/server\n    - packages/shared\n\nallowBuilds:\n    argon2: true\n' > pnpm-workspace.yaml
RUN pnpm install --prod --filter "@tenpercent/server..."

# ----------------------
# Runtime
# ----------------------
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app /app
COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/packages/server/dist ./packages/server/dist
# Served by app.ts from process.cwd()/public
COPY --chown=node:node packages/server/public ./packages/server/public

USER node
WORKDIR /app/packages/server
EXPOSE 3000
CMD ["node", "dist/src/app.js"]
