'use strict';

var env = require('var');

/**
 * Copy this file to 'development.js' and selectively pull in first-level properties
 * to override the properties in 'default.js'.
 */
module.exports = {

	/**
	 * System Settings
	 */
	/*
	 * The mode in which the system is operating ('production' | 'development' | 'test')
	 *
	 * 'production':
	 *     Production assets served directly from nodeAngular running in production mode
	 *     Client runs in production mode
	 *
	 * 'development':
	 *     Development assets served from webpack middleware server
	 *     Client runs in development mode
	 *
	 * 'test':
	 *     Meant for running server/client tests
	 */
	mode: env.BUILD_ENV,

	// The port to use for the application (defaults to the environment variable if present)
	port: env.PORT || 3000,

	auth: {
		// Session secret is used to validate sessions
		sessionSecret: env.SESSION_SECRET || 'some-session-secret'
	},

	/**
	 * Environment Settings
	 */

	// Basic title and instance name
	app: {
		title: 'MEAN2 UI Development Settings)',
		instanceName: 'mean2ui'
	},

	// Header/footer
	banner: {
		// Show/hide the banner
		showBanner: true,

		// The string to display
		string: 'DEVELOPMENT MEAN2 UI SETTINGS',

		// Code that determines applied header/footer style
		code: 'S'
	},

	// MongoDB
	db: {
		admin: 'mongodb://' + env.MONGO_HOST + '/' + env.MONGO_DATABASE
	},

	// Configuration for outgoing mail server
	mailer: {
		from: env.MAILER_FROM || 'USERNAME@GMAIL.COM',
		options: {
			service: env.MAILER_SERVICE_PROVIDER || 'gmail',
			auth: {
				user: env.MAILER_EMAIL_ID || 'USERNAME@GMAIL.COM',
				pass: env.MAILER_PASSWORD || 'PASSWORD'
			}
		}
	}

	/**
	 * Development/debugging settings
	 */


	/**
	 * Logging Settings
	 */


	/**
	 * Not So Environment-Specific Settings
	 */

};
