FROM node:22-alpine AS base
WORKDIR /usr/src/app
RUN corepack enable
# ---- Etapa de Dependencias ----
FROM base AS deps
COPY pnpm-lock.yaml package.json./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm fetch --prod --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile
# ---- Etapa de Compilación ----
FROM base AS build
COPY pnpm-lock.yaml package.json./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY. .
RUN pnpm run build
# ---- Etapa de Producción ----
FROM base AS production
ENV NODE_ENV=production
RUN mkdir -p /usr/src/app/dist && chown -R node:node /usr/src/app
USER node
WORKDIR /usr/src/app
COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist
COPY --chown=node:node package.json ecosystem.config.js./
ARG PORT=8000
EXPOSE $PORT
CMD ["pm2-runtime", "start", "ecosystem.config.js"]