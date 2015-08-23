var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('watch', function () {
  gulp.watch('./js/**/*.js', ['js']);
  gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('vendor', function() {  
	return gulp.src('vendor/*.js')
				.pipe(sourcemaps.init())
				.pipe(concat('vendor.js'))
				.pipe(uglify())
				.pipe(sourcemaps.write())
				.pipe(gulp.dest('build/vendor.js'))
});

gulp.task('js', function() {  
	return gulp.src('js/**/*.js')
				.pipe(sourcemaps.init())
				.pipe(concat('app.js'))
				.pipe(uglify())
				.pipe(sourcemaps.write())
				.pipe(gulp.dest('build'))
});

gulp.task('sass', function () {
	return gulp.src('./sass/**/*.scss')
			    .pipe(sourcemaps.init())
			    .pipe(sass().on('error', sass.logError))
		        .pipe(autoprefixer({
		            browsers: ['last 2 versions', 'IE >= 9', 'Firefox >= 18', 'Chrome >= 24', 'Safari >= 4'],
		            cascade: false
		        }))
			    .pipe(sourcemaps.write())
			    .pipe(gulp.dest('./build'));
});