'use strict';

var path = require('path');
var exec = require('child_process').exec;

var gulp = require('gulp');
var bump = require('gulp-bump');

var deploy = require('dd-deploy');
var run = require('run-sequence');

var pkg = require(path.resolve(process.cwd(), 'package.json'));


gulp.task('release', function(cb){
  run(
    'bump',
    'sync',
    '_commit_bump',
    '_push_bump',
    cb);
});

gulp.task('publish', function (cb) {
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
    .pipe(bump({type:'minor'}))
    .pipe(gulp.dest('./'));
});

gulp.task('_commit_bump', function(cb){
  exec('git commit -a -m "chore(release): v' + pkg.version + '"', {}, function (err) {
    cb(err);
  });
});

gulp.task('_push_bump', function(cb){
  exec('git push origin master ', {}, function (err) {
    cb(err);
  });
});

gulp.task('sync', function(cb){
  setTimeout(function () {
    cb();
  }, 100);
});

