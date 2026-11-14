FROM node:24-alpine
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --filter api...
EXPOSE 3000
# El seed es idempotente: crea índices, el umbral y los usuarios de desarrollo.
CMD ["sh", "-c", "pnpm --filter api seed && pnpm --filter api start"]
