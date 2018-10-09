FROM node:10
WORKDIR /app
ADD ./package.json .
RUN yarn install
ADD . .
RUN yarn build
CMD ["yarn", "run production"]

