FROM node:6.9

# Install additional packages
RUN apt-get update && apt-get install -y unzip build-essential

## Install AWS CLI
WORKDIR /opt/aws
RUN curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip" && \
	unzip awscli-bundle.zip && \
	./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws && \
	rm -rf awscli-bundle awscli-bundle.zip

# npm build the application, then install additional files
WORKDIR /srv/app

RUN echo "unsafe-perm = true" > /root/.npmrc

COPY package.json /srv/app/
RUN npm install --loglevel=warn
COPY . /srv/app/

ENV PATH="/srv/app:${PATH}"

ENTRYPOINT ["/srv/app/Entrypoint.sh"]
CMD ["npm", "start"]
