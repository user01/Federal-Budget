
var typescriptPureOptions = {
  module: 'commonjs', //or commonjs
  target: 'es3', //or es3
  sourceMap: true,
  comments: false,               // same as !removeComments. [true | false (default)]
  declaration: false
};


module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),


    //*********************************
    //  Compile Typescript to ES
    //*********************************
    typescript: {
      index: {
        src: ['./web/ts/index.ts'],
        dest: './web/js/index.js',
        options: typescriptPureOptions
      },
    },


    //*********************************
    //  Watch task to restart the systems
    //*********************************
    watch: {
      typescript: {
        files: [
          './web/ts/**/*.ts',
        ],
        tasks: ['typescript:index']
      }
    },

    uglify: {
      index: {
        options: {
          mangle: {
            except: ['_', 'd3']
          },
          compress: {
            drop_console: true
          }
        },
        files: {
          'web/js/index.min.js': ['web/js/index.js']
        }
      }
    }

  });

  grunt.registerTask('default', ['typescript:index', 'watch:typescript']);
  grunt.registerTask('production', ['typescript:index', 'uglify:index']);

};