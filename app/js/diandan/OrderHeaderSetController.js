define(['app'], function (app) {
	app.controller('OrderHeaderSetController', ['$rootScope', '$scope', '$modalInstance', '$filter', '_scope', 'CommonCallServer', function ($rootScope, $scope, $modalInstance, $filter, _scope, CommonCallServer) {
		IX.ns("Hualala");
		var HC = Hualala.Common;

		$scope.close = function () {
			$modalInstance.close();
		};
		$scope.save = function () {
			_.each($scope.fmels, function (v, k) {
				_scope.fmels[k] = v;
			});
			_scope.$parent.updateOrderHeader(_scope.fmels);
			$scope.close();
		};
		// 为本作用域的orderSubType值变化时，更新其值
		$scope.onOrderSubTypeChange = function (v) {
			$scope.fmels.orderSubType = v;
		};
		// 为本作用域的channelname值变化时，更新其值
		$scope.onChannelChange = function (v) {
			var d = _.find($scope.OrderChannels, function(el) {
				return _.result(el, 'channelCode') == v;
			});
			$scope.fmels.channelKey = v;
			$scope.fmels.channelName = _.result(d, 'channelName', '');
		};
		// 加载单头表单数据
		// _scope依赖的scope
		CommonCallServer.getChannelLst()
			.success(function (data, status) {
				HC.TopTip.addTopTips($scope, data);
				$scope.fmels = _.clone(_scope.fmels);
				$scope.OrderSubTypes = Hualala.TypeDef.OrderSubTypes;
				$scope.OrderChannels = $filter('mapOrderChannels')($XP(data, 'data.records', []));
			})
			.error(function (data, status) {
				HC.TopTip.addTopTips($scope, data);
			});
	}]);
});
