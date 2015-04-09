var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    // Removed "Spec" naming from files
    if (/Spec\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/app/js',

    paths: {
    angular: '../../bower_components/angular/angular',
    'angular-route': '../../bower_components/angular-route/angular-route',
    bootstrap: '../../bower_components/bootstrap/dist/js/bootstrap'
  },

    shim: {
        'angular' : {'exports' : 'angular'},
        'angular-route': ['angular']
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});
