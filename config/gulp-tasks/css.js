import cleanCss from 'gulp-clean-css';
import webpcss from 'gulp-webpcss';
import autoprefixer from 'gulp-autoprefixer';
import groupCssMediaQueries from 'gulp-group-css-media-queries';

export const css = () => {
	return app.gulp.src(`${app.path.build.css}style.css`, {})
		.pipe(app.plugins.plumber(
			app.plugins.notify.onError({
				title: "CSS",
				message: "Error: <%= error.message %>"
			})))
		.pipe(
			app.plugins.if(
				app.isBuild,
				groupCssMediaQueries()
			)
		)
		.pipe(
			app.plugins.if(
				app.isBuild,
				autoprefixer({
					grid: false,
					overrideBrowserslist: ["last 1 versions"],
					cascade: true
				})
			)
		)
		/*
		.pipe(
			app.plugins.if(
				app.isWebP,
				app.plugins.if(
					app.isBuild,
					webpcss(
						{
							webpClass: ".webp",
							noWebpClass: ".no-webp"
						}
					)
				)
			)
		)
		*/
		.pipe(
			app.plugins.if(
				app.isBuild,
				cleanCss({
					format: 'beautify',
					level: {
						1: {
							tidySelectors: false
						}
					}
				})
			)
		)
		.pipe(app.gulp.dest(app.path.build.css))
		.pipe(
			app.plugins.if(
				app.isBuild,
				cleanCss({
					level: {
						1: {
							tidySelectors: false
						}
					}
				})
			)
		)
		.pipe(app.plugins.rename({ suffix: ".min" }))
		.pipe(app.gulp.dest(app.path.build.css));
}



















// import gulpSass from 'gulp-sass';  // Импортируем модуль gulp-sass
// import dartSass from 'sass';       // Импортируем Sass компилятор

// const sass = gulpSass(dartSass);   // Настраиваем компилятор для использования dart-sass

// import cleanCss from 'gulp-clean-css';
// import autoprefixer from 'gulp-autoprefixer';
// import groupCssMediaQueries from 'gulp-group-css-media-queries';

// export const css = () => {
//   return app.gulp.src(['src/scss/*.scss', '!src/scss/**/_*.scss', '!src/scss/style.scss'])  // Исключаем SCSS с подчеркиванием
//     .pipe(app.plugins.plumber(
//       app.plugins.notify.onError({
//         title: "SCSS",
//         message: "Error: <%= error.message %>"
//       })
//     ))
//     .pipe(sass())  // Компиляция SCSS
//     .pipe(app.plugins.if(app.isBuild, groupCssMediaQueries()))  // Группировка медиазапросов
//     .pipe(app.plugins.if(app.isBuild, autoprefixer({            // Добавление префиксов
//       grid: true,
//       overrideBrowserslist: ["last 2 versions"],
//       cascade: true
//     })))
//     .pipe(app.gulp.dest(app.path.build.css));  // Сохранение результата
// };
