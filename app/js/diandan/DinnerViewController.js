define(['app'], function (app) {
	app.controller('DinnerViewController', ['$scope', '$location', '$resource', function ($scope, $location, $resource) {
		$location.$$parse(document.location.href);
	}]);
	
});
