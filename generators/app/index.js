'use strict';
var yeoman = require('yeoman-generator'),
	path = require('path'),
	glob = require('glob'),
	q = require('q'),
	_ = require('lodash');

module.exports = yeoman.Base.extend({
	constructor: function () {
		// Call the super-consructor
		yeoman.Base.apply(this, arguments);
	},

	/**
	 * Lifecycle hook: Create prompts for additional information from the user.
	 *
	 * @returns {Promise.<Object>} - The properties object from the user
	 */
	prompting: function () {
		// Define all the prompts we can ask the user
		let prompts = {
			appname: {
				type: 'input',
				message: 'Provide a name for this application or service. It should be lowercase and should not contain spaces.',
				default: this.appname,
				store: true,
				filter: (val) => { return val.toLowerCase().replace(/\s/, '-'); }
			},
			description: {
				type: 'input',
				message: 'Provide a description for the application',
				store: true
			},
			client: {
				type: 'confirm',
				message: 'Would you like to install the client-side Angular2 framework in addition to the server components?',
				default: true,
				store: true
			},
			docker: {
				type: 'confirm',
				message: 'Will you be using Docker to develop and/or deploy this application?',
				default: false,
				store: true
			},
			multiservice: {
				type: 'confirm',
				message: 'Would you like to include a framework for multiple docker services?',
				default: false,
				when: (props) => { return props.docker; }
			}
		};

		return this._applyPrompts(prompts);
	},

	configuring: function() {
		// If this is a docker build, it will be installed in a subdirectory
		if (this.props.docker) {
			this.appDestination = this.props.appname;
		}
		else {
			this.appDestination = '.';
		}
	},

	/**
	 * Lifecycle hook: Write the appropriate files
	 */
	writing: {

		copyFiles: function () {

			// Install the top-level files
			this._processGlob('mean2-starter', '*.*', this.appDestination);

			// Install the config environment files
			this._processGlob('mean2-starter', 'config/**', this.appDestination, this.props);

			// Install the Docker code if requested
			if (this.props.docker) {
				this._processGlob('docker', '*', this.appDestination, this.props);
			}

			// Install the server code
			this._processGlob('mean2-starter', 'src/server/**/*.*', this.appDestination);

			// Install the client code if requested
			if (this.props.client) {
				this._processGlob('mean2-starter', 'src/client/**/*.*', this.appDestination);
			}
			// Otherwise, overwrite certain files with the server-only version
			else {
				this._processGlob('server-only', 'config/*.*', this.appDestination, this.props);
				this.fs.delete(path.join(this.appDestination, 'test-client.js'));
			}

			// Install the multiservice Docker configs if requested
			if (this.props.multiservice) {
				this._processGlob('multiservice', '**', '.', this.props);
			}
		},

		assemblePackageJson: function() {
			// Load and reconstruct the package.json file
			var pkg = require(path.join(this.sourceRoot(), 'mean2-starter/package.json'));

			// Organize the dependencies by type, by applying some rules
			var dependencies = this._organizeDependencies(pkg);
			this.log(JSON.stringify(dependencies, null, 2));

			// Initialize the package
			pkg.name = this.props.appname;
			pkg.description = this.props.description;

			// Copying over all the server and test dependencies
			pkg.dependencies = dependencies.server;
			pkg.devDependencies = dependencies.test;

			// If we're running in docker mode, all the dev dependencies should be regular dependencies since they're used for the build
			if (this.props.docker) {
				_.merge(pkg.dependencies, dependencies.gulp);

				// If the client is enabled, install all the client dependencies
				if (this.props.client) {
					_.merge(pkg.dependencies, dependencies.client);
				}

				// Make sure to install any additional dependencies needed by Docker
				if (!pkg.dependencies['aws-sdk']) {
					// Install the latest version
					pkg.dependencies['aws-sdk'] = '^2.7.1';
				}
				if (!pkg.dependencies['var']) {
					pkg.dependencies['var'] = '^0.2.0';
				}
			}
			else {
				_.merge(pkg.devDependencies, dependencies.gulp);

				// If the client is enabled, install all the client dependencies
				if (this.props.client) {
					_.merge(pkg.devDependencies, dependencies.client);
				}
			}

			// Sort the packages, as npm install would do
			pkg.dependencies = this._sortKeys(pkg.dependencies);
			pkg.devDependencies = this._sortKeys(pkg.devDependencies);

			this.fs.writeJSON(path.join(this.appDestination, 'package.json'), pkg, null, 4);
		}
	},

	/**
	 * Lifecycle hook: Install the npm packages
	 */
	install: function() {
		if (!this.props.docker) {
			this.npmInstall();
		}
	},

	/**
	 * Applies all of the prompts for which we don't yet have data defined on the command line.
	 *
	 * @param {Object} prompts - The definition of the prompts that can be asked.
	 * @returns {Promise.<Object>} - A promise that returns the properties that will be used.
	 * @private
	 */
	_applyPrompts: function (prompts) {
		this.props = this.props || {};

		// Collect the options that have already been supplied, so we don't prompt for them again
		var filteredPrompts = _.chain(prompts)
		.map((prompt, key) => {
			if (this.props[key] === undefined) {
				prompt.name = key;
				return prompt;
			}
			return undefined;
		})
		.filter((prompt) => {
			return prompt !== undefined;
		})
		.value();

		return this.prompt(filteredPrompts).then((props) => {
			// Save the properties so they can be accessed later
			this.props = _.extend(this.props, props);

			return this.props;
		});
	},

	/**
	 * Copy a directory of files from one place to another, and apply templating to all files.
	 *
	 * @param {string} source - The source directory from which to copy files, relative to the template path.
	 * @param {string} sourceGlob - A glob containing the files to copy.
	 * @param {string} destination - The destination directory to which to copy file, relative to the destination path.
	 * @param {Object} data - Optionally, data to feed to the template processor for each file.
	 * @private
	 */
	_processGlob: function (source, sourceGlob, destination, data) {
		var sourcePath = this.templatePath(source);
		var destinationPath = this.destinationPath(destination);

		var files = glob.sync(sourceGlob, {dot: true, cwd: sourcePath});

		files.forEach((file) => {
			var src = path.join(sourcePath, file);
			var dest = path.join(destinationPath, file);

			if (data) {
				this.fs.copyTpl(src, dest, data);
			}
			else {
				this.fs.copy(src, dest);
			}
		});
	},

	/**
	 * @typedef {Object} DependencyGroups
	 * @type {Array} gulp - The gulp dependencies
	 * @type {Array} server - The server dependencies
	 * @type {Array} client - The client dependencies
	 * @type {Array} test - The test dependencies
	 */
	/**
	 * Organize the source dependencies and dev dependencies, so we can manipulate them in groups
	 *
	 * @param {Object} pkg - The source package.json file
	 * @returns {DependencyGroups} The groups of dependencies
	 * @private
	 */
	_organizeDependencies: function (pkg) {
		var out = {
			server: {},
			client: {},
			gulp: {},
			test: {}
		};

		// We can assume the non-dev dependencies all pertain to the server
		out.server = pkg.dependencies;

		// Now iterate through the dev dependencies and categorize them
		_.forEach(pkg.devDependencies, (version, dep) => {

			// Is it a test dependency?
			if (this._testDependency(dep, ['should', 'mocha'])) {
				out.test[dep] = version;
			}

			// Is it a gulp plugin for a client-only functionality?
			else if (this._testDependency(dep, ['sass', 'sourcemaps', 'clean-css', 'tslint', 'livereload'])) {
				out.client[dep] = version;
			}

			// Is it a gulp plugin?
			else if (this._testDependency(dep, ['gulp', 'run-sequence'])) {
				out.gulp[dep] = version;
			}

			// Otherwise, it's a client dependency
			else {
				out.client[dep] = version;
			}
		});
		return out;
	},

	_testDependency: function(dependency, tests) {
		return _.reduce(tests, (acc, test) => {
			return acc || dependency.indexOf(test) > -1;
		}, false);
	},

	_sortKeys: function(object) {
		var keys = Object.keys(object).sort();

		return _.reduce(keys, (obj, key) => {
			obj[key] = object[key];
			return obj;
		}, {});
	}
});
