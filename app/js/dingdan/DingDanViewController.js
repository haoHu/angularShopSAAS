define(['app', 'diandan/OrderHeaderSetController'], function(app)
{
	app.controller('DingDanViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', 'storage', 'CommonCallServer', 'LocalOrderLstService', 'OrderService', 'AppAlert',
		function($scope, $rootScope, $modal, $location, $filter, $timeout, storage, CommonCallServer, LocalOrderLstService, OrderService, AppAlert) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			// HC.TopTip.reset($rootScope);
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			var searchParams = $location.search();
			var getOrderCallServer = null;
			var modalIsOpenning = false;
			// 设置/获取当前是否打开了详情模态窗口
			$scope.modalIsOpen = function (b) {
				if (_.isBoolean(b)) {
					modalIsOpenning = b;
				}
				return modalIsOpenning;
			};
			$scope.orderLstData = null;
			$scope.qOrderSubType = _.result(searchParams, 'qOrderSubType', '-1');
			$scope.qReportDate = _.isEmpty(_.result(searchParams, 'qReportDate')) 
				? new Date() 
				: new Date(HC.formatDateTimeValue(_.result(searchParams, 'qReportDate')));
			$scope.qOrderStatus = _.result(searchParams, 'qOrderStatus', '20');
			$scope.qKeyword = _.result(searchParams, 'qKeyword', '');
			$scope.curPageNo = _.result(searchParams, 'curPageNo', 1);
			$scope.totalSize = _.result(searchParams, 'totalSize', 0);
			$scope.pageSize = _.result(searchParams, 'pageSize', 1);
			var updateOrderLstData = function () {
                $scope.orderLstData = LocalOrderLstService.getOrderLst();
                var pageParams = LocalOrderLstService.getPaginationParams();
                $scope.curPageNo = _.result(pageParams, 'pageNo');
                $scope.totalSize = _.result(pageParams, 'totalSize');
			};
			// 跳转点菜页面
			var jumpToDinnerPage = function (saasOrderKey, tableName) {
				var shopInfo = storage.get("SHOPINFO"),
					operationMode = _.result(shopInfo, 'operationMode');
				var search = {
					'saasOrderKey': saasOrderKey,
					'path' : $location.path(),
					'qOrderSubType' : $scope.qOrderSubType,
					'qOrderStatus' : $scope.qOrderStatus,
					'qKeyword' : $scope.qKeyword,
					'qReportDate' : _.isDate($scope.qReportDate) ? IX.Date.getDateByFormat($scope.qReportDate, 'yyyyMMdd') : '',
					'curPageNo' : $scope.curPageNo,
					'pageSize' : $scope.pageSize
				};
				if (operationMode == 0) {
					$location.path('/dinner/' + tableName).search(search);
				} else {
					$location.path('/snack').search(search);
				}
			};
			// 打开订单详情窗口
			var openOrderDetailModal = function () {
				if ($scope.modalIsOpen()) return;
				var modalSize = 'lg',
					windowClass = 'orderdetail-modal',
					backdrop = 'static',
					controller = 'OrderDetailViewController',
					templateUrl = 'js/dingdan/orderDetail.html',
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				$scope.modalIsOpen(true);
				$modal.open({
					size : modalSize,
					windowClass : windowClass,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve,
					backdrop : backdrop
				});
			};
			$scope.openDatePicker = function ($event) {
				$event.preventDefault();
				$event.stopPropagation();
				$scope.datePickerOpened = true;
			};
			$scope.today = function () {
				return IX.Date.getDateByFormat(new Date(), 'yyyy-MM-dd');
				// return IX.Date.formatDate(new Date());
			};
			$scope.queryByReportDate = function ($event, v) {
				var evtType = _.result($event, 'type'),
					keyCode = _.result($event, 'keyCode');
				if (evtType == 'keyup' && keyCode != 13) return;
				console.info('qReportDate:' + $scope.qReportDate);
				$scope.queryOrderLst();
			};
			$scope.queryByOrderSubType = function (v) {
				$scope.qOrderSubType = v;
				console.info('qOrderSubType:' + $scope.qOrderSubType);
				$scope.queryOrderLst();
			};
			$scope.queryByOrderStatus = function (v) {
				$scope.qOrderStatus = v;
				console.info('qOrderStatus:' + $scope.qOrderStatus);
				$scope.queryOrderLst();
			};
			$scope.queryByKeyword = function ($event, v) {
				var evtType = $event.type,
					keyCode = $event.keyCode;
				if (evtType == 'keyup' && keyCode != 13) return;
				// $scope.qKeyword = v;
				console.info('qKeyword:' + $scope.qKeyword);
				$scope.queryOrderLst();
			};
			$scope.queryOrderLst = function (pager) {
				var params = {
					orderSubType : $scope.qOrderSubType == -1 ? '' : $scope.qOrderSubType,
					orderStatus : $scope.qOrderStatus,
					reportDate : _.isDate($scope.qReportDate) ? IX.Date.getDateByFormat($scope.qReportDate, 'yyyyMMdd') : '',
					keyword : $scope.qKeyword || '',
					pageNo : _.result(pager, 'pageNo', 1),
					pageSize : _.result(pager, 'pageSize', 1)
				};
				var callServer = LocalOrderLstService.loadLocalOrderLstData(params);
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
                        updateOrderLstData();
                        AppAlert.add('success', "数据加载成功");
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
						// HC.TopTip.addTopTips($rootScope, data);
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
					// HC.TopTip.addTopTips($rootScope, {
					// 	msg : '请求失败'
					// });
				});
			};
			$scope.selectPage = function () {
				$scope.queryOrderLst({
					pageNo : $scope.curPageNo,
					pageSize : $scope.pageSize
				});
			};
			$scope.selectOrder = function (order) {
				var saasOrderKey = _.result(order, 'saasOrderKey'),
					orderStatus = _.result(order, 'orderStatus'),
					orderSubType = _.result(order, 'orderSubType'),
					tableName = _.result(order, 'tableName');
				if (orderStatus != 40) {
					// 跳转点单页面
					jumpToDinnerPage(saasOrderKey, tableName);
				} else {
					// 打开窗口加载订单
					console.info(getOrderCallServer);
					if (!_.isEmpty(getOrderCallServer)) return;
					getOrderCallServer = OrderService.getOrderByOrderKey({
						saasOrderKey : saasOrderKey
					}).success(function (data) {
						var code = _.result(data, 'code');
						if (code == '000') {
							openOrderDetailModal();
						} else {
							AppAlert.add('danger', _.result(data, 'msg', ''));
						}
						getOrderCallServer = null;
					}).error(function (data) {
						AppAlert.add('danger', '请求失败');
						getOrderCallServer = null;
					});
				}
			};
            $scope.queryOrderLst();
		}
	]);

	/*订单详情模态窗口控制器*/
	app.controller('OrderDetailViewController', [
		'$scope', '$modalInstance', '$filter', '$location', '_scope', 'storage', 'OrderService', 'OrderChannel', 'AppAlert',
		function ($scope, $modalInstance, $filter, $location, _scope, storage, OrderService, OrderChannel, AppAlert) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			var shopInfo = storage.get("SHOPINFO"),
				operationMode = _.result(shopInfo, 'operationMode');
			// 跳转点菜页面
			var jumpToDinnerPage = function (saasOrderKey, tableName) {
				var shopInfo = storage.get("SHOPINFO"),
					operationMode = _.result(shopInfo, 'operationMode');
				var search = {
					'FJZFlag' : 'FJZ',
					'saasOrderKey': saasOrderKey,
					'path' : $location.path(),
					'qOrderSubType' : _scope.qOrderSubType,
					'qOrderStatus' : _scope.qOrderStatus,
					'qKeyword' : _scope.qKeyword,
					'qReportDate' : _.isDate(_scope.qReportDate) ? IX.Date.getDateByFormat(_scope.qReportDate, 'yyyyMMdd') : '',
					'curPageNo' : _scope.curPageNo,
					'pageSize' : _scope.pageSize
				};
				if (operationMode == 0) {
					$location.path('/dinner/' + tableName).search(search);
				} else {
					$location.path('/snack').search(search);
				}
			};
			// 加载渠道数据
			OrderChannel.loadOrderChannels({}, function (data) {
				$scope.OrderChannels = OrderChannel.getAll();
				IX.Debug.info("Order Channels: ");
				IX.Debug.info($scope.OrderChannels);
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});
			// 重置订单数据
			$scope.resetOrderInfo = function () {
				$scope.orderHeader = OrderService.getOrderHeaderData();
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
				$scope.curOrderRemark = OrderService.getOrderRemark();
				$scope.curOrderRemark = _.isEmpty($scope.curOrderRemark) ? '单注' : $scope.curOrderRemark;
				// 重置当前选中订单条目
				$scope.curSelectedOrderItems = [];
				IX.Debug.info("Order List Info:");
				IX.Debug.info($scope.curOrderItems);
			};
			// 计算订单列表中的菜品小计金额
			$scope.calcFoodAmount = function (item) {
				var math = Hualala.Common.Math;
				var foodPayPrice = _.result(item, 'foodPayPrice', 0),
					foodProPrice = _.result(item, 'foodProPrice', 0),
					foodNumber = _.result(item, 'foodNumber', 0),
					foodSendNumber = _.result(item, 'foodSendNumber', 0),
					foodCancelNumber = _.result(item, 'foodCancelNumber', 0);
				var v = math.multi(foodPayPrice, math.sub(foodNumber, foodSendNumber, foodCancelNumber));
				var str = parseFloat(v) == 0 ? '' : math.standardPrice(v);
				return str;
			};
			// 计算订单金额总计
			$scope.calcOrderAmount = function () {
				var math = Hualala.Common.Math;
				var orderItems = $scope.curOrderItems,
					amount = 0;
				_.each(orderItems, function (item) {
					amount = math.add(amount, $scope.calcFoodAmount(item));
				});
				return math.standardPrice(amount);
			};
			// 更新单头信息
			$scope.updateOrderHeader = function (data) {
				$scope.orderHeader = data;
				OrderService.updateOrderHeader($scope.orderHeader);
			};
			// 关闭窗口
			$scope.close = function () {
				_scope.modalIsOpen(false);
				$modalInstance.close();
			};
			// 打印订单
			$scope.printOrderCheckoutBill = function () {
				var msg = OrderService.getOrderData();
				IX.Debug.info("Order Detail Info:");
				IX.Debug.info(msg);
				Hualala.DevCom.exeCmd("PrintCheckoutBill", JSON.stringify(msg));
			};
			// 反结账
			$scope.counterSettlingAccount = function () {
				var orderData = OrderService.getOrderData();
				jumpToDinnerPage(_.result(orderData, 'saasOrderkey'), _.result(orderData, 'tableName'));
				$scope.close();
			};
			$scope.resetOrderInfo();
		}
	]);
});