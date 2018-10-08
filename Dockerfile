from node:10
WORKDIR /app/frontend
ADD ./frontend/package.json ./
RUN yarn install
ADD ./frontend/. .
RUN yarn build
WORKDIR /app/api-server
ADD ./api-server/package.json ./
RUN yarn install
ADD ./api-server/. .
RUN yarn build
CMD ["yarn", "run production"]

