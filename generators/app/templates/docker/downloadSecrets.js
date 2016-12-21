#!/usr/bin/env node
"use strict";

if (process.env.SECRETS_S3_URI != null) {
	var url = process.env.SECRETS_S3_URI.split('/'),
		aws = require('aws-sdk'),
		fs = require('fs'),
		s3 = new aws.S3();

	s3.getObject({
		Bucket: url[0],
		Key: url.slice(1).join('/')
	}, function(err, data) {
		if (err) {
			console.error(err);
			return process.exit(1);
		}

		//Home directory cannot be accessed with ~ in the context this is run
		var fd = fs.openSync(process.env.HOME + '/.secrets', 'w');
		fs.writeSync(fd, data.Body);
		fs.closeSync(fd);
	});
}
