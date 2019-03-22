// https://css-tricks.com/gulp-for-wordpress-creating-the-tasks/

// Gulp module imports
import { src, dest, watch, series, parallel } from 'gulp';
import yargs from 'yargs';

// Styles
import sass from 'gulp-sass';
import gulpif from 'gulp-if';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';

// Images
import imagemin from 'gulp-imagemin';

// Sprites
import spritesmith from 'gulp.spritesmith';
import merge from 'merge-stream';
import buffer from 'vinyl-buffer';

// iconFont
import iconfont from 'gulp-iconfont';
import iconfontCss from 'gulp-iconfont-css';
const fontName = 'HSPFont';

// Scripts
import webpack from 'webpack-stream';

// Dev
import browserSync from "browser-sync";
import del from 'del';


// Build Directories
// ----
const dirs = {
  src: 'assets',
  dest: 'build'
};



// File Sources
// ----
const sources = {
  styles: `${dirs.src}/styles/main.scss`,
  images: `${dirs.src}/images/**/*.{jpg,jpeg,png,svg,gif}`,
  sprites: `${dirs.src}/sprites/*.png`,
  icons: `${dirs.src}/icons/*.svg`,
  fonts: `${dirs.src}/fonts/*.{eot,svg,ttf,woff,woff2}`,
  scripts: `${dirs.src}/scripts/main.js`
};

// Recognise `--production` argument
const argv = yargs.argv;
const PRODUCTION = !!argv.production;


// Main Tasks
// ----

// Styles
export const styles = () => {
  return src(`${sources.styles}`)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(PRODUCTION, postcss([ autoprefixer ])))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(dest('www/css'))
    .pipe(server.stream());
}

// Images
export const images = () => {
  return src(`${sources.images}`)
    .pipe(gulpif(PRODUCTION, imagemin()))
    .pipe(dest('www/img'))
    .pipe(server.stream());
}

// Sprites
export const sprites = () => {
  const spriteData = src(`${sources.sprites}`).pipe(spritesmith({
    padding: 10,
    imgName: '../images/sprites.png',
    imgPath: '../img/sprites.png',

    retinaSrcFilter: './assets/sprites/*@2x.png',
    retinaImgName: '../images/sprites@2x.png',
    retinaImgPath: '../img/sprites@2x.png',

    cssName: '_sprites.scss'
  }));

  const imgStream = spriteData.img
    .pipe(buffer())
    .pipe(dest('./assets/images/'));

  const cssStream = spriteData.css
    .pipe(dest('./assets/styles/mixins/'));

  return merge(imgStream, cssStream)
}

// iconFonts
export const icons = () => {
  return src(`${sources.icons}`)
    .pipe(iconfontCss({
      fontName: fontName,
      targetPath: '../styles/components/_icons.scss',
      fontPath: '../../assets/fonts/'
    }))
    .pipe(iconfont({
      fontName: fontName,
      formats: ['woff', 'woff2'],
      fontHeight: 1000,
      normalize: true,
      centerHorizontally: true
    }))
    .pipe(dest('./assets/fonts'));
}

// Images
export const fonts = () => {
  return src(`${sources.fonts}`)
    .pipe(dest('www/fonts'))
    .pipe(server.stream());
}


// Scripts
export const scripts = () => {
  return src(`${sources.scripts}`)
    .pipe(webpack({
      module: {
        rules: [
          {
            test: /\.js$/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: []
              }
            }
          }
        ]
      },
      mode: PRODUCTION ? 'production' : 'development',
      devtool: !PRODUCTION ? 'inline-source-map' : false,
      output: {
        filename: 'bundle.js'
      },
      externals: {
        // jquery: 'jQuery'
      },
    }))
    .pipe(dest('./www/js'));
}

// Clean
export const clean = () => del([
  './www/fonts',
  './www/icons',
  './www/css',
  './www/img',
  './www/js',
]);

// Watch Task
export const watchForChanges = () => {
  watch(`${sources.styles}`, series(styles, reload));
  watch(`${sources.images}`, series(images, reload));
  watch(`${sources.sprites}`, series(sprites, images, reload));
  watch(`${sources.icons}`, series(icons, images, reload));
  watch(`${sources.fonts}`, series(fonts, reload));
  watch(`${sources.scripts}`, series(scripts, reload));
  watch("./www/**/*.html", reload);
}

// Server & Reload
const server = browserSync.create();
export const serve = done => {
  server.init({
    server: "./www",
    // proxy: "localhost:8888"
  });
  done();
};
export const reload = done => {
  server.reload();
  done();
};


// Development Task
export const dev = series(clean, sprites, icons, parallel(styles, images, scripts, fonts), serve, watchForChanges);

// Serve Task
// export const build = series(clean, parallel(buildStyles, buildViews, buildScripts));
// export const build = series(clean, parallel(buildStyles, buildScripts));

// Default task
export default dev;
