FROM node:20
WORKDIR /usr/src/app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Install and build frontend assets
COPY frontend/package*.json frontend/
RUN npm install --prefix frontend && npm run build --prefix frontend

# Copy application source
COPY . .

EXPOSE 8080
CMD ["npm", "start"]

