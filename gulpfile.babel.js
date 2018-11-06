const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const browserify = require('browserify');
const gutil = require('gulp-util');
const source = require('vinyl-source-stream');
const babelify = require('babelify');

/*
 * Handles an error event.
 */
function swallowError(error) {
  gutil.log(error);
  this.emit('end');
}

// Babelify
function babelifyJs() {
  return browserify('./assets/scripts/main.js', { entry: true,
      // insertGlobals: true,
      extensions: ['.js'], 
      debug: true
    }).transform(babelify, {presets: ["@babel/env"]})
    .bundle()
    .on('error', function (err) {
      gutil.log(err.message);
      this.emit('end');
    })
    .pipe(source('bundle.js'))
    .on('error', swallowError)
    .pipe(gulp.dest('./www/js'));
};

// Babel
function scripts() {
  return gulp
    .src('./assets/scripts/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(concat('bundle.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./www/js'))
};
// gulp.task('default', () =>
//     gulp.src('./assets/scripts/**/*.js')
//         .pipe(sourcemaps.init())
//         .pipe(babel({
//             presets: ['@babel/env']
//         }))
//         .pipe(concat('bundle.js'))
//         .pipe(sourcemaps.write('./www/js'))
//         .pipe(gulp.dest('./www/js'))
// );

// gulp.task("compile", compile);

gulp.task('build', function() { return scripts(); });
gulp.task('babelify', function() { return babelifyJs(); });
// gulp.task('watch', function() { return watch(); });

// gulp.task('default', ['scripts']);