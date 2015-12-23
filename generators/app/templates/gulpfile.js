'use strict';
var gulp = require('gulp');
var minimist = require('minimist');
var requireDir = require('require-dir');
var chalk = require('chalk');
var fs = require('fs');
var prompt = require('gulp-prompt');
var inq = require('inquirer');

// config
gulp.paths = {
  dist: 'www',
  jsFiles: ['app/**/*.js', '!app/bower_components/**/*.js'],
  jsonFiles: ['app/**/*.json', '!app/bower_components/**/*.json'],
  templates: ['app/*/templates/**/*'],
  karma: ['test/karma/**/*.js'],
  protractor: ['test/protractor/**/*.js']
};

// OPTIONS
var options = gulp.options = minimist(process.argv.slice(2));

// set defaults
var task = options._[0]; // only for first task
var gulpSettings;
if (fs.existsSync('./gulp/.gulp_settings.json')) {
  gulpSettings = require('./gulp/.gulp_settings.json');
  var defaults = gulpSettings.defaults;
  if (defaults) {
    // defaults present for said task?
    if (task && task.length && defaults[task]) {
      var taskDefaults = defaults[task];
      // copy defaults to options object
      for (var key in taskDefaults) {
        // only if they haven't been explicitly set
        if (options[key] === undefined) {
          options[key] = taskDefaults[key];
        }
      }
    }
  }
}

// environment
options.env = options.env || 'dev';
// print options
if (defaults && defaults[task]) {
  console.log(chalk.green('defaults for task \'' + task + '\': '), defaults[task]);
}
// cordova command one of cordova's build commands?
if (options.cordova) {
  var cmds = ['build', 'run', 'emulate', 'prepare', 'serve'];
  for (var i = 0, cmd; ((cmd = cmds[i])); i++) {
    if (options.cordova.indexOf(cmd) >= 0) {
      options.cordovaBuild = true;
      break;
    }
  }
}

// load tasks
requireDir('./gulp');

//init questions
var purposes = ['dev','manage','test'];
var commands = {
  dev: [
    {name:'watch on browser', value:'watch'},
    {name:'run ios', value:'run ios --device'},
    {name:'run android', value:'run android --device --lc'},
    {name:'emulate ios', value:'emulate ios'},
    {name:'emulate android', value:'emulate android'}
  ],
  manage: [],
  test: []
};

var questions = [
  {
    type: "list",
    name: "purpose",
    message: '请选择常用的命令',
    choices: purposes
  },
  {
    type: "list",
    name: "command",
    message: '请指定具体的操作',
    choices: function ( answers ) {
      return commands[answers.purpose];
    }
  }
];

// default task
gulp.task('default', function () {
  gulp.src('').pipe(prompt.prompt(questions, function(answers) {
    console.log(chalk.green('执行目标：\'' + answers.purpose + '\''));
    console.log(chalk.green('执行任务：\'' + answers.command + '\''));

    switch(answers.purpose)
    {
      case 'dev':

        var cm = answers.command || '';
        if (cm.indexOf('watch') >= 0) {
          return gulp.start('watch');
        } else if (cm.indexOf('run') >= 0 || cm.indexOf('emulate') >= 0) {
          options.cordova = cm;
          return gulp.start('cordova-with-build');
        } else {
          console.log(chalk.red('找不到任何有效的命令执行'));
        }
        break;
      case 'manage':
        //todo add plugins
        break;
      case 'test':
        //todo add test commands
        break;
      default:
    }
    //// cordova build command & gulp build
    //if (options.cordovaBuild && options.build !== false) {
    //  return gulp.start('cordova-with-build');
    //}
    //// cordova build command & no gulp build
    //else if (options.cordovaBuild && options.build === false) {
    //  return gulp.start('cordova-only-resources');
    //}
    //// cordova non-build command
    //else if (options.cordova) {
    //  return gulp.start('cordova');
    //}
    //// just watch when cordova option not present
    //else {
    //  return gulp.start('watch');
    //}
  }));
});
