# Use the official Node.js 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with legacy peer deps to handle conflicts
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy the rest of the application
COPY . .

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client before build
RUN npx prisma generate

# Build the application with more memory
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Railway will provide PORT environment variable
EXPOSE 3000

# Start the application (Next.js will use PORT env var automatically)
CMD ["npm", "start"]
