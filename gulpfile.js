'use strict';

var path = require('path');

var gulp = require('gulp');

var deploy = require('dd-deploy');

var pkg = require(path.resolve(process.cwd(), 'package.json'));



gulp.task('publish', function (cb) {
  return deploy({
    dirSrc: 'dist',
    branch: 'dist',
    repo: 'https://bfbbb2a1c4555f4e223f786a5006aa5cc3939270@github.com/douglasduteil/remote-repo-access-trial',
    push: true,
    verbose: true
  }, cb)
});
