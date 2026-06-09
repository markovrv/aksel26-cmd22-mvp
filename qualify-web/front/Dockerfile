ARG FRONTEND_BASE_IMAGE=node:20-alpine
FROM ${FRONTEND_BASE_IMAGE}

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
