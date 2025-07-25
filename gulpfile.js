import path from 'path'
import fs from 'fs'
import { glob } from 'glob'
import pkg from 'gulp'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
import terser from 'gulp-terser'
import sharp from 'sharp'
import plumber from 'gulp-plumber';


const { src, dest, watch, series } = pkg
const sass = gulpSass(dartSass)

const paths = {
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    imagenes: 'src/img/img/**/*'
}



export function css( done ) {
    src(paths.scss, {sourcemaps: true})
        .pipe(plumber())  // Añadir plumber para manejar errores
        .pipe( sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError) )
        .pipe( dest('public/build/css', {sourcemaps: '.'}) );
    done()
}

export function js( done ) {
    src(paths.js)
      .pipe(plumber())  // Añadir plumber para manejar errores
      .pipe(terser())
      .pipe(dest('public/build/js'))
    done()
}

export async function imagenes(done) {
    const srcDir = './src/img/img';
    const buildDir = 'public/build/img';
    const images =  await glob('./src/img/img/**/*')

    images.forEach(file => {
        const relativePath = path.relative(srcDir, path.dirname(file));
        const outputSubDir = path.join(buildDir, relativePath);
        procesarImagenes(file, outputSubDir);
    });
    done();
}


function procesarImagenes(file, outputSubDir) {
    if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true })
    }
    const baseName = path.basename(file, path.extname(file))
    const extName = path.extname(file)

    if (extName.toLowerCase() === '.svg') {
        // If it's an SVG file, move it to the output directory
        const outputFile = path.join(outputSubDir, `${baseName}${extName}`);
    fs.copyFileSync(file, outputFile);
    } else {
        // For other image formats, process them with sharp
        const outputFile = path.join(outputSubDir, `${baseName}${extName}`);
        const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`);
        
        const options = { quality: 80 };

        sharp(file).jpeg(options).toFile(outputFile);
        sharp(file).webp(options).toFile(outputFileWebp);
    }
}



export function dev() {
    watch( paths.scss, css );
    watch( paths.js, js );
    watch( 'src/img/**/*.{png,jpg}', imagenes)
}



export default series( 
    js, 
    css, 
    imagenes,
    dev )