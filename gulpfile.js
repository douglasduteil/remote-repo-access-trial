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

var sh = require('shelljs');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var envSave = {};
var _ = {}; // minimal lodash
_.assign = require('lodash.assign');

gulp.task('dist-trial', function(){
  // FORCE up to date data
  // the 'package.json' can change in the previous tasks
  var pkg = require(path.resolve(process.cwd(), 'package.json'));


  function Deployor(options){

    this.options = _.assign(
      {},
      Deployor.defaults,
      options
    );

    Object.keys(process.env).forEach(function(key){
      process.env[changeCase.snakeCase(key).toUpperCase()] = process.env[key];
    });

    //this.dirSrc = path.resolve(path.join(this.origin_cwd, this.options.dirSrc));
    //this.cloneLocation = path.resolve(path.join(this.origin_cwd, this.options.cloneLocation));
  }

  Deployor.verbose = true;

  var e = function(cmd){
    if (Deployor.verbose){
      console.log('$', chalk.cyan(cmd));
    }
    return sh.exec(cmd);
  };

  Deployor.defaults = {

  };

  Deployor.cloneRepoBranch = function cloneRepoBranch(branchName, destPath, options){
    var cwd = process.cwd();

    options = {
      cwd : cwd
    };

    destPath = path.resolve(path.join(cwd, destPath));

    envSave = process.env;
    _.assign(process.env, {
      branch: branchName,
      cloneLocation : destPath
    });

    //var cloneLocation = path.resolve(path.join(cwd, this.options.cloneLocation));

    var res;
    // Get the remote.origin.url
    res = e('git config --get remote.origin.url');
    if (res.code > 0) throw new Error('Can\'t get no remote.origin.url !');

    process.env.repoUrl = process.env.REPO || String(res.output).split(/[\n\r]/).shift();
    if (!process.env.repoUrl) throw new Error('No repo link !');

    ///

    Object.keys(process.env).forEach(function(key){
      process.env[changeCase.snakeCase(key).toUpperCase()] = process.env[key];
    });

    ///
    // console.log(process.env);

    // Remove tmp file
    e('rm -rf $CLONE_LOCATION');

    ///

    // Clone the repo branch to a special location (clonedRepoLocation)
    res = e('git clone --branch=$BRANCH --single-branch $REPO_URL $CLONE_LOCATION');
    if (res.code > 0) {
      // try again without banch options
      res = e('git clone $REPO_URL $CLONE_LOCATION');
      if (res.code > 0) throw new Error('Can\'t clone !');
    }

    ///

    // Go to the cloneLocation aka destPath
    sh.cd(destPath);

    if (sh.pwd() !== destPath) {
      throw new Error('Can\'t access to the clone location : ' + destPath + ' from ' + sh.pwd());
    }

    e('git clean -f -d');
    e('git fetch origin');

    // Checkout a branch (create an orphan if it doesn't exist on the remote).
    res = e('git ls-remote --exit-code . origin/$BRANCH');
    if (res.code > 0) {
      // branch doesn't exist, create an orphan
      res = e('git checkout --orphan $BRANCH');
      if (res.code > 0) throw new Error('Can\'t clone !');
    } else {
      // branch exists on remote, hard reset
      e('git checkout $BRANCH');
    }

    return new Deployor(options);
  };

  Deployor.prototype = {
    extraClean : function(){
      // Empty the clone
      e('git rm --ignore-unmatch -rfq \'\\.[^\\.]*\' *');
    },
    copy : function(srcPath){
      console.log(this, srcPath, this.options)
      process.env.SRC_PATH = path.resolve(path.join(this.options.cwd, srcPath));

      var res;
      // Copie the targeted files
      res = e('cp -rf $SRC_PATH/* ./');
      if (res && res.code > 0) throw new Error(res.output);
      res = e('cp -rf "$SRC_PATH/.[a-zA-Z0-9]*" ./');
    },
    commit : function(commitMessage){
      process.env.COMMIT_MESSAGE = commitMessage;
      e('git config --global user.email');
      e('git commit -am $COMMIT_MESSAGE');
    },
    tag : function(tagMessage){
      process.env.TAG_MESSAGE = tagMessage;
      var res = e('git tag $TAG_MESSAGE');
      if (res.code > 0) console.log('Can\'t tag failed, continuing !');
    },
    push : function(){
      e('git push --tags origin $BRANCH');
    }
  };

  ///


  var distWorkspace = Deployor.cloneRepoBranch('dist', '.tmp/dist', {
    orphan : true
  });

  distWorkspace.extraClean();
  distWorkspace.copy('dist');
  distWorkspace.commit('Update ' + new Date().toISOString());
  distWorkspace.tag('v' + pkg.version);
  distWorkspace.push();
});


////


gulp.task('old-trial', function(){
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
