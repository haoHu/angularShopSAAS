define(['app'], function (app) {
	app.controller('OrderHeaderSetController', ['$rootScope', '$scope', '$modalInstance', '_scope', function ($rootScope, $scope, $modalInstance, _scope) {
		$scope.close = function () {
			$modalInstance.close();
		};
		$scope.save = function () {
			_.each(_scope.fmels, function (el) {
				el.value = $scope.fmels[el.key];
			});
			$scope.close();
		};
		// _scope依赖的scope
		var initFormData = function () {
			$scope.fmels = {};
			_.each(_scope.fmels, function (el) {
				$scope.fmels[el.key] = el.value;
			});
		};
		initFormData();



	}]);
});
