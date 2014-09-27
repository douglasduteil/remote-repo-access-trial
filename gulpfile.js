'use strict';

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var gulp = require('gulp');
var bump = require('gulp-bump');
var conventionalChangelog = require('conventional-changelog');

//var deploy = require('dd-deploy');
var Deployor = require('dd-deploy');
var run = require('run-sequence');


var changeCase = require('change-case');
var Promise = require('bluebird');
Error.stackTraceLimit = 25;
Promise.longStackTraces();
exec = Promise.promisify(require("child_process").exec)

gulp.task('release', function(cb){
  run(
    'bump',
    'updateChangeLog',
    '_commit_bump',
    '_tag_bump',
    '_push_bump',
    cb);
});


////

var Deployor = require('node-git-deployor');

gulp.task('dist-trial', function(){
  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));

  var distWorkspace = Deployor.cloneRepoBranch('dist', '.tmp/dist', {
    orphan : true
  });

  distWorkspace.extraClean();
  distWorkspace.copy('dist');
  distWorkspace.commit('Update ' + new Date().toISOString());
  distWorkspace.tag('v' + pkg.version);
  distWorkspace.push();
});

gulp.task('release', function(){
  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));
  var srcWorkspace = new Deployor();
  srcWorkspace.commit('chore(release): v' + pkg.version);
  srcWorkspace.tag('src' + pkg.version);
  srcWorkspace.push();
});

////

gulp.task('publish', function (cb) {
  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));
  return deploy({
    dirSrc: 'dist',
    branch: 'dist',
    tag: 'v' + pkg.version,
    push: true,
    verbose: true
  }, cb)
});


// Defined method of updating:
// Semantic
gulp.task('bump', function(){
  return gulp.src('./*.json')
    .pipe(bump( ))
    .pipe(gulp.dest('./'));
});

gulp.task('_commit_bump', function(cb){
  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));
  exec('git commit -a -m "chore(release): v' + pkg.version + '"', {}, function (err) {
    cb(err);
  });
});

gulp.task('_tag_bump', function(cb){
  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));
  exec('git tag src' + pkg.version , {}, function (err) {
    cb(err);
  });
});

gulp.task('_push_bump', function(cb){
  exec('git push origin master --tags', {}, function (err) {
    cb(err);
  });
});

gulp.task('updateChangeLog', function(cb){
  function changeParsed(err, log){
    if (err) {
      return cb(err);
    }
    fs.writeFile('CHANGELOG.md', log, cb);
  }

  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));

  conventionalChangelog({
    repository: pkg.homepage,
    version: pkg.version
  }, changeParsed);

});
