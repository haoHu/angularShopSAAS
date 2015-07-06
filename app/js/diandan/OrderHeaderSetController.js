define(['app'], function (app) {
	app.controller('OrderHeaderSetController', [
		'$rootScope', '$scope', '$modalInstance', '$filter', '_scope', 'storage', 'CommonCallServer', 'AppAlert',
		function ($rootScope, $scope, $modalInstance, $filter, _scope, storage, CommonCallServer, AppAlert) {
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

			$scope.tableNameIsReadOnly = function () {
				var mode = _.result(storage.get('SHOPINFO'), 'operationMode');
				return mode == 0;
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
			// 输入框聚焦事件
			// 告诉软键盘当前操作控件
			$scope.inputFocus = function ($event) {
				console.info($event);
				console.info(arguments);
				var curEl = $($event.target);
				if (!curEl.attr('readonly')) {
					$scope.focusInputEl = curEl;
				} else {
					$scope.focusInputEl = null;
				}
				return;

			};
			
			// 加载单头表单数据
			// _scope依赖的scope
			CommonCallServer.getChannelLst()
				.success(function (data, status) {
					// HC.TopTip.addTopTips($rootScope, data);
					$scope.fmels = _.clone(_scope.fmels);
					$scope.OrderSubTypes = Hualala.TypeDef.OrderSubTypes;
					$scope.OrderChannels = $filter('mapOrderChannels')($XP(data, 'data.records', []));
				})
				.error(function (data, status) {
					// HC.TopTip.addTopTips($rootScope, data);
					AppAlert.add('danger', _.result(data, 'msg', ''));
				});
		}
	]);
	
	/**
	 * 开台时单头信息配置
	 */
	/*app.controller('OpenTableSetController', [
		'$rootScope', '$scope', '$location', '$modalInstance', '$filter', '_scope', 'CommonCallServer', 'OrderService', 
		function ($rootScope, $scope, $location, $modalInstance, $filter, _scope, CommonCallServer, OrderService) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			$scope.person = '';
			$scope.tableName = _scope.curTableName;
			$scope.saasOrderRemark = '';
			
			$scope.close = function () {
				$modalInstance.close();
			};
			$scope.save = function () {
				// 开台操作
				OrderService.tableOperation('KT', {
					fromTableName : _scope.curTableName,
					toTableName : '',
					person : $scope.person,
					saasOrderRemark : $scope.saasOrderRemark
				}).success(function (data) {
					var code = _.result(data, 'code'),
						rec = data.data.records[0],
						saasOrderKey = _.result(rec, 'saasOrderKey');
					_scope.updateOrderHeader({
						person : $scope.person,
						tableName : $scope.tableName,
						saasOrderRemark : $scope.saasOrderRemark,
						saasOrderKey : saasOrderKey
					});
					if (code == '000') {
						_scope.jumpToDinnerPage();
						$scope.close();
					} else {
						HC.TopTip.addTopTips($rootScope, data);
					}
				});
				
			};
			
		}
	]);*/
	app.controller('OpenTableSetController', [
		'$rootScope', '$scope', '$location', '$modalInstance', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'OrderChannel', 'AppAlert', 'AppAuthEMP',
		function ($rootScope, $scope, $location, $modalInstance, $filter, _scope, CommonCallServer, OrderService, OrderChannel, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			$scope.fmels = _.extend(_scope.fmels, {
				orderSubType : _.result(_scope.fmels, 'orderSubType', 0)
			});
			$scope.close = function () {
				$modalInstance.close();
			};
			$scope.save = function () {
				var postData = {};
				_.each($scope.fmels, function (v, k) {
					if (k == 'tableName') {
						postData['fromTableName'] = v;
					} else {
						postData[k] = v;
					}
				});
				var successCallBack = function (data) {
					var code = _.result(data, 'code'),
						rec = data.data.records[0],
						saasOrderKey = _.result(rec, 'saasOrderKey');
					_scope.updateOrderHeader({
						person : $scope.person,
						tableName : $scope.tableName,
						saasOrderRemark : $scope.saasOrderRemark,
						saasOrderKey : saasOrderKey
					});
					if (code == '000') {
						_scope.jumpToDinnerPage();
						$scope.close();
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								OrderService.tableOperation('KT', _.extend(postData, empInfo)).success(function (data) {
									successCallBack(data);
								});
							},
							noFn : function () {

							}
						});
					} else {
						// HC.TopTip.addTopTips($rootScope, data);
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				};
				// 开台操作
				OrderService.tableOperation('KT', postData).success(function (data) {
					successCallBack(data);
				});
			};
			$scope.tableNameIsReadOnly = function () {
				return true;
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
			// 输入框聚焦事件
			// 告诉软键盘当前操作控件
			$scope.inputFocus = function ($event) {
				console.info($event);
				console.info(arguments);
				var curEl = $($event.target);
				if (!curEl.attr('readonly')) {
					$scope.focusInputEl = curEl;
				} else {
					$scope.focusInputEl = null;
				}
				return;

			};
			// 加载单头表单数据
			// _scope依赖的scope
			// CommonCallServer.getChannelLst()
			// 	.success(function (data, status) {
			// 		// HC.TopTip.addTopTips($rootScope, data);
			// 		$scope.fmels = _.clone(_scope.fmels);
			// 		$scope.OrderSubTypes = Hualala.TypeDef.OrderSubTypes;
			// 		$scope.OrderChannels = $filter('mapOrderChannels')($XP(data, 'data.records', []));
			// 	})
			// 	.error(function (data, status) {
			// 		// HC.TopTip.addTopTips($rootScope, data);
			// 		AppAlert.add('danger', _.result(data, 'msg', ''));
			// 	});
			OrderChannel.loadOrderChannels()
				.success(function (data, status) {
					var code = _.result(data, 'code');
					if (code !== '000') {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
					var defaultChannel = OrderChannel.getAll()[0];
					$scope.fmels = _.extend(_scope.fmels, {
						orderSubType : _.result(_scope.fmels, 'orderSubType', 0),
						channelKey : _.result(defaultChannel, 'channelKey'),
						channelName : _.result(defaultChannel, 'channelName')
					});
					$scope.OrderSubTypes = Hualala.TypeDef.OrderSubTypes;
					$scope.OrderChannels = $filter('mapOrderChannels')($XP(data, 'data.records', []));
				})
				.error(function (data, status) {
					AppAlert.add('danger', '请求服务失败');
				});
		}
	]);
});
