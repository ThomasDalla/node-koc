var gulp   = require('gulp'),
    mocha  = require('gulp-mocha'),
    argv   = require('yargs').argv,
    jshint = require('gulp-jshint');

gulp.task('test', function() {
    return gulp
        .src('test/*.js', {
            read: false,
        })
        .pipe(mocha({
            grep: argv.grep === undefined ? '' : argv.grep,
            reporter: argv.reporter === undefined ? 'nyan' : argv.reporter,
        }));
});

gulp.task('jshint', function () {
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

gulp.task('default', [ 'jshint', 'test' ]);