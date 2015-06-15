define(['app'], function(app) {
	app.controller('JieDanViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', 'storage', 'CommonCallServer', 'CloudOrderLstService', 'CloudOrderService', 'AppAlert',
		function($scope, $rootScope, $modal, $location, $filter, $timeout, storage, CommonCallServer, CloudOrderLstService, CloudOrderService, AppAlert) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			$scope.qOrderSubType = '0';
			$scope.qKeyword = '';
			$scope.curPageNo = 1;
			$scope.totalSize = 0;
			$scope.pageSize = 6;
			$scope.OrderSubTypes = Hualala.TypeDef.OrderTypes;
			$scope.orderLstData = null;
			$scope.curOrderSchema = null;
			$scope.curOrderDetail = null;
			var updateOrderLstData = function () {
				$scope.orderLstData = CloudOrderLstService.getOrderLst();
				var pageParams = CloudOrderLstService.getPaginationParams();
				$scope.curPageNo = _.result(pageParams, 'pageNo');
				$scope.totalSize = _.result(pageParams, 'totalSize');
			};
			$scope.getFilterLabel = function (curV, items) {
				var item = _.find(items, function (item) {
					return item.value == curV;
				});
				return _.result(item, 'label');
			};
			$scope.filterByOrderSubType = function (item) {
				$scope.qOrderSubType = _.result(item, 'value', '0');
				$scope.queryOrderLst();
			};
			$scope.queryByKeyword = function ($event) {
				var etype = $event.type, keycode = $event.keyCode;
				if (etype == 'keyup' && keycode != 13) {
					return;
				}
				$scope.queryOrderLst();
			};
			$scope.selectPage = function () {
				$scope.queryOrderLst({
					pageNo : $scope.curPageNo,
					pageSize : $scope.pageSize
				});
			};
			$scope.queryOrderLst = function (pager) {
				var sDate = new Date(),
					eDate = new Date((IX.Date.getTimeTickInSec(IX.Date.format(sDate)) + Hualala.Constants.SecondsOfDay * 30) * 1000);
				var params = {
					orderSubType : $scope.qOrderSubType,
					keyword : $scope.qKeyword,
					pageNo : _.result(pager, 'pageNo', 1),
					pageSize : _.result(pager, 'pageSize', 6),
					startOrderDate : IX.Date.getDateByFormat(IX.Date.format(sDate), 'yyyyMMddHHmmss'),
					endOrderDate : IX.Date.getDateByFormat(IX.Date.format(eDate), 'yyyyMMddHHmmss')
				};
				var callServer = CloudOrderLstService.loadCloudOrderLstData(params);
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						updateOrderLstData();
						AppAlert.add('success', '数据加载成功');
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
			};
			$scope.queryOrderLst();
			// 获取订单类型的图标
			$scope.getOrderSubTypeIcon = function (order) {
				var orderSubType = _.result(order, 'orderSubtype');
				var item = _.find($scope.OrderSubTypes, function (item) {
					return item.value == orderSubType;
				});
				return _.result(item, 'icon', '');
			};
			// 获取订单类型title
			$scope.getOrderSubTypeTitle = function (order) {
				var orderSubType = _.result(order, 'orderSubtype');
				var item = _.find($scope.OrderSubTypes, function (item) {
					return item.value == orderSubType;
				});
				return _.result(item, 'label', '') +  "订单";
			};
			// 获取订单状态文字
			$scope.getOrderStatusLabel = function (order) {
				var orderStatus = _.result(order, 'orderStatus');
				return orderStatus == '20' ? '待消费' : (orderStatus == '30' ? '已退订' : '已消费');
			};
			// 订单条目退款成功状态样式类 
			$scope.getRefundClz = function (order) {
				var orderStatus = _.result(order, 'orderStatus'),
					shopRefundAmount = _.result(order, 'shopRefundAmount', 0);
				return orderStatus == '40' && shopRefundAmount > 0 ? 'refunded' : '';

			};
			// 生成订单未读状态样式类
			$scope.getUnreadedClz = function (order) {
				var orderStatus = _.result(order, 'orderStatus'),
					acceptTime = _.result(order, 'acceptTime', 0);
				return orderStatus == '20' && acceptTime == 0 ? 'unreaded' : '';
			};
			// 生成选中订单列表样式
			$scope.getActiveClz = function (order) {
				return _.result(order, 'orderKey') == _.result($scope.curOrderSchema, 'orderKey') ? 'active' : '';
			};
			// 生成超时时间
			$scope.getTimeoutStr = function (order) {
				var orderStatus = _.result(order, 'orderStatus'),
					orderTimeStr = Hualala.Common.formatDateTimeValue(_.result(order, 'orderTime', 0)),
					orderTimeInSec = IX.Date.getTimeTickInSec(orderTimeStr),
					curTime = (new Date()).getTime();
				return (orderStatus == 20 && curTime > (orderTimeInSec * 1000)) ? IX.Date.getDateText(orderTimeInSec, (curTime / 1000)) : '';
			};

			// 判断订单有详情
			$scope.hasOrderDetail = function (order) {
				return !_.isEmpty(_.result(order, 'orderKey'));
			};
			// 选择当前操作的订单
			$scope.selectCurOrder = function (order) {
				$scope.curOrderSchema = order;
				var acceptTime = _.result(order, 'acceptTime', 0);
				var callServer;
				// 1. 如果订单为未读状态（acceptTime == 0）
				// 2. 发送确认订单服务，更新订单状态为已读
				// 3. 如果订单为已读状态
				// 4. 获取订单详情信息
				if (acceptTime == 0) {
					callServer = CloudOrderService.acceptCloudOrder({
						orderKey : _.result(order, 'orderKey', '')
					});
				} else {
					callServer = CloudOrderService.getOrderByOrderKey({
						orderKey : _.result(order, 'orderKey', '')
					});
				}
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						// 构建订单详情渲染数据
						AppAlert.add('success', '订单数据加载成功');
						$scope.curOrderDetail = CloudOrderService.getOrderDetail();
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
				
			};

		}
	]);
});