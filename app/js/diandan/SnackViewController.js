define(['app', 'diandan/OrderHeaderSetController'], function (app) {
	app.controller('SnackViewController', ['$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer', function ($scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer) {
		IX.ns("Hualala");
		var HC = Hualala.Common;
		// 解析链接参数获取订单Key (saasOrderKey)
		var urlParams = $location.search(),
			saasOrderKey = _.result(urlParams, 'saasOrderKey', null);
		if (!saasOrderKey) {
			$scope.orderHeader = {
				saasOrderNo : "",
				person : 1,
				tableName : "12",
				channelName : "",
				orderSubType : 0,
				userName : "",
				userMobile : "",
				userAddress : ""
			};
		} else {
			CommonCallServer.getOrderByOrderKey(urlParams)
				.success(function (data, status) {
					$scope.orderHeader = {
						saasOrderNo : "",
						person : 1,
						tableName : "12",
						channelName : "",
						orderSubType : 0,
						userName : "",
						userMobile : "",
						userAddress : ""
					};
				})
				.error(function (data, status) {
					HC.TopTip.addTopTips($scope, data);
				});
		}
		
		CommonCallServer.getChannelLst()
			.success(function (data, status) {
				$scope.OrderChannels = $filter('mapOrderChannels')($XP(data, 'data.records', []));
			})
			.error(function (data, status) {
				HC.TopTip.addTopTips($scope, data);
			});
		
		

		
	}]);
});
