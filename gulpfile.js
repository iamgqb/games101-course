const gulp = require('gulp');
const del = require('del');
const rollupTypescript = require('rollup-plugin-typescript');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const rollupEach = require('gulp-rollup-each');
const rename = require('gulp-rename');

async function delBuild() {
  return await del('build/');
}

function copy() {
  return gulp.src(['src/**/*', '!src/**/*.ts'])
    .pipe(gulp.dest('build/'));
}

async function buildTs() {
  return gulp.src('src/**/*.ts')
    .pipe(rollupEach({
      // format: 'es',
      plugins: [
        resolve(),
        commonjs(),
        rollupTypescript(),
      ]
    }))
    .pipe(rename({
      extname: '.js',
    }))
    .pipe(gulp.dest('build/'))
}


exports.watch = () => {
  this.build();
  gulp.watch('src/**/*', this.build);
}
exports.build = gulp.series(delBuild, copy, buildTs);