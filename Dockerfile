FROM node:18-alpine

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++ pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy .env file first
COPY .env .env

# Then copy the rest of the application
COPY . .

# Set environment variables from .env file
ENV $(cat .env | xargs)

RUN npm run build

ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]