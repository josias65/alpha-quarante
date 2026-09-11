FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend ./
COPY frontend ../frontend
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 10000
CMD ["node", "server.js"]
