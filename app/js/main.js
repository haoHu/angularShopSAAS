require.config({
	baseUrl : '/js',
	paths : {
		'angular' : 'vendor/angular/angular',
		'angular-route' : 'vendor/angular-route/angular-route',
		'angular-resource' : 'vendor/angular-resource/angular-resource',
		'angular-cookies' : 'vendor/angular-cookies/angular-cookies',
		'ui.bootstrap' : 'vendor/angular-bootstrap/ui-bootstrap-tpls',
		'bootstrap' : 'vendor/bootstrap/bootstrap',
		'jquery' : 'vendor/jquery/jquery',
		'underscore' : 'vendor/underscore/underscore',
		'api' : 'api/api',
		'IX' : 'utils/ixutils',
		'commonFn' : 'utils/commonFn',
		'datatype' : 'utils/datatype',
		'global-const' : 'api/global-const',
		'global-dev-url' : 'api/global-dev-url',
		'global-url' : 'api/global-url',
		'angularLocalStorage' : 'vendor/angularLocalStorage/angularLocalStorage'
	},
	shim : {
		'app' : {
			deps : ['angular', 'angular-route', 'angular-resource', 'bootstrap', 'ui.bootstrap', 'angularLocalStorage', 'angular-cookies']
		},
		'angular-route' : {
			deps : ['angular']
		},
		'angular-resource' : {
			deps : ['angular']
		},
		'bootstrap' : {
			deps : ['jquery']
		},
		'underscore' : {
			exports : '_'
		},
		'IX' : {
			exports : 'IX'
		},
		'commonFn' : {
			exports : 'commonFn',
			deps : ['IX']
		},
		'datatype' : {
			exports : 'datatype',
			deps : ['IX']
		}
	}
});

require(['app', 'underscore', 'IX', 'commonFn', 'datatype', 'global-const'], function (app, _) {
	if (window.HualalaWorkMode == 'dev') {
		require(['global-dev-url', 'api'], function () {
			angular.bootstrap(document, ['app']);
		});
	} else {
		require(['global-url', 'api'], function () {
			angular.bootstrap(document, ['app']);
		});
	}
	
});