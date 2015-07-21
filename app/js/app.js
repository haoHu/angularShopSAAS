define(['routes','services/dependencyResolverFor'], function(config, dependencyResolverFor)
{
    var app = angular.module('app', ['ngRoute', 'ngResource', 'ui.bootstrap', 'angularLocalStorage', 'ngSanitize']);

    app.config(
    [
        '$routeProvider',
        '$locationProvider',
        '$controllerProvider',
        '$compileProvider',
        '$filterProvider',
        '$provide',

        function($routeProvider, $locationProvider, $controllerProvider, $compileProvider, $filterProvider, $provide)
        {
	        app.controller = $controllerProvider.register;
	        app.directive  = $compileProvider.directive;
	        app.filter     = $filterProvider.register;
	        app.factory    = $provide.factory;
	        app.service    = $provide.service;

            // $locationProvider.html5Mode(true);
            // $locationProvider.html5Mode(true).hashPrefix('!');

            if(config.routes !== undefined)
            {
                angular.forEach(config.routes, function(route, path)
                {
                    $routeProvider.when(path, {templateUrl:route.templateUrl, resolve:dependencyResolverFor(route.dependencies)});
                });
            }

            if(config.defaultRoutePaths !== undefined)
            {
                $routeProvider.otherwise({redirectTo:config.defaultRoutePaths});
            }
        }
    ]);

    app.controller('AppController', ['$scope', '$rootScope', '$location', 'storage', function ($scope, $rootScope, $location, storage) {
        $scope.curNav = $location.path();
        $scope.isWelcomPage = false;
        $scope.isSignPage = false;
        $scope.ShopOperationMode = null;
        $scope.shopLogo = '';
        $scope.empName = '';
        if (!$rootScope.ModalLst) {
            $rootScope.ModalLst = [];
        }
        $rootScope.$on('$routeChangeSuccess', function (event) {
            var shopInfo = storage.get('SHOPINFO'),
                empInfo = storage.get('EMPINFO');
            // IX.Debug.info("Run Count: ");
            // IX.Debug.info(window.count++);
            if ($rootScope.ModalLst && _.isArray($rootScope.ModalLst)) {
                _.each($rootScope.ModalLst, function (modalinstance) {
                    modalinstance && modalinstance.close();
                });
                _.reject($rootScope.ModalLst, function (modalinstance) {
                    return _.isEmpty(modalinstance);
                });
            }
            $scope.curNav = $location.path();
            $scope.empName = _.result(empInfo, 'empName', '');
            $scope.ShopOperationMode = $XP(shopInfo, 'operationMode');
            $scope.isSignPage = $scope.curNav == '/signin' || $scope.curNav == '/signup' ? true : false;
            $scope.isWelcomPage = $scope.curNav == '/' ? true : false;
            $scope.shopLogo = _.result(storage.get('SHOPINFO'), 'logoUrl', '');
            if (!_.isEmpty($scope.shopLogo)) {
                $scope.shopLogo = Hualala.Global.AJAX_DOMAIN + '/' + $scope.shopLogo;
            } else {
                // $scope.shopLogo = './img/blank.png';
            }
            var urlParams = $location.search(),
                deviceCode = _.result(urlParams, 'deviceCode', null),
                deviceKey = _.result(urlParams, 'deviceKey', null),
                deviceName = _.result(urlParams, 'deviceName', null);
            if (deviceKey && deviceName) {
                storage.set('deviceCode', deviceCode);
                storage.set('deviceKey', deviceKey);
                storage.set('deviceName', deviceName);
            }
        });
        $scope.checkNavBtnActive = function (_curNav, _href) {
            var reg = new RegExp('^' + _href);
            return reg.test(_curNav);
        };
        IX.ns("Hualala");
        var HC = Hualala.Common;
        HC.TopTip.reset($rootScope);
        $scope.closeTopTip = function (index) {
            HC.TopTip.closeTopTip($rootScope, index);
        };
    }]);


   return app;
});