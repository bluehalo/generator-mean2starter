'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('generator-mean2starter:app', function () {
  before(function () {
    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({appname: 'testapp'})
      .toPromise();
  });

  it('creates files', function () {
    assert.file([
    	'package.json'
    ]);
  });
});
