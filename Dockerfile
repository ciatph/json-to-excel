FROM node:20.15.0-alpine AS base
RUN mkdir -p /opt/app
WORKDIR /opt/app
RUN adduser -S user
RUN chown -R user /opt/app
COPY package*.json ./

# BUILD TARGET
FROM base AS build
RUN npm install
COPY . ./
RUN npm run transpile

# DEVELOPMENT TARGET PROFILE
FROM base AS development
RUN npm install
COPY . ./
USER user
EXPOSE 9229
CMD ["sh"]

# PRODUCTION TARGET PROFILE
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /opt/app/dist /opt/app/dist
COPY package*.json ./
RUN npm install && npm prune --production
CMD ["sh"]
