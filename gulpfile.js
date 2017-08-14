var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("default", function () {

  var tsResult = gulp.src('src/**/*.ts')
    .pipe(tsProject());

  return tsResult
    .pipe(gulp.dest("dist"));
});
