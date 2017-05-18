module.exports = function(grunt) {

  grunt.initConfig({
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
        bump: {
          options: {
            files:         ['package.json'],
            commit: false,
            push: false
          }
        }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-bump');
  //grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint']);
};
