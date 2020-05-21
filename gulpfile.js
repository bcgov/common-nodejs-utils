//
// Copyright © 2018 Province of British Columbia
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Created by Jason Leach on 2018-01-10.
//

/* eslint-env es6 */

'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const clean = require('gulp-clean');

gulp.task('clean', () =>
  gulp.src('dist', { read: false, allowEmpty: true }).pipe(
    clean({
      force: true,
    })
  )
);

gulp.task('transpile', () => gulp.src('src/**/*.js').pipe(babel()).pipe(gulp.dest('dist')));

gulp.task('copy-node-config', () => {
  return gulp.src(['package.json']).pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.series('clean', gulp.parallel('transpile')));
