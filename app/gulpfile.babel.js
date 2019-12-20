import { src, dest, watch, series, parallel } from 'gulp';
import gulp from "gulp"
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';
import webpack from 'webpack-stream';
import named from 'vinyl-named';
import browserSync from "browser-sync";



// Lets you call PRODUCTION as prod from commandline
const PRODUCTION = yargs.argv.prod;

// Set up auto task to watch for any changes that may occur in our files
export const watchForChanges = () => {
  watch('scss-js/scss/**/*.scss', gulp.series('styles'));
  watch('scss-js/js/**/*.js', scripts);
}



const server = browserSync.create();
export const serve = done => {
  server.init({
    // TODO The hostname is the name of your service in docker-compose.yml.
    // TODO The port is what's defined in your Dockerfile.
    proxy: "localhost:8000",
    open: false
  });
  done();
};
export const reload = done => {
  server.reload();
  done();
};

// Compile SCSS through styles command
export const styles = () => {
    // Want more than one SCSS file? Just turn the below string into an array
  return src('scss-js/scss/bundle.scss')
      // If we're in dev, init sourcemaps. Any plugins below need to be compatible with sourcemaps.
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
      // Throw errors
    .pipe(sass().on('error', sass.logError))
      // In production use auto-prefixer, fix general grid and flex issues.
    .pipe(
      gulpif(
        PRODUCTION,
        postcss([
          autoprefixer({
            grid: true
          }),
          require("postcss-flexbugs-fixes"),
          require("postcss-preset-env")
        ])
      )
    )
    .pipe(gulpif(PRODUCTION, cleanCss({compatibility:'ie8'})))
      // In dev write source maps
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
      // TODO: Update this source folder
    .pipe(dest('blog/static/blog/'))
    .pipe(server.stream());
}

// Compile ES6

export const scripts = () => {
    // Want more than one JS file? Just pass an array through this return function and look at the vinyl-named docs
  return src('scss-js/js/bundle.js')
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
      // Inline-source-map can be slow for big projects
    devtool: !PRODUCTION ? 'inline-source-map' : false,
    output: {
      filename: 'bundle.js'
    },
  }))
      // TODO Set Destination
  .pipe(dest('blog/static/blog'));
}

export const dev = series(parallel(styles, scripts), serve, watchForChanges);
