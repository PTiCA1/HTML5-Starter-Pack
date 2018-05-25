var   gulp                    = require('gulp'),
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
      path                    = require('path'),
      webpack                 = require('webpack-stream'),

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
      development             = true,

      browserSync             = require('browser-sync').create(),
      reload                  = browserSync.reload,

      UglifyJsPlugin          = require('uglifyjs-webpack-plugin');

// Clean
gulp.task('clean-all', function () {
  return gulp.src([
      '**/.DS_Store',
      'www/css/*',
      'www/img/*',
      'www/fonts/*',
      'www/js/**/*',
      'www/videos/**/*',
      'www/maps'
    ], {read: false})
    .pipe(clean());
});

// Sprites
gulp.task('sprites', function () {
  var spriteData = gulp.src('assets/sprites/*.png').pipe(spritesmith({
    padding: 2,
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
        browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1'],
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
    .pipe(webpack({
      cache: true,
      output: {
        path: path.join(__dirname, 'www/js'),
        library: 'Library',
        filename: 'bundle.js',
        libraryTarget: 'umd'
      },
      devtool: development ? 'eval-source-map' : 'nosources-source-map',
//       devtool: 'nosources-source-map',
//       entry: ['babel-polyfill', 'assets/scripts/main.js'],
      module: {
        loaders: [{
          loader: ['babel-loader', 'jshint-loader'],
          query: {
            presets: ['es2015', 'stage-0']
          },
          exclude: [
            path.resolve(__dirname, 'node_modules/')
          ],
        }],
        rules: [
          { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
          {
            test: require.resolve('jquery'),
            use: [{
              loader: 'expose-loader',
              options: 'jQuery'
            },{
              loader: 'expose-loader',
              options: '$'
            }]
          }
        ]
      },
      resolve: {
        modules: ["node_modules"]
      },
      plugins: [

        // https://webpack.js.org/plugins/no-emit-on-errors-plugin/
        // new webpack.NoEmitOnErrorsPlugin()

        // https://webpack.js.org/loaders/eslint-loader/#noerrorsplugin
        // new webpack.NoErrorsPlugin()
      ].concat(
        development ? [] : [

          // https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
          new UglifyJsPlugin({
            uglifyOptions: {
              output: {
                comments: false
              },
              compress: {
                drop_console: true
              }
            }
          })
        ]
      )
    }))
    .on('error', function webpackError() {
      this.emit('end');
    })
    .pipe(gulp.dest('www/js'))
    .pipe(browserSync.stream());
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
    server: "./www",
//     proxy: "http://www.example.dev"
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
    'scripts:main',
    ['iconfont', 'sprites', 'fonts', 'videos'],
    ['images', 'styles'],
    callback);
});

// Default
gulp.task('default', ['clean-all'], function() {
  gulp.start('build');
});
