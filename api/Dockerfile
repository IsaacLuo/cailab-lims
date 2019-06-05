FROM node:10
WORKDIR /app
EXPOSE 8000
ADD ./package.json .
RUN yarn install
ADD . .
RUN yarn build
CMD ["yarn", "run production"]

