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

  writing: function () {
     // Install the top-level files
     this._processGlob('mean2-starter', '*.*');

     // Install the config environment files
     this._processGlob('mean2-starter', 'config/**', this.props);

     // Install the Docker code if requested
     if (this.props.docker) {
       this._processGlob('docker', '*.*', this.props);
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

     // Overwrite specific files from the Git submodule
     this._processGlob('', 'package.json', this.props);
  },

  install: function () {
    // If the client is enabled, install all the client dependencies
    if (this.props.client) {
      // Load the mean2-starter package.json, so we can get all its dev dependencies
      var pkg = require(path.join(this.sourceRoot(), 'mean2-starter/package.json'));
      _.forEach(pkg.devDependencies)
    }

    this.npmInstall();
  },

  /**
   * Applies all of the prompts for which we don't yet have data defined on the command line.
   *
   * @param {Object} prompts - The definition of the prompts that can be asked.
   * @returns {Promise.<Object>} - A promise that returns the properties that will be used.
   * @private
   */
  _applyPrompts: function(prompts) {
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

    var files = glob.sync(sourceGlob, { dot: true, cwd: sourcePath });

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
  }
});
