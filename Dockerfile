FROM node:18-alpine

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++ pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]