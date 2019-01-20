# stage: 1 - for development environment
FROM node:8.15.0-jessie as react-build

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm","run", "start"]


# stage: 2 — the production environment
FROM nginx:alpine
COPY --from=react-build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
