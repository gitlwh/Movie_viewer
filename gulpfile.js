'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var sync = $.sync(gulp).sync;
var del = require('del');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');
var imagemin = require('gulp-imagemin');
var imageminMozjpeg = require('imagemin-mozjpeg');

var bundler = {
    w: null,
    init: function() {
        this.w = watchify(browserify({
            entries: ['./app/scripts/app.js'],
            insertGlobals: true,
            cache: {},
            packageCache: {}
        }));
    },
    bundle: function() {
        return this.w && this.w.bundle()
            .on('error', $.util.log.bind($.util, 'Browserify Error'))
            .pipe(source('app.js'))
            .pipe(gulp.dest('dist/scripts'));
    },
    watch: function() {
        this.w && this.w.on('update', this.bundle.bind(this));
    },
    stop: function() {
        this.w && this.w.close();
    }
};

gulp.task('styles', function() {
      return gulp.src('app/styles/main.scss')
        .pipe(sass({})
        .on('error', sass.logError))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('dist/styles'))
        .pipe($.size());
});

gulp.task('scripts', function() {
    bundler.init();
    return bundler.bundle();
});

gulp.task('html', function() {
    return gulp.src('app/*.html')
        .pipe($.useref())
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

gulp.task('images', function() {
    return gulp.src('app/images/**/*')
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 7}),
            imageminMozjpeg({
                quality: 40
            })
        ],{verbose:true}))
        .pipe(gulp.dest('dist/images/'))
        .pipe($.size());
});

gulp.task('fonts', function() {
    return gulp.src(['app/fonts/**/*', 'app/bower_components/bootstrap-sass-official/assets/fonts/**/*'])
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});

gulp.task('extras', function() {
    return gulp.src(['app/*.txt', 'app/*.ico'])
        .pipe(gulp.dest('dist/'))
        .pipe($.size());
});

gulp.task('serve', function() {
    gulp.src('dist')
        .pipe($.webserver({
            livereload: true,
            port: 9000,
            open: true
        }));
});

gulp.task('set-production', function() {
    process.env.NODE_ENV = 'production';
});

gulp.task('minify:js', function() {
    return gulp.src('dist/scripts/**/*.js')
        .pipe($.uglify())
        .pipe(gulp.dest('dist/scripts/'))
        .pipe($.size());
});

gulp.task('minify:css', function() {
    return gulp.src('dist/styles/**/*.css')
        .pipe($.minifyCss())
        .pipe(gulp.dest('dist/styles'))
        .pipe($.size());
});

gulp.task('copy-docs', function() {
    return gulp.src('dist/**/*')
        .pipe(gulp.dest('docs/'))
        .pipe($.size());
});

gulp.task('minify', ['minify:js', 'minify:css']);

gulp.task('clean', del.bind(null, ['dist', 'docs']));

gulp.task('bundle', ['html', 'styles', 'scripts', 'images', 'fonts', 'extras']);

gulp.task('clean-bundle', sync(['clean', 'bundle']));

gulp.task('build', ['clean-bundle'], bundler.stop.bind(bundler));

gulp.task('build:production', sync(['set-production', 'build', 'minify', 'copy-docs']));

gulp.task('serve:production', sync(['build:production', 'serve']));


gulp.task('default', sync(['clean-bundle', 'serve','copy-docs']), function() {
    bundler.watch();
    gulp.watch('app/scripts/**/*.js', sync(['scripts','copy-docs']));
    gulp.watch('app/*.html', sync(['html','copy-docs']));
    gulp.watch('app/styles/**/*.scss', sync(['styles','copy-docs']));
    gulp.watch('app/images/**/*', sync(['images','copy-docs']));
    gulp.watch('app/fonts/**/*', sync(['fonts','copy-docs']));
});


gulp.task('watch', function() {
    bundler.watch();
    gulp.watch('app/scripts/**/*.js', ['scripts','watch','copy-docs']);
    gulp.watch('app/*.html', ['html','watch','copy-docs']);
    gulp.watch('app/styles/**/*.scss', ['styles','watch','copy-docs']);
    gulp.watch('app/images/**/*', ['images','watch','copy-docs']);
    gulp.watch('app/fonts/**/*', ['fonts','watch','copy-docs']);
})