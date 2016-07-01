var gulp                    = require('gulp'),
    sass                    = require('gulp-sass'),
    concat                  = require('gulp-concat'),
    uglify                  = require('gulp-uglify'),
    imagemin                = require('gulp-imagemin'),
    pngquant                = require('imagemin-pngquant'),
    autoprefixer            = require('gulp-autoprefixer'),
    minifyCss               = require('gulp-cssnano'),
    runSequence             = require('run-sequence'),
    jshint                  = require('gulp-jshint'),
    clean                   = require('gulp-clean'),
    sourcemaps              = require('gulp-sourcemaps'),

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
      .pipe(sass())
      .pipe(autoprefixer({
          browsers: ['last 2 versions', 'ie 9', 'android 4', 'opera 12'],
          cascade: false,
          zindex: true
      }))
      .pipe(_if(!development, minifyCss({
        discardComments: {removeAll: true},
        compatibility: 'ie8',
        zindex: false
      }))) //disable minifyCss for developer
    .pipe(_if(development, sourcemaps.write('../maps'))) //adds sourcemaps for developer
    .pipe(gulp.dest('www/css'))
});

// Scripts
gulp.task('scripts:main', ['jshint'], function () {
  gulp.src([
    './assets/scripts/**/*.js'
  ])
    .pipe(_if(development, sourcemaps.init())) //adds sourcemaps for developer
      .pipe(concat('main.js'))
      .pipe(_if(!development, uglify())) //disable minify js for developer
    .pipe(_if(development, sourcemaps.write())) //adds sourcemaps for developer
    .pipe(gulp.dest('www/js'));
});

// Plugins Scripts
gulp.task('scripts:plugins', function () {
  gulp.src([
    'bower_components/bootstrap-sass/assets/javascripts/bootstrap.js'
  ])
    .pipe(concat('plugins.js'))
    .pipe(uglify())
    .pipe(gulp.dest('www/js'));
});

// Vendor Scripts
gulp.task('scripts:vendor', function () {
  gulp.src([
    'bower_components/jquery/dist/jquery.min.js'
  ])
    .pipe(uglify())
    .pipe(gulp.dest('www/js/vendor'));
});

// Fonts
gulp.task('fonts', function () {
  gulp.src([
    'bower_components/bootstrap-sass/assets/fonts/bootstrap/*.{eot,svg,ttf,woff,woff2}',
    'bower_components/lightcase/src/fonts/*.{eot,svg,ttf,woff,woff2}',
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
      formats: ['ttf', 'eot', 'woff', 'svg', 'woff2']
     }))
    .pipe(gulp.dest('assets/fonts'));
});

// Images
gulp.task('images', function() {
  gulp.src('./assets/images/**/*.{gif,jpg,png,svg}')
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(gulp.dest('www/img'));
});

// Videos
gulp.task('videos', function() {
  gulp.src('./assets/videos/**/*.{mp4,webm}')
    .pipe(gulp.dest('www/videos'));
});

// Serve - Live reload server
// @link http://www.browsersync.io/docs/gulp/
gulp.task('serve', ['watch'], function() {
  browserSync.init({
    files: [
      "./www/css/*.*",
      "./www/img/*.*",
      "./www/videos/*.*",
      "./www/js/*.*",
      "./www/fonts/*.*",
      "./www/icons/*.*",
      "./www/**/*.html",
    ],
    // Local livereload
    // gulp serve
    proxy: "http://www.local.dev"
  });

  gulp.watch('./www/**/*.{html,php}').on('change', browserSync.reload);
});

// Watch
gulp.task('watch', function() {
  gulp.watch('./assets/styles/**/*.scss', ['styles']);
  gulp.watch('./assets/icons/**/*.svg', ['iconfont']);
  gulp.watch('./assets/scripts/**/*.js', ['jshint', 'scripts:main']);
  gulp.watch('./assets/images/**/*.{gif,jpg,png,svg}', ['images']);
  gulp.watch('./assets/sprites/**/*.png', ['sprites']);
  gulp.watch('./assets/videos/**/*.{mp4,webm}', ['videos']);
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
