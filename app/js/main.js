require.config({
	baseUrl : '/js',
	paths : {
		'angular' : 'vendor/angular/angular',
		'angular-route' : 'vendor/angular-route/angular-route',
		'angular-resource' : 'vendor/angular-resource/angular-resource',
		'angular-cookies' : 'vendor/angular-cookies/angular-cookies',
		'angular-sanitize' : 'vendor/angular-sanitize/angular-sanitize',
		'ui.bootstrap' : 'vendor/angular-bootstrap/ui-bootstrap-tpls',
		'bootstrap' : 'vendor/bootstrap/bootstrap',
        'bootstrap-datetimepicker' : 'vendor/bootstrap-datetimepicker/bootstrap-datetimepicker.min',
		'jquery' : 'vendor/jquery/jquery',
		'underscore' : 'vendor/underscore/underscore',
		'api' : 'api/api',
		'IX' : 'utils/ixutils',
		'commonFn' : 'utils/commonFn',
		'datatype' : 'utils/datatype',
		'global-const' : 'api/global-const',
		'global-dev-url' : 'api/global-dev-url',
		'global-url' : 'api/global-url',
		'angularLocalStorage' : 'vendor/angularLocalStorage/angularLocalStorage',
		'pymatch' : 'utils/pymatch',
		'matcher' : 'utils/matcher',
		'uuid' : 'vendor/node-uuid/uuid'
	},
	shim : {
		'angular' : {
			deps : ['jquery']
		},
		'app' : {
			deps : ['angular', 'angular-route', 'angular-resource', 'bootstrap', 'bootstrap-datetimepicker','ui.bootstrap', 'angularLocalStorage', 'angular-cookies', 'angular-sanitize']
		},
		'angular-route' : {
			deps : ['angular']
		},
		'angular-resource' : {
			deps : ['angular']
		},
		'angular-sanitize' : {
			deps : ['angular']
		},
		'bootstrap' : {
			deps : ['jquery']
		},
        'bootstrap-datetimepicker' : {
            deps : ['jquery', 'bootstrap']
        },
		'underscore' : {
			exports : '_'
		},
		'IX' : {
			exports : 'IX'
		},
		'commonFn' : {
			exports : 'commonFn',
			deps : ['IX', 'jquery']
		},
		'matcher' : {
			deps : ['IX', 'pymatch']
		},
		'datatype' : {
			exports : 'datatype',
			deps : ['IX']
		},
		'ui.bootstrap' : {
			deps : ['angular']
		},
		'angularLocalStorage' : {
			deps : ['angular']
		},
		'angular-cookies' : {
			deps : ['angular']
		}
	}
});

require(['app', 'underscore', 'IX', 'commonFn', 'datatype', 'global-const', 'matcher', 'uuid'], function (app, _) {
	if (window.HualalaWorkMode == 'dev') {
		// require(['global-dev-url', 'api'], function () {
		// 	angular.bootstrap(document, ['app']);
		// });
		require(['global-url', 'api'], function () {
			// 测试服务器
			// Hualala.Global.AJAX_DOMAIN = 'http://10.10.2.15:8080';
			// 丁工机器
			Hualala.Global.AJAX_DOMAIN = 'http://10.10.2.140:8080';
			// 朱敏机器
			// Hualala.Global.AJAX_DOMAIN = 'http://10.10.2.42:8080';
			angular.bootstrap(document, ['app']);

		});
	} else {
		require(['global-url', 'api'], function () {
			angular.bootstrap(document, ['app']);
		});
	}
	
});