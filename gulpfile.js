'use strict';

var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    clean = require('gulp-clean'),
	processhtml = require('gulp-processhtml'),
	uglify = require('gulp-uglify'),
	fs = require('fs'),
	replace = require('gulp-replace'),
	debug = require('gulp-debug');

var releaseFolder = "release";
var packageJson = JSON.parse(fs.readFileSync('./package.json'));

gulp.task('clean', function () {
	return gulp.src(releaseFolder, {read: false})
		.pipe(clean());
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', ['clean'], function () {
	var tsProject = ts.createProject('tsconfig.json', {outFile: "app.js"});
    var tsResult = tsProject.src().pipe(ts(tsProject));

    return tsResult.js.pipe(gulp.dest("./"));
});

gulp.task('copy-release', ['clean'], function () {
	return gulp.src([
		'./templates/**/*.html',
		'./lib/**/*.js',
		'./assets/**/*.*',
		'./css/**/*.css'
	], {base: './'})
  		.pipe(gulp.dest(releaseFolder));
});

gulp.task('process-html', ['clean'], function () {
	return gulp.src("index.html")
		   .pipe(processhtml())
		   .pipe(gulp.dest(releaseFolder));
});

gulp.task('uglify', ['compile-ts'], function () {
	return gulp.src("app.js")
		   .pipe(uglify())
		   .pipe(gulp.dest(releaseFolder));
});

gulp.task('replace', ['uglify','process-html','copy-release'], function () {
	return gulp.src([releaseFolder + '/**/*.html',releaseFolder + '/app.js'])
		   .pipe(replace( "__applicationVersionNumber__", packageJson.version ))
		   .pipe(gulp.dest(releaseFolder));
});

gulp.task('default', ['clean','compile-ts','copy-release','process-html','uglify','replace']);
