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

    app.controller('AppController', ['$scope', '$rootScope', '$location', 'storage', function ($scope, $rootScope, $location, storage) {
        $scope.curNav = $location.path();
        $scope.isWelcomPage = false;
        $scope.isSignPage = false;
        $scope.ShopOperationMode = null;
        $rootScope.$on('$routeChangeSuccess', function (event) {
            // IX.Debug.info("Run Count: ");
            // IX.Debug.info(window.count++);
            $scope.curNav = $location.path();
            $scope.ShopOperationMode = $XP(storage.get('SHOPINFO'), 'operationMode');
            $scope.isSignPage = $scope.curNav == '/signin' || $scope.curNav == '/signup' ? true : false;
            $scope.isWelcomPage = $scope.curNav == '/' ? true : false;

        });
    }]);


   return app;
});