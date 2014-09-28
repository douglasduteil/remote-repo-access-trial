'use strict';

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var gulp = require('gulp');
var bump = require('gulp-bump');
var conventionalChangelog = require('conventional-changelog');

var run = require('run-sequence');

var Deployor = require('node-git-deployor');

gulp.task('release', function(cb){
  run(
    'bump',
    'updateChangeLog',
    'push release commit',
    cb);
});


////


gulp.task('push release commit', function(){
  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));
  var srcWorkspace = new Deployor();
  srcWorkspace.commit('chore(release): v' + pkg.version);
  srcWorkspace.tag('src' + pkg.version);
  srcWorkspace.push();
});

////


gulp.task('ci:publishing', function (cb) {

  var allowPushOnRepo =
    // On TRAVIS source tag.
    (process.env.TRAVIS == 'true') && // on travis
    (process.env.TRAVIS_PULL_REQUEST == 'false') && //  no a PR
    /^src\d+\.\d+\.\d+.*$/.test(process.env.TRAVIS_BRANCH); // is a source tag

  if (!allowPushOnRepo){
    return cb();
  }

  run('publish', cb);
});

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


// Defined method of updating:
// Semantic
gulp.task('bump', function(){
  return gulp.src('./*.json')
    .pipe(bump( ))
    .pipe(gulp.dest('./'));
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
