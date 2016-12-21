FROM node:6.9

# npm build the application, then install additional files
WORKDIR /srv/app

# Setup environment variables
ARG BUILD_ENV=production
ENV BUILD_ENV=$BUILD_ENV
ENV NODE_ENV=docker

# Install node packages
RUN echo "unsafe-perm = true" > /root/.npmrc
COPY package.json /srv/app/
RUN npm install --loglevel=warn
ENV PATH="/srv/app/node_modules/.bin:${PATH}"

# Install the rest of the application
COPY . /srv/app/

# Run gulp to build everything
RUN NODE_ENV=$BUILD_ENV gulp build

ENTRYPOINT ["/srv/app/Entrypoint.sh"]
CMD ["npm", "start"]
