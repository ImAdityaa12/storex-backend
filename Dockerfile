FROM ubuntu

# Install Node.js
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm install -g typescript
RUN tsc

# Start the application using the compiled JavaScript
ENTRYPOINT ["node", "dist/index.js"]