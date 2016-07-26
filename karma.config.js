module.exports = function(config) {
  config.set({

    frameworks: ['jasmine', 'browserify'],

    files: [
      'lib/**/*.js',
      'test/**/*.js'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['nyan'],

    browsers: ['Chrome'],

    preprocessors: {
      'lib/**/*.js': ['browserify'],
      'test/**/*.js': ['browserify']
    },
    
    browserify: {
      debug: true,
      transform: ['browserify-istanbul']
    },

    plugins: [
      'karma-jasmine',
      'karma-jasmine-matchers',
      'karma-chrome-launcher',
      'karma-browserify',
      'karma-nyan-reporter'
    ]
  })
}
