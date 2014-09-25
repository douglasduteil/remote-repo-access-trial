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

gulp.task('trial', function(){
  var deployor = function(){};
  deployor.env = {
    verbose: true,
    branch: 'master',
    cloneLocation: '.tmp/master'
  };

  deployor.exec = function(cmd){
    if (deployor.env.verbose){
      console.log('>> ', cmd);
    }
    return exec(cmd, {
      env : deployor.env,
      maxBuffer: 20*1024*1024
    });
  };

  deployor.config = function(){
    return deployor.exec('git config --get remote.origin.url')
      .spread(function(out){
        deployor.env.repoUrl = process.env.REPO || String(out).split(/[\n\r]/).shift();
      })
      .catch(function(){
        throw new Error('Can\'t get no remote.origin.url !');
      })
      .finally(function(){
        Object.keys(deployor.env).forEach(function(key){
          deployor.env[changeCase.snakeCase(key).toUpperCase()] = deployor.env[key];
        });

        console.log(deployor.env);
      });

  };
/*
  // Get the remote.origin.url
  res = e('git config --get remote.origin.url');
  if (res.code > 0) throw new Error('Can\'t get no remote.origin.url !');

  options.repoUrl = process.env.REPO || String(res.output).split(/[\n\r]/).shift();
  if (!options.repoUrl) throw new Error('No repo link !');
*/


  var e = deployor.exec;

  return deployor.config()
  .then(e.bind(null, 'whoami'))
  .tap(console.log)
  .then(e.bind(null, 'git clone --branch=$BRANCH --single-branch $REPO_URL $CLONE_LOCATION'))
  ;
/*
  // Clone the repo branch to a special location (clonedRepoLocation)
  res = e('git clone --branch=$BRANCH --single-branch $REPO_URL $CLONE_LOCATION');
  if (res.code > 0) {
    // try again without banch options
    res = e('git clone <%= repoUrl %> <%= cloneLocation %>');
    if (res.code > 0) throw new Error('Can\'t clone !');
  }*/

/*
  function trial(out, deployor){
    exec('cd $CLONE_LOCATION', {
      env : deployor.env
    })
    .then()
  }

  return deployor({

  })
  .then(deployor.cleanTmp)
  .then(deployor.cloneBranch)
  .spread(trial)
  .then(exec('$GIT status', {
    env : {
      GIT : 'git'
    }.
  })
  .spread(function(streams){
    console.log(streams);
  });*/
/*
  var deployor = new Deployor({
    verbose : true
  });
  deployor.cloneRepo({
    branch: 'dist'
  })
*/
  // deploy.commit => ( msg )
  // deploy.tag => ( sdf )
  // deploy.push => ()
  //



});

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
