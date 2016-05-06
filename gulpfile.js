'use strict';

var releaseFolder = "release";

var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    clean = require('gulp-clean'),
	processhtml = require('gulp-processhtml'),
	uglify = require('gulp-uglify');

gulp.task('clean', function (callback) {
	return gulp.src(releaseFolder, {read: false})
		.pipe(clean());

	callback();
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', ['clean'], function (callback) {
	var tsProject = ts.createProject('tsconfig.json', {outFile: "app.js"});
    var tsResult = tsProject.src().pipe(ts(tsProject));

    return tsResult.js.pipe(gulp.dest("./"));

	callback();
});

gulp.task('copy-release', ['clean'], function () {
	gulp.src([
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

gulp.task('default', ['clean','compile-ts','copy-release','process-html','uglify']);
