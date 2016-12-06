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
		var prompts = {
			appname: {
				type: 'input',
				message: 'Provide a name for this application',
				default: this.appname,
				store: true
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
				message: 'Would you like to install the Docker framework files?',
				default: false,
				store: true
			}
		};

		return this._applyPrompts(prompts);
	},

	/**
	 * Lifecycle hook: Write the appropriate files
	 */
	writing: {

		copyFiles: function () {
			// Install the top-level files
			this._processGlob('mean2-starter', '*.*');

			// Install the config environment files
			this._processGlob('mean2-starter', 'config/**', this.props);

			// Install the Docker code if requested
			if (this.props.docker) {
				this._processGlob('docker', '*', this.props);
			}

			// Install the server code
			this._processGlob('mean2-starter', 'src/server/**/*.*');

			// Install the client code if requested
			if (this.props.client) {
				this._processGlob('mean2-starter', 'src/client/**/*.*');
			}
			// Otherwise, overwrite certain files with the server-only version
			else {
				this._processGlob('server-only', 'config/*.*', this.props);
				this.fs.delete('test-client.js');
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
			}
			else {
				_.merge(pkg.devDependencies, dependencies.gulp);

				// If the client is enabled, install all the client dependencies
				if (this.props.client) {
					_.merge(pkg.devDependencies, dependencies.client);
				}
			}
			this.fs.writeJSON('package.json', pkg, null, 4);
		}
	},

	/**
	 * Install the appropriate npm packages, depending on the configuration
	 */
	install: function () {
		this.npmInstall();
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
		var filteredPrompts = _.map(prompts, (prompt, key) => {
			prompt.name = key;
			return prompt;
		});

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
	 * @param {Object} data - Optionally, data to feed to the template processor for each file.
	 * @private
	 */
	_processGlob: function (source, sourceGlob, data) {
		var sourcePath = this.templatePath(source);

		var files = glob.sync(sourceGlob, {dot: true, cwd: sourcePath});

		files.forEach((file) => {
			var src = path.join(sourcePath, file);
			var dest = file;

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
	}
});
