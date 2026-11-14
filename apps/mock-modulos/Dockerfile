FROM node:24-alpine
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/mock-modulos ./apps/mock-modulos
RUN pnpm install --frozen-lockfile --filter mock-modulos...
EXPOSE 3001
CMD ["pnpm", "--filter", "mock-modulos", "start"]
