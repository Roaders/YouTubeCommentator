'use strict';

var gulp = require('gulp'),
    ts = require('gulp-typescript');

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', function () {
	var tsProject = ts.createProject('tsconfig.json', {outFile: "app.js"});
    var tsResult = tsProject.src().pipe(ts(tsProject));

    return tsResult.js.pipe(gulp.dest('release'));
});

gulp.task('default', ['compile-ts']);
