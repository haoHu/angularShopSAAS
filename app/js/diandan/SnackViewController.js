define(['app', 'diandan/OrderHeaderSetController'], function (app) {
	app.controller('SnackViewController', ['$scope', '$rootScope', '$modal', '$location', 'storage', function ($scope, $rootScope, $modal, $location, storage) {
		
		$scope.orderHeader = [
			{key : 'saasDeviceOrderNo', value : "001", label : "单号"},
			{key : 'person', value : 1, label : "人数"},
			{key : 'tableName', value : 12, label : "牌号"},
			{key : 'channelName', value : "美团", label : "渠道"},
			{key : 'orderSubType', value : "0", label : "类型"}
		];
		

		// $scope.openOrderHeaderSet = function () {
		// 	$modal.open({
		// 		size : 'lg',
		// 		controller : "OrderHeaderSetController",
		// 		templateUrl : "js/diandan/orderheaderset.html"
		// 	});
		// };
		
		// $scope.orderHeader = $rootScope.orderHeader = {
		// 	// 单号
		// 	saasDeviceOrderNo : "001",
		// 	person : 1,
		// 	tableName : 12,
		// 	channelName : "",
		// 	orderSubType : "0"
		// };
	}]);
});
