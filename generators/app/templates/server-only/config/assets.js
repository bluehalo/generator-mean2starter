'use strict';

let
	path = require('path'),
	pkg = require(path.resolve('./package.json'));

module.exports = {

	// Banner for the top of generated assets
	bannerString: '/* @license ' + pkg.name + ' Version: ' + pkg.version + ' Copyright Asymmetrik, Ltd. ' + new Date().getFullYear() + ' - All Rights Reserved.*/\n',

	// Build specific files
	build: [ 'gulpfile.js', 'config/build/!(typings)/**/*.js' ],

	// Test specific source files
	tests: {
		server: [ 'test-server.js', 'src/server/**/*.spec.js' ],
		e2e: [ 'e2e/**/*.spec.js' ]
	},

	// Server files
	server: {
		allJS: [ 'config/env/**/*.js', 'config/assets.js', 'src/server/**/*.js' ],
		models: [ 'src/server/app/*/models/**/*.model!(.spec).js' ],
		controllers: [ 'src/server/app/*/models/**/*.controller!(.spec).js' ],
		routes: [ 'src/server/app/!(core)/routes/*.routes!(.spec).js', 'src/server/app/core/routes/*!(.spec).js' ],
		sockets: [ 'src/server/app/*/sockets/*.sockets!(.spec).js' ],
		config: [ 'src/server/app/*/config/*.config!(.spec).js' ],
		policies: [ 'src/server/app/*/policies/*.policies!(.spec).js' ],
		views: [ 'src/server/app/*/views/**/*.html' ]
	}

};
