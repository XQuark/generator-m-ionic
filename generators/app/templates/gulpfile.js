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
  manage: [
    {name:'update platform ios', value:'platform update android'},
    {name:'update platform android', value:'platform update android'},
    {name:'add platform ios', value:'platform add ios'},
    {name:'add platform android', value:'platform add android'},
    {name:'platforms', value:'platforms ls'},
    {name:'plugin list', value:'plugin list'},
    {name:'plugin search', value:'plugin search'},
    {name:'plugin add', value:'plugin add'},
    {name:'plugin rm', value:'plugin rm'}
  ],
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

  if (options.cordova) {
    return gulp.start('cordova');
  } else {
    gulp.src('').pipe(prompt.prompt(questions, function(answers) {
      console.log(chalk.green('执行目标：\'' + answers.purpose + '\''));
      console.log(chalk.green('执行任务：\'' + answers.command + '\''));

      var cm = answers.command || '';
      switch(answers.purpose)
      {
        case 'dev':
          if (cm.indexOf('watch') >= 0) {
            return gulp.start('watch');
          } else if (cm.indexOf('run') >= 0 || cm.indexOf('emulate') >= 0) {
            options.cordova = cm;
            return gulp.start('cordova');
          } else {
            console.log(chalk.red('找不到任何有效的命令执行'));
          }
          break;
        case 'manage':
          if (cm.indexOf('plugin search') >=0 || cm.indexOf('plugin add') >=0 || cm.indexOf('plugin rm') >=0) {
            var subCommand = cm.split(' ')[1];
            console.log(subCommand);
            switch (subCommand) {
              case 'search':
                    gulp.src('').pipe(prompt.prompt(
                      {
                        type: "input",
                        name: "searchKeyWords",
                        message: "请输入插件的关键字搜索，多关键字以空格隔开"
                      }, function(value) {
                        options.cordova = cm + ' ' + value.searchKeyWords;
                        return gulp.start('cordova');
                      }));
                    break;
              case 'add':
              case 'rm':
                    gulp.src('').pipe(prompt.prompt(
                      {
                        type: "input",
                        name: "pluginName",
                        message: "请输入插件名称"
                      }, function(value) {
                        options.cordova = cm + ' ' + value.pluginName;
                        return gulp.start('cordova');
                      }));
                    break;
              default :
                    console.log(chalk.red('找不到任何有效的命令执行'));
            }
          } else {
            options.cordova = cm;
            return gulp.start('cordova');
          }
          break;
        case 'test':
          //todo add test commands
          break;
        default:
      }
    }));
  }
});
