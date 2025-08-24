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
ENV PORT=7860

# Build the application
RUN npm run build

# Expose the port that Hugging Face Spaces expects
EXPOSE 7860

# Start the application
CMD ["npm", "start", "--", "-p", "7860"]
