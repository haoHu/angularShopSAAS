define(['app'], function(app) {
	app.controller('JieDanViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', 'storage', 'CommonCallServer', 'CloudOrderLstService', 'CloudOrderService', 'AppAlert', 'OrderNoteService',
		function($scope, $rootScope, $modal, $location, $filter, $timeout, storage, CommonCallServer, CloudOrderLstService, CloudOrderService, AppAlert, OrderNoteService) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			$scope.qOrderSubType = '0';
			$scope.qKeyword = '';
			$scope.curPageNo = 1;
			$scope.totalSize = 0;
			$scope.pageSize = 6;
			$scope.OrderSubTypes = Hualala.TypeDef.OrderTypes;
			$scope.OrderBtns = [
				{name : 'order', label : '下单', disabled : true},
				{name : 'chargeback', label : '退单', disabled : true},
				{name : 'refund', label : '退款', disabled : true},
				{name : 'print', label : '打印账单', disabled : true},
				{name : 'sendout', label : '确认送出', disabled : true},
				{name : 'delivery', label : '确认送达', disabled : true},
				{name : 'prev', label : '上一条', disabled : true},
				{name : 'next', label : '下一条', disabled : true},
			];
			$scope.orderLstData = null;
			$scope.curOrderSchema = null;
			$scope.curOrderDetail = null;
			var updateOrderLstData = function () {
				$scope.orderLstData = CloudOrderLstService.getOrderLst();
				var pageParams = CloudOrderLstService.getPaginationParams();
				$scope.curPageNo = _.result(pageParams, 'pageNo');
				$scope.totalSize = _.result(pageParams, 'totalSize');
			};
			// 更新订单操作按钮状态
			var updateOrderBtnsStatus = function () {
				var order = $scope.curOrderDetail,
					orderStatus = _.result(order, 'orderStatus'),
					orderSubType = _.result(order, 'orderSubtype'),
					takeoutDeliveryTime = _.result(order, 'takeoutDeliveryTime', 0),
					shopRefundAmount = _.result(order, 'shopRefundAmount', 0),
					isAlreadyPaid = _.result(order, 'isAlreadyPaid', 0);
				if (_.isEmpty(order)) {
					$scope.OrderBtns = _.map($scope.OrderBtns, function (btn) {
						return _.extend(btn, {disabled : true});
					});
					return ;
				}
				var arr = _.map($scope.OrderBtns, function (btn) {
					var act = _.result(btn, 'name');
					var disabled = false;
					switch(act) {
						case "order":
						case "chargeback":
							disabled = orderStatus == 20 ? false : true;
							break;
						case "refund":
							// disabled = orderStatus == 40 && isAlreadyPaid == 1 ? (shopRefundAmount > 0 ? false : true) : false;
							disabled = orderStatus == 40 && isAlreadyPaid == 1 && shopRefundAmount == 0 ? false : true;
							break;
						case "print":
							// 20:打印清单;40:打印对账单;30:打印退款凭证;
							btn.label = orderStatus == 20 ? '打印清单' : (orderStatus == 40 ? '打印对账单' : '打印退款凭证');
							break;
						case "sendout":
							disabled = (orderStatus == 40 && orderSubType == 20 && takeoutDeliveryTime == 0) ? false : true;
							break;
						case "delivery":
							disabled = (orderStatus == 40 && orderSubType == 20 && takeoutDeliveryTime > 0) ? false : true;
							break;
						case "prev":
							break;
						case "next":
							break;
					}
					return _.extend(btn, {disabled : disabled});
				});
				$scope.OrderBtns = arr;
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
					startOrderDate : IX.Date.getDateByFormat(IX.Date.format(sDate), 'yyyyMMdd'),
					endOrderDate : IX.Date.getDateByFormat(IX.Date.format(eDate), 'yyyyMMdd')
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
				var orderStatus = _.result(order, 'orderStatus'),
					isAlreadyPaid = _.result(order, 'isAlreadyPaid'),
					shopRefundAmount = _.result(order, 'shopRefundAmount');
				var label = orderStatus == '20' ? '待消费' : (orderStatus == '30' ? '已退订' : '已消费');
				label = (orderStatus == '40' && isAlreadyPaid == '1' && shopRefundAmount != 0) ? '已退款' : label;
				return label;
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
			// 转换数量
			$scope.mapFoodNumber = function (num) {
				return parseFloat(num);
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
						updateOrderBtnsStatus();
						if (acceptTime == 0) {
							// CloudOrderLstService.updateOrder($scope.curOrderDetail);
							// updateOrderLstData();
							$scope.queryOrderLst({
								pageNo : $scope.curPageNo,
								pageSize : $scope.pageSize
							});
						}
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
				
			};
			var printAction = function (orderStatus) {
				var cmd = orderStatus == 20 ? 'PrintOrderDetailBill' : (orderStatus == 40 ? 'PrintCheckoutBill' : 'PrintOther');
				Hualala.DevCom.exeCmd(cmd, JSON.stringify(CloudOrderService.getOrderDetail()));
			};
			$scope.orderHandle = function (btn) {
				var act = btn.name;
				var order = $scope.curOrderDetail,
					orderStatus = _.result(order, 'orderStatus'),
					orderSubType = _.result(order, 'orderSubtype'),
					takeoutDeliveryTime = _.result(order, 'takeoutDeliveryTime', 0),
					shopRefundAmount = _.result(order, 'shopRefundAmount', 0),
					isAlreadyPaid = _.result(order, 'isAlreadyPaid', 0);
				var callServer = null;
				var modalSize = "lg",
					controller = "",
					templateUrl = "",
					windowClass = "",
					backdrop = "static",
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				switch(act) {
					case "order":
						if (orderSubType == '20' || orderSubType == '21' || orderSubType == '41') {
							// 外卖，自提，店内自助不需要选择桌台
							callServer = CloudOrderService.submit();
							callServer.success(function (data) {
								var code = _.result(data, 'code');
								if (code == '000') {
									AppAlert.add('success', '下单成功');
									$scope.queryOrderLst({
										pageNo : $scope.curPageNo,
										pageSize : $scope.pageSize
									});
								} else {
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							}).error(function (data) {
								AppAlert.add('danger', '请求失败');
							});
						} else {
							controller = "SubmitCloudOrderController";
	                        templateUrl = "js/diandan/changeTable.html";
	                        windowClass = "table-modal";
						}
						
						break;
					case "chargeback":
						controller = "RejectCloudOrderCauseController";
						templateUrl = "js/jiedan/rejectCause.html";
						break;
					case "refund":
						// disabled = orderStatus == 40 && isAlreadyPaid == 1 ? (shopRefundAmount > 0 ? false : true) : false;
						// disabled = orderStatus == 40 && isAlreadyPaid == 1 && shopRefundAmount == 0 ? false : true;
						controller = "RefundCloudOrderCauseController";
						templateUrl = "js/jiedan/refundCause.html";
						break;
					case "print":
						// 20:打印清单;40:打印对账单;30:打印退款凭证;
						printAction(orderStatus);
						break;
					case "sendout":
						// disabled = (orderStatus == 40 && orderSubType == 20 && takeoutDeliveryTime == 0) ? false : true;
						controller = "ConfirmTakeoutController";
						templateUrl = "js/jiedan/confirmTakeout.html";
						modalSize = 'md';
						break;
					case "delivery":
						// disabled = (orderStatus == 40 && orderSubType == 20 && takeoutDeliveryTime > 0) ? false : true;
						callServer = CloudOrderService.confirmDelivery()
						callServer.success(function (data) {
							var code = _.result(data, 'code');
							if (code == '000') {
								AppAlert.add('success', '确认送达成功');
								$scope.queryOrderLst({
									pageNo : $scope.curPageNo,
									pageSize : $scope.pageSize
								});
							} else {
								AppAlert.add('danger', _.result(data, 'msg', ''));
							}
						}).error(function (data) {
							AppAlert.add('danger', '请求失败');
						});
						break;
					case "prev":
						break;
					case "next":
						break;
				}
				if (!_.isEmpty(controller)) {
					$modal.open({
						size : modalSize,
						windowClass : windowClass,
						controller : controller,
						templateUrl : templateUrl,
						resolve : resolve,
						backdrop : backdrop
					});
				}

			};
			// 重新渲染接单页面的View层
			$scope.refreshPage = function (cbFn) {
				var curOrder = $scope.curOrderDetail,
					orderKey = _.result(curOrder, 'orderKey');
				var callServer = CloudOrderService.getOrderByOrderKey({
					orderKey : orderKey
				});
				$scope.queryOrderLst({
					pageNo : $scope.curPageNo,
					pageSize : $scope.pageSize
				});
				callServer.success(function () {
					// $scope.curOrderDetail = CloudOrderService.getOrderDetail();
					$scope.curOrderDetail = null;
					cbFn();
				});
			};
			// 加载订单字典数据
			OrderNoteService.getOrderNotesLst({}, function (data) {
				IX.Debug.info("Order Notes: ");
				IX.Debug.info(OrderNoteService.OrderNoteDict);
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});
		}
	]);

	// 下单选台操作控制器
	app.controller('SubmitCloudOrderController', [
		'$scope', '$rootScope', '$modalInstance', '$location', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'TableService', 'CloudOrderService', 'AppAlert', 'AppConfirm',
		function ($scope, $rootScope, $modalInstance, $location, $filter, _scope, CommonCallServer, OrderService, TableService, CloudOrderService, AppAlert, AppConfirm) {
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};

		}
	]);
	// 退单原因选择控制器
	app.controller('RejectCloudOrderCauseController', [
		'$scope', '$rootScope', '$modalInstance', '$location', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'TableService', 'CloudOrderService', 'OrderNoteService', 'AppAlert', 'AppConfirm',
		function ($scope, $rootScope, $modalInstance, $location, $filter, _scope, CommonCallServer, OrderService, TableService, CloudOrderService, OrderNoteService, AppAlert, AppConfirm) {
			var order = _scope.curOrderDetail,
				orderSubType = _.result(order, 'orderSubtype');
			var rejectRemarkData = OrderNoteService[orderSubType == 20 ? 'getTakeoutOrderRejectNotes' : 'getOrderRejectNotes']();
			$scope.RejectRemarks = _.result(rejectRemarkData, 'items', []);
			$scope.rejectCause = '';
			var callServer = null;
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				if (_.isEmpty($scope.rejectCause)) {
					AppAlert.add('danger', '请选择退单原因!');
					return;
				}
				IX.Debug.info("Order Reject Cause:");
				IX.Debug.info($scope.rejectCause);
				callServer = CloudOrderService.reject($scope.rejectCause);
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						AppAlert.add('success', '退单成功!');
						_scope.refreshPage(function () {
							$modalInstance.close();
						});
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '退单服务失败!');
				});
				
			};
			$scope.onRejectRemarkChange = function (v) {
				$scope.rejectCause = v;
			};
		}
	]);
	// 退款原因选择控制器
	app.controller('RefundCloudOrderCauseController', [
		'$scope', '$rootScope', '$modalInstance', '$location', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'TableService', 'CloudOrderService', 'OrderNoteService', 'AppAlert', 'AppConfirm',
		function ($scope, $rootScope, $modalInstance, $location, $filter, _scope, CommonCallServer, OrderService, TableService, CloudOrderService, OrderNoteService, AppAlert, AppConfirm) {
			var order = _scope.curOrderDetail,
				orderSubType = _.result(order, 'orderSubtype');
			var rejectRemarkData = OrderNoteService[orderSubType == 20 ? 'getTakeoutOrderRejectNotes' : 'getOrderRejectNotes']();
			$scope.RejectRemarks = _.result(rejectRemarkData, 'items', []);
			$scope.rejectCause = '';
			$scope.receivableAmount = _.result(order, 'receivableAmount', 0);
			var callServer = null;
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				if (_.isEmpty($scope.rejectCause)) {
					AppAlert.add('danger', '请选择退款原因!');
					return;
				}
				IX.Debug.info("Order Refund Cause:");
				IX.Debug.info($scope.rejectCause);
				callServer = CloudOrderService.refund($scope.rejectCause);
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						AppAlert.add('success', '退款成功!');
						_scope.refreshPage(function () {
							$modalInstance.close();
						});
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '退款服务失败!');
				});
				
			};
			$scope.onRejectRemarkChange = function (v) {
				$scope.rejectCause = v;
			};
		}
	]);
	// 确认送出控制器
	app.controller('ConfirmTakeoutController', [
		'$scope', '$rootScope', '$modalInstance', '$location', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'TableService', 'CloudOrderService', 'AppAlert', 'AppConfirm',
		function ($scope, $rootScope, $modalInstance, $location, $filter, _scope, CommonCallServer, OrderService, TableService, CloudOrderService, AppAlert, AppConfirm) {
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
		}
	]);
});