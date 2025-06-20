FROM node:20
WORKDIR /usr/src/app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Install frontend dependencies first for caching
COPY frontend/package*.json frontend/
RUN npm install --prefix frontend

# Copy application source including frontend code
COPY . .

# Build frontend after all sources are present
RUN npm run build --prefix frontend

EXPOSE 8080
CMD ["npm", "start"]

