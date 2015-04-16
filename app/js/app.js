define(['routes','services/dependencyResolverFor'], function(config, dependencyResolverFor)
{
    var app = angular.module('app', ['ngRoute', 'ngResource', 'ui.bootstrap', 'angularLocalStorage']);

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

    app.controller('NavbarController', ['$scope', '$rootScope', '$location', 'storage', function ($scope, $rootScope, $location, storage) {
        $scope.isActive = function (route) {
            return route === $location.path();
        };
        $scope.isHiddenNav = function () {
            return $location.path() == '/signin' || $location.path() == '/signup';
        };
        $scope.siteStyle = function () {
            var path = $location.path();
            if (path == '/') {
                return 'welcome';
            } else if (path == '/signin' || path == '/signup') {
                return 'sign';
            } else {
                return '';
            }
        };
        $scope.isRightOperationMode = function (m) {
            var operationMode = $XP(storage.get('SHOPINFO'), 'operationMode');
            return operationMode == m;
        };
    }]);

   return app;
});