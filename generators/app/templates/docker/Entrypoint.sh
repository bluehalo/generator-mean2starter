#!/bin/bash

set -e

##
# Load Environment Variables from S3
##
if [[ -f ~/.secrets ]]
then
	set -a
	. ~/.secrets
	set +a
elif [[ -v SECRETS_S3_URI ]]
then
	node downloadSecrets.js
	set -a
	. ~/.secrets
	set +a
	echo 'source secrets.sh' >> ~/.bashrc
fi

exec "$@"
