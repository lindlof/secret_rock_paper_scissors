FROM node:15.3.0
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
COPY . /app
CMD ["npm", "run", "build"]
