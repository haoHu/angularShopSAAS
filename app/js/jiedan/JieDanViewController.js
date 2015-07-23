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
							// btn.label = orderStatus == 20 ? '打印清单' : (orderStatus == 40 ? '打印对账单' : '打印退款凭证');
							// btn.label = (orderStatus == 20 || orderStatus == 30) ? '打印清单' : '打印对账单';
							// btn.label = orderStatus == 40 && isAlreadyPaid == 1 && shopRefundAmount > 0 ? '打印退款凭证' : btn.label;
							btn.label = "打印";
							break;
						case "sendout":
							disabled = (orderStatus == 40 && orderSubType == 20 && takeoutDeliveryTime == 0 && isAlreadyPaid != 1) ? false : true;
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
				return $scope.queryOrderLst({
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
						// AppAlert.add('success', '数据加载成功');
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
				return callServer;
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
						orderKey : _.result(order, 'orderKey', ''),
						hisFlag : _.result(order, 'his', 0)
					});
				}
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						// 构建订单详情渲染数据
						// AppAlert.add('success', '订单数据加载成功');
						$scope.curOrderDetail = CloudOrderService.getOrderDetail();
						updateOrderBtnsStatus();
						if (acceptTime == 0) {
							// CloudOrderLstService.updateOrder($scope.curOrderDetail);
							// updateOrderLstData();
							// 更新订单列表数据
							$scope.queryOrderLst({
								pageNo : $scope.curPageNo,
								pageSize : $scope.pageSize
							});
							CloudOrderService.getOrderByOrderKey({
								orderKey : _.result(order, 'orderKey', ''),
								hisFlag : _.result(order, 'his', 0)
							}).success(function (data) {
								var code = _.result(data, 'code');
								if (code == '000') {
									$scope.curOrderDetail = CloudOrderService.getOrderDetail();
									updateOrderBtnsStatus();
								} else {
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							});
						}
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
				
			};
			// 打印动作，根据订单不同状态，打印不同单据
			$scope.printAction = function (data) {
				// var cmd = (orderStatus == 20 || orderStatus == 30) ? 'PrintOrderDetailBill' : 'PrintCheckoutBill';
				// cmd = orderStatus == 40 && isAlreadyPaid == 1 && shopRefundAmount > 0 ? 'PrintOther' : cmd;
				var cmd = 'PrintOther',
					msg = _.result(CloudOrderService.getOrderDetail(), 'orderPrnTxt', '');
				if (!_.isEmpty(data)) {
					cmd = 'PrintCheckoutBill';
					msg = JSON.stringify(data);
				}
				Hualala.DevCom.exeCmd(cmd, msg);
			};
			// 获取上一条、下一条订单记录
			var getNextOrder = function (act) {
				var step = act == 'prev' ? -1 : 1;
				var _pageNo = parseInt($scope.curPageNo),
					_totalSize = parseInt($scope.totalSize),
					_pageSize = parseInt($scope.pageSize),
					_pageCount = Math.ceil(_totalSize / _pageSize);
				var curOrder = $scope.curOrderDetail;
				var idx = CloudOrderLstService.indexOfLst(_.result(curOrder, 'orderKey'));
				if (idx == -1) return;
				var nextIdx = (_pageNo - 1) * _pageSize + idx + 1 + step,
					nextPageNo = Math.ceil(nextIdx / _pageSize);
				if (nextPageNo > _pageCount || nextPageNo == 0 || nextIdx > _totalSize) {
					AppAlert.add('danger', act == 'prev' ? '这是第一条!' : '这是最后一条!');
				} else if (nextPageNo != _pageNo) {
					var _i = nextPageNo > _pageNo ? 0 : (_pageSize - 1);
					$scope.curPageNo = nextPageNo;
					$scope.selectPage().success(function () {
						$scope.selectCurOrder(CloudOrderLstService.getOrderByIdx(_i));
					});
				} else {
					$scope.selectCurOrder(CloudOrderLstService.getOrderByIdx(idx + step));
				}
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
						var shopInfo = storage.get("SHOPINFO"),
						operationMode = _.result(shopInfo, 'operationMode');
						if (operationMode == 1 && (orderSubType == '20' || orderSubType == '21' || orderSubType == '41')) {
							// 外卖，自提，店内自助不需要选择桌台
							callServer = CloudOrderService.submit();
							callServer.success(function (data) {
								var code = _.result(data, 'code');
								var _data = _.result(data, 'data'),
									_orderStatus = _.result(_data, 'orderStatus');
								if (code == '000') {
									AppAlert.add('success', '下单成功');
									_orderStatus == 40 && $scope.printAction(_.result(data, 'data'));
									$scope.queryOrderLst({
										pageNo : $scope.curPageNo,
										pageSize : $scope.pageSize
									});
									updateOrderBtnsStatus();
								} else {
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							}).error(function (data) {
								AppAlert.add('danger', '请求失败');
							});
						} else {
							controller = "SubmitCloudOrderController";
	                        templateUrl = "js/jiedan/chooseTable.html";
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
						$scope.printAction();
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
								updateOrderBtnsStatus();
							} else {
								AppAlert.add('danger', _.result(data, 'msg', ''));
							}
						}).error(function (data) {
							AppAlert.add('danger', '请求失败');
						});
						break;
					case "prev":
					case "next":
						getNextOrder(act);
						break;
				}
				if (!_.isEmpty(controller)) {
					// $modal.open({
					// 	size : modalSize,
					// 	windowClass : windowClass,
					// 	controller : controller,
					// 	templateUrl : templateUrl,
					// 	resolve : resolve,
					// 	backdrop : backdrop
					// });
					Hualala.ModalCom.openModal($rootScope, $modal, {
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
					orderKey = _.result(curOrder, 'orderKey'),
					hisFlag = _.result(curOrder, 'his', 0);
				var callServer = CloudOrderService.getOrderByOrderKey({
					orderKey : orderKey,
					hisFlag : hisFlag
				});
				$scope.queryOrderLst({
					pageNo : $scope.curPageNo,
					pageSize : $scope.pageSize
				}).success(function () {
					var _orderSchame = CloudOrderLstService.getOrderByOrderKey(orderKey);
					if (_.isEmpty(_orderSchame)) {
						$scope.curOrderDetail = null;
						updateOrderBtnsStatus();
						cbFn();
					} else {
						callServer.success(function () {
							$scope.curOrderDetail = CloudOrderService.getOrderDetail();
							updateOrderBtnsStatus();
							cbFn();
						});
					}
					
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
			// var rejectRemarkData = OrderNoteService[orderSubType == 20 ? 'getTakeoutOrderRejectNotes' : 'getOrderRejectNotes']();
			var rejectRemarkData = OrderNoteService.getOrderRefundNotes();
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
			var callServer = null;
			$scope.takeoutRemark = '';

			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			$scope.save = function () {
				IX.Debug.info("Order Takeout Remark:");
				IX.Debug.info($scope.takeoutRemark);
				callServer = CloudOrderService.confirmTakeout($scope.takeoutRemark);
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						AppAlert.add('success', '确认送出成功!');
						_scope.refreshPage(function () {
							$modalInstance.close();
						});
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', '确认送出服务失败!');
				});
			};
		}
	]);

	// 下单选台操作控制器
	app.controller('SubmitCloudOrderController', [
		'$scope', '$rootScope', '$modalInstance', '$location', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'TableService', 'CloudOrderService', 'AppAlert', 'AppConfirm',
		function ($scope, $rootScope, $modalInstance, $location, $filter, _scope, CommonCallServer, OrderService, TableService, CloudOrderService, AppAlert, AppConfirm) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			// HC.TopTip.reset($rootScope);
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			var allTableLstPromise = TableService.loadTableStatusLst();
			
			// 桌台名称搜索关键字
			$scope.qTblName = '';
			// 桌台状态过滤字段
			$scope.qTblStatus = '0';
			
			// 当前选中桌台区域名
			$scope.curAreaName = '';
			// 桌台区域数据
			$scope.TableAreas = [];
			// 格式化区域选项的渲染数据
			var mapTableAreaRenderData = function (areas) {
				var ret = _.map(areas, function (area) {
					return _.extend(area, {
						value : _.result(area, 'areaName'),
						label : _.result(area, '__ID__') == 'all_tables' ? '全部' : _.result(area, 'areaName')
					});
				});
				return ret;
			};
			// 获取当前的桌台信息
			var getCurTables = function () {
				// 获取所有桌台数据
				var tables = TableService.filterTableLst($scope.qTblStatus, $scope.curAreaName);
				$scope.curTables = tables;
			};
			allTableLstPromise.success(function (data) {
				var areas = TableService.getTableAreas();
				getCurTables();
				$scope.TableAreas = mapTableAreaRenderData(areas);
				
			});
			/**
			 * 选择桌台区域
			 * @param  {[type]} v areaName
			 * @return {[type]}   [description]
			 */
			$scope.selectTableArea = function (v) {
				$scope.curAreaName = v;
				// 获取指定区域桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					// var areas = TableService.getTableAreas();
					getCurTables();
					// $scope.TableAreas = mapTableAreaRenderData(areas);
				});
				
			};
			/**
			 * 根据桌台状态过滤桌台
			 * @param  {[type]} s [description]
			 * @return {[type]}   [description]
			 */
			$scope.queryTablesByStatus = function (s) {
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					getCurTables();
				});
			};
			/**
			 * 选择桌台动作
			 * @param  {[type]} v [description]
			 * @return {[type]}   [description]
			 */
			$scope.selectTableName = function (table) {
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = tableKey;
				$scope.curTableName = _.result(table, 'tableName', '');
				// 获取当前选中桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					AppConfirm.add({
						title : '下单操作',
						msg : "是否下单到此桌台?",
						yesFn : function () {
							var callServer = CloudOrderService.submit($scope.curTableName);
							callServer.success(function (data) {
								var code = _.result(data, 'code');
								var _data = _.result(data, 'data'),
									_orderStatus = _.result(data, 'orderStatus');
								if (code == '000') {
									AppAlert.add('success', '下单成功');
									_orderStatus == 40 && _scope.printAction(_.result(data, 'data'));
									_scope.queryOrderLst({
										pageNo : $scope.curPageNo,
										pageSize : $scope.pageSize
									});
									_scope.selectCurOrder(_scope.curOrderDetail);
									$modalInstance.close();
								} else {
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							}).error(function (data) {
								AppAlert.add('danger', '请求失败');
							});
						},
						noFn : function () {
							$modalInstance.close();
						}
					});
				});
			};
			/**
			 * 快捷选择桌台
			 * @return {[type]} [description]
			 */
			$scope.quickSelectTable = function ($event, tableName) {
				var evtType = $event.type, keyCode = $event.keyCode;
				if (evtType == 'keyup' && keyCode != 13) {return false;}
				var table = TableService.getTablesByTableName(tableName);
				table = table[0];
				if (_.isEmpty(table)) {
					// HC.TopTip.addTopTips($rootScope, {
					// 	code : '111',
					// 	msg : "桌台不存在"
					// });
					AppAlert.add('danger', '桌台不存在');
					return;
				}
				$scope.selectTableName(table);

			};

			/**
			 * 判断桌台被锁定
			 * @param  {[type]} lockedBy [description]
			 * @return {[type]}          [description]
			 */
			$scope.tableIsLocked = function (lockedBy) {
				return !_.isEmpty(lockedBy);
			};

			/**
			 * 判断桌台被并台
			 * @param  {[type]} unionTableGroupName [description]
			 * @return {[type]}                     [description]
			 */
			$scope.tableIsUnion = function (unionTableGroupName) {
				return !_.isEmpty(unionTableGroupName);
			};

			/**
			 * 判断桌台被预定
			 * @param  {[type]} bookOrderNo [description]
			 * @return {[type]}             [description]
			 */
			$scope.tableIsBooked = function (bookOrderNo) {
				return !_.isEmpty(bookOrderNo);	
			};
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};

		}
	]);
});