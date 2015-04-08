require.config({
	baseUrl : '/js',
	paths : {
		'angular' : 'vendor/angular/angular',
		'angular-route' : 'vendor/angular-route/angular-route',
		'bootstrap' : 'vendor/bootstrap/bootstrap',
		'jquery' : 'vendor/jquery/jquery'
	},
	shim : {
		'app' : {
			deps : ['angular', 'angular-route', 'bootstrap']
		},
		'angular-route' : {
			deps : ['angular']
		},
		'bootstrap' : {
			deps : ['jquery']
		}
	}
});

require(['app'], function (app) {
	angular.bootstrap(document, ['app']);
	
});