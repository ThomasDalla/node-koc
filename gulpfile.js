var gulp   = require('gulp'),
    mocha  = require('gulp-mocha'),
    argv   = require('yargs').argv,
    del    = require('del'),
    open   = require("gulp-open"),
    jshint = require('gulp-jshint'),
    jsdoc  = require("gulp-jsdoc");

gulp.task('test', function() {
    gulp
        .src('test/*.js', {
            read: false,
        })
        .pipe(mocha({
            grep: argv.grep === undefined ? '' : argv.grep,
            reporter: argv.reporter === undefined ? 'nyan' : argv.reporter,
        }));
});

gulp.task('jshint', function() {
    gulp.src('*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    gulp.src('lib/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    gulp.src('test/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('jsdoc:clean', function() {
    return del('./doc/**');
});

gulp.task('jsdoc:generate', [ 'jsdoc:clean' ], function() {
    return gulp.src( [ "*.js", "lib/*.js", "test/*.js", "README.md" ] )
      .pipe(jsdoc('./doc'));
});

gulp.task('jsdoc', [ 'jsdoc:clean', 'jsdoc:generate' ], function() {
    return gulp.src("./doc/index.html")
      .pipe(open());
} );

gulp.task('default', [ 'jshint', 'jsdoc', 'test' ]); // ! Async !