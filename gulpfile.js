'use strict';

var path = require('path');
var exec = require('child_process').exec;

var gulp = require('gulp');
var bump = require('gulp-bump');

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


// Defined method of updating:
// Semantic
gulp.task('bump', function(){
  gulp.src('./*.json')
    .pipe(bump({type:'minor'}))
    .pipe(gulp.dest('./'));
});

gulp.task('_commit_bump', function(cb){
  exec('git commit -a -m "chore(release): v' + pkg.version + '"', {}, function (err) {
    cb(err);
  });
});
