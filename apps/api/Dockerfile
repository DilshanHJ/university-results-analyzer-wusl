FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY apps/api apps/api
RUN pnpm --filter @results/api build
RUN pnpm deploy --legacy --filter @results/api --prod /output

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs results
COPY --from=build --chown=results:nodejs /output ./
COPY --from=build --chown=results:nodejs /workspace/apps/api/dist ./dist
COPY --from=build --chown=results:nodejs /workspace/apps/api/drizzle ./drizzle
USER results
EXPOSE 3000
CMD ["node", "dist/main.js"]
