#!/bin/bash

set -e

##
# Load Environment Variables from S3
##
if [[ -n $SECRETS_S3_URI ]]
then
 aws s3 cp s3://$SECRETS_S3_URI secrets
 set -a
 . secrets
 set +a
 rm secrets
fi

exec "$@"