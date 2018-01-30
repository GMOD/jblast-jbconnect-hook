module.exports = function(grunt) {

  grunt.initConfig({
        publish: {
          jbh_jblast: {  
            options: {
                ignore: ['node_modules','jblast-simtool']
            },
            main: {
                src: [
                    './','jblast-simtool'
                ]
            },
            regex: {
                src: ['./**/*']
            }
          },
          jblast_simtool: {
            options: {
                ignore: ['node_modules']
            },
            main: {
                src: ['jblast-simtool']
            },
            regex: {
                src: ['./**/*']
            }
          }
        },
        jshint: {
          files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
          options: {
            globals: {
              jQuery: true
            }
          }
        },
/*
        watch: {
          files: ['<%= jshint.files %>'],
          tasks: ['jshint']
        }
*/
/*
        bump: {
          options: {
            files:         ['package.json','jblast-simtool/package.json'],
            commit: false,
            push: false
          }
        }
*/
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-bump');
  //grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-publish');
  grunt.registerTask('default', ['jshint']);
  
  grunt.registerTask('bump-publish',['bump','publish:jbh_jblast','publish:jblast_simtool']);
};
