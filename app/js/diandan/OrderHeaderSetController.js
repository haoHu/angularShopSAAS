define(['app'], function (app) {
	app.controller('OrderHeaderSetController', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
		$scope.close = function () {
			$modalInstance.close();
		};
		console.info($scope.$parent.orderHeader);
	}]);
});
