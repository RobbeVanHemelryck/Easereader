FROM node:22-bookworm-slim

WORKDIR /app

# Install Chromium and minimal runtime dependencies for Puppeteer in containers.
RUN apt-get update && apt-get install -y --no-install-recommends \
	chromium \
	ca-certificates \
	fonts-liberation \
	libasound2 \
	libatk-bridge2.0-0 \
	libatk1.0-0 \
	libc6 \
	libcairo2 \
	libcups2 \
	libdbus-1-3 \
	libexpat1 \
	libfontconfig1 \
	libgbm1 \
	libgcc-s1 \
	libglib2.0-0 \
	libgtk-3-0 \
	libnspr4 \
	libnss3 \
	libpango-1.0-0 \
	libpangocairo-1.0-0 \
	libstdc++6 \
	libx11-6 \
	libx11-xcb1 \
	libxcb1 \
	libxcomposite1 \
	libxdamage1 \
	libxext6 \
	libxfixes3 \
	libxrandr2 \
	libxrender1 \
	libxshmfence1 \
	libxss1 \
	libxtst6 \
	unzip \
	xdg-utils \
	&& rm -rf /var/lib/apt/lists/*

# Install app dependencies first for better layer caching.
COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --omit=dev

# Copy application source.
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV CONFIG_DIR=/config
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Persist sender/profile data outside the container filesystem.
VOLUME ["/config"]

EXPOSE 3000

CMD ["npm", "start"]
