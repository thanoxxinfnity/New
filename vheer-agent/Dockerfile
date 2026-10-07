FROM mcr.microsoft.com/playwright:v1.56.0-noble
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --omit=dev
COPY . .
ENV PORT=3000 DATA_DIR=/data
EXPOSE 3000
CMD ["node","server.mjs"]
