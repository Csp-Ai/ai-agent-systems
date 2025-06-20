FROM node:20
WORKDIR /usr/src/app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Copy server entry point (this was missing!)
COPY index.js ./

# Install frontend dependencies
COPY frontend/package*.json frontend/
RUN npm install --prefix frontend

# Copy full source
COPY . .

# Build frontend
RUN npm run build --prefix frontend

EXPOSE 8080
CMD ["node", "index.js"]
