# Use Node.js 20 LTS as base image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Cloud Run listens on port 8080
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
