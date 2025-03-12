FROM node:18-alpine AS development

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag to resolve conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM node:18-alpine AS production

# Set NODE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies with legacy peer deps flag
RUN npm install --omit=dev --legacy-peer-deps

# Copy built application from development stage
COPY --from=development /usr/src/app/dist ./dist

# Expose API port (handles both HTTP and WebSockets)
EXPOSE 3000

# Start the server
CMD ["node", "dist/main"] 