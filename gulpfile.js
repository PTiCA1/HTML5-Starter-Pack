var gulp                    = require('gulp'),
    sass                    = require('gulp-sass'),
    concat                  = require('gulp-concat'),
    uglify                  = require('gulp-uglify'),
    imagemin                = require('gulp-imagemin'),
    pngquant                = require('imagemin-pngquant'),
    autoprefixer            = require('gulp-autoprefixer'),
    cssnano                 = require('gulp-cssnano'),
    runSequence             = require('run-sequence'),
    jshint                  = require('gulp-jshint'),
    clean                   = require('gulp-clean'),
    sourcemaps              = require('gulp-sourcemaps'),
//     webpack                 = require('webpack'),
    webpackStream           = require('webpack-stream'),

    // Sprites
    // @link https://www.npmjs.com/package/gulp.spritesmith
    spritesmith             = require('gulp.spritesmith'),

    // IconFont
    // @link https://www.npmjs.com/package/gulp-iconfont-css
    iconfont                = require('gulp-iconfont'),
    iconfontCss             = require('gulp-iconfont-css'),
    fontName                = 'HSPFont',

    // Gulp If
    // @link https://github.com/robrich/gulp-if
    _if                     = require('gulp-if'),
    development             = true;

    browserSync             = require('browser-sync').create(),
    reload                  = browserSync.reload;

    const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// Clean
gulp.task('clean-all', function () {
  return gulp.src([
      '**/.DS_Store',
      'www/css/*',
      'www/img/*',
      'www/fonts/*',
      'www/js/**/*',
      'www/videos/**/*',
      'www/maps',
      '!www/js/vendor/'
    ], {read: false})
    .pipe(clean());
});

// JSHint
gulp.task('jshint', function() {
  return gulp.src('./assets/scripts/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

// Sprites
gulp.task('sprites', function () {
  var spriteData = gulp.src('assets/sprites/*.png').pipe(spritesmith({
    imgName: '../images/sprites.png',
    imgPath: '../img/sprites.png',

    retinaSrcFilter: ['assets/sprites/*@2x.png'],
    retinaImgName: '../images/sprites@2x.png',
    retinaImgPath: '../img/sprites@2x.png',

    cssName: '_sprites.scss'
  }));

  spriteData.img.pipe(gulp.dest('assets/images/'));
  spriteData.css.pipe(gulp.dest('assets/styles/mixins/'));
});


// Styles
gulp.task('styles', function() {
  return gulp.src([
    './assets/styles/main.scss'
  ])
    .pipe(_if(development, sourcemaps.init())) //adds sourcemaps for developer

    .pipe(sass().on('error', sass.logError))

    .pipe(autoprefixer({
        browsers: ['last 2 versions', 'android 4', 'opera 12'],
        cascade: false
    }))

    .pipe(_if(!development, cssnano({
      discardComments: {removeAll: true},

      reduceIdents: false, //fix IE10
      reducePositions: false, //fix IE10

      zindex: false
    }))) //disable cssnano for developer

    .pipe(_if(development, sourcemaps.write('../maps'))) //adds sourcemaps for developer

    .pipe(gulp.dest('www/css'))
    .pipe(browserSync.stream());
});


// Scripts
gulp.task('scripts:main', function() {
  return gulp.src('assets/scripts/main.js')
    .pipe(webpackStream({
//       watch: true,
      cache: true,
      output: {
        library: 'Library',
        filename: 'main.js',
        libraryTarget: 'umd'
      },
      module: {
        loaders: [{
          loader: ['babel-loader', 'jshint-loader']
        }]
      },
      resolve: {
        modules: ["node_modules"],
      },
      plugins: [
        // https://webpack.js.org/plugins/no-emit-on-errors-plugin/
//         new webpack.NoEmitOnErrorsPlugin()

        // https://webpack.js.org/loaders/eslint-loader/#noerrorsplugin
//         new webpack.NoErrorsPlugin()
      ].concat(
        development ? [] : [
          // https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
          new UglifyJsPlugin()
        ]
      )
    }))
    .on('error', function webpackError() {
      this.emit('end');
    })
    .pipe(gulp.dest('www/js'))
    .pipe(browserSync.stream());
});

// Plugins Scripts
gulp.task('scripts:plugins', function () {
  gulp.src([
    'node_modules/bootstrap-sass/assets/javascripts/bootstrap.js'
  ])
    .pipe(concat('plugins.js'))
    .pipe(uglify())
    .pipe(gulp.dest('www/js'));
});

// Vendor Scripts
gulp.task('scripts:vendor', function () {
  gulp.src([
    'node_modules/jquery/dist/jquery.min.js'
  ])
    .pipe(uglify())
    .pipe(gulp.dest('www/js/vendor'));
});

// Fonts
gulp.task('fonts', function () {
  gulp.src([
    'node_modules/bootstrap-sass/assets/fonts/bootstrap/*.{eot,svg,ttf,woff,woff2}',
    'assets/fonts/*.{eot,svg,ttf,woff,woff2}'
  ])
    .pipe(gulp.dest('www/fonts'));
});

// IconFonts
gulp.task('iconfont', function(){
  gulp.src(['assets/icons/*.svg'])
    .pipe(iconfontCss({
      fontName: fontName,
      targetPath: '../styles/components/_icons.scss',
      fontPath: '../fonts/'
    }))
    .pipe(iconfont({
      fontName: fontName,
      formats: ['woff', 'woff2'],
      fontHeight: 1000,
      normalize: true,
      centerHorizontally: true
     }))
    .pipe(gulp.dest('assets/fonts'))
    .pipe(browserSync.stream());
});

// Images
gulp.task('images', function() {
  gulp.src('./assets/images/**/*.{gif,jpg,png,svg}')
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(gulp.dest('www/img'))
    .pipe(browserSync.stream());
});

// Videos
gulp.task('videos', function() {
  gulp.src('./assets/videos/**/*.{mp4,webm}')
    .pipe(gulp.dest('www/videos'))
    .pipe(browserSync.stream());
});

// Serve - Live reload server
// @link http://www.browsersync.io/docs/gulp/
gulp.task('serve', ['watch'], function() {

  browserSync.init({
    server: "./www"
  });

  browserSync.watch('./www/**/*.{html,php}').on('change', browserSync.reload);
});

// Watch
gulp.task('watch', function() {
  gulp.watch('**/*', {cwd: './assets/styles/'}, ['styles']).on('change', browserSync.reload);
  gulp.watch('**/*', {cwd: './assets/icons/'}, ['iconfont', 'styles']).on('change', browserSync.reload);
  gulp.watch('**/*', {cwd: './assets/scripts/'}, ['scripts:main']).on('change', browserSync.reload);
  gulp.watch('**/*', {cwd: './assets/images/'}, ['images']).on('change', browserSync.reload);
  gulp.watch('**/*', {cwd: './assets/sprites/'}, ['sprites', 'styles']).on('change', browserSync.reload);
  gulp.watch('**/*', {cwd: './assets/videos/'}, ['videos']).on('change', browserSync.reload);
});

// Build
gulp.task('build', function(callback) {

  // Gulp If
  // remove sourcemaps for developer. This task them for the production site
  development = false;

  runSequence(
    'scripts:plugins',
    'scripts:main',
    'scripts:vendor',
    ['iconfont', 'sprites', 'fonts', 'videos'],
    ['images', 'styles'],
    callback);
});

// Default
gulp.task('default', ['clean-all'], function() {
  gulp.start('build');
});
