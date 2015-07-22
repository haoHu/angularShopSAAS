define(['app', 'diandan/OrderHeaderSetController'], function(app)
{
	var OrderDetailLabels = {
		reportDate : {label : '报表统计日期', type : 'date', format : 'yyyy/MM/dd'},
		saasOrderKey : {label : '订单Key'},
		saasOrderNo : {label : '日流水号'},
		timeNameCheckout : {label : '结账餐段'},
		areaName : {label : '所属区域'},
		tableName : {label : '桌台名称'},
		channelName : {label : '渠道名称'},
		channelOrderNo : {label : '渠道订单号'},
		orderSubType : {label : '订单类型', type : 'orderSubType'},
		netOrderTypeCode : {label : '订单类型标识', type : 'netOrderTypeCode'},
		startTime : {label : '开台时间', type : 'date', format : 'yyyy/MM/dd HH:mm:ss'},
		createBy : {label : '创建人员'},
		checkoutTime : {label : '结账时间', type : 'date', format : 'yyyy/MM/dd HH:mm:ss'},
		checkoutBy : {label : '结账人员'},
		orderStatus : {label : '订单状态', type : 'orderStatus'},
		foodCount : {label : '菜品条目数'},
		foodAmount : {label : '菜品金额合计', type : 'cash', format : '￥'},
		sendFoodAmount : {label : '赠菜金额合计', type : 'cash', format : '￥'},
		cardNo : {label : '会员卡号'},
		cardTransID : {label : '会员卡交易ID'},
		discountRate : {label : '折扣率'},
		discountRange : {label : '打折范围', type : 'discountRange'},
		isVipPrice : {label : '是否执行会员价', type : 'isVipPrice'},
		moneyWipeZeroType : {label : '抹零规则', type : 'moneyWipeZeroType'},
		promotionAmount : {label : '优惠金额', type : 'cash', format : '￥'},
		promotionDesc : {label : '优惠描述'},
		paidAmount : {label : '订单实收金额', type : 'cash', format : '￥'},
		invoiceTitle : {label : '发票抬头'},
		invoiceAmount : {label : '开票金额', type : 'cash', format : '￥'},
		userName : {label : '顾客姓名'},
		userSex : {label : '顾客性别', type : 'userSex'},
		userMobile : {label : '顾客电话'},
		userAddress : {label : '顾客地址'},
		modifyOrderLog : {label : '修改订单日志'},
		YJZCount : {label : '预结账次数'},
		FJZCount : {label : '反结账次数'},
		alertFlagLst : {label : '账单异常标识'},
		saasOrderRemark : {label : '账单备注'},
		deviceCode : {label : '设备编号'},
		deviceName : {label : '设备名称'},
		actionTime : {label : '记录修改时间', type : 'date', format : 'yyyy/MM/dd HH:mm:ss'},
		createTime : {label : '记录创建时间', type : 'date', format : 'yyyy/MM/dd HH:mm:ss'}
	};
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
			$scope.pageSize = _.result(searchParams, 'pageSize', 10);
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
					pageSize : _.result(pager, 'pageSize', 10)
				};
				var callServer = LocalOrderLstService.loadLocalOrderLstData(params);
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
                        updateOrderLstData();
                        // AppAlert.add('success', "数据加载成功");
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
				if (orderStatus == 20) {
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
		'$scope', '$rootScope', '$modalInstance', '$filter', '$location', '$modal', '_scope', 'storage', 'OrderService', 'OrderChannel', 'AppAlert', 'AppAuthEMP',
		function ($scope, $rootScope, $modalInstance, $filter, $location, $modal, _scope, storage, OrderService, OrderChannel, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			var shopInfo = storage.get("SHOPINFO"),
				operationMode = _.result(shopInfo, 'operationMode');
			var orderData = OrderService.getOrderData(),
				reviewBy = _.result(orderData, 'reviewBy', '');
			// var detailKeys = 'saasOrderKey,reportDate,saasOrderNo,timeNameCheckout,areaName,tableName,channelName,channelOrderNo,orderSubType,netOrderTypeCode,person,createBy,startTime,checkoutTime,checkoutBy,orderStatus,foodCount,foodAmount,sendFoodAmount,cardNo,cardTransID,discountRate,discountRange,isVipPrice,moneyWipeZeroType,promotionAmount,promotionDesc,paidAmount,invoiceTitle,invoiceAmount,userName,userSex,userMobile,userAddress,modifyOrderLog,YJZCount,FJZCount,alertFlagLst,saasOrderRemark,deviceCode,deviceName,actionTime,createTime'.split(',');
			
			var mapOrderDetailData = function () {
				var detailLabels = OrderDetailLabels;
				var ret = [], i = 0;
				_.each(detailLabels, function (el, k) {
					var v = _.result(orderData, k),
						label = el.label;
					var idx = Math.floor(i / 2);
					if (_.isEmpty(ret[idx])) {
						ret.push([_.extend(el, {
							key : k,
							value : v
						})]);
					} else {
						ret[idx].push(_.extend(el, {
							key : k,
							value : v
						}));
					}
					i++;
				});
				return ret;
			};
			$scope.reviewBy = reviewBy;
			$scope.curOrderDetail = mapOrderDetailData();
			
			$scope.mapOrderDetailValue = function (el) {
				var k = el.key, v = el.value, type = el.type || '', format = el.format;
				var ret = '', emptyStr = '--';
				switch(type) {
					case 'date':
						ret = $filter('formatDateTimeStr')(v, format);
						break;
					case 'orderSubType':
						ret = v == 0 ? '堂食' : (v == 1 ? '外卖' : '自提');
						break;
					case 'orderStatus':
						ret = v == 10 ? '存单' : (v == 20 ? '已落单' : (v == 30 ? '废单' : '已结账'));
						break;
					case 'netOrderTypeCode':
						ret = Hualala.TypeDef.NetOrderTypeCode[v] || emptyStr;
						break;
					case 'discountRange':
						ret = v == 0 ? '部分打折' : '全单打折';
						break;
					case 'isVipPrice':
						ret = v == 0 ? '非会员价' : '会员价';
						break;
					case 'moneyWipeZeroType':
						ret = _.result(_.find(Hualala.TypeDef.MoneyWipeZeroTypes, function (el) {return el.value == v;}), 'label', emptyStr);
						break;
					case 'userSex':
						ret = _.result(_.find(_.find(Hualala.TypeDef.GENDER, function (el) {return el.value == v;})), 'label', emptyStr);
						break;
					case 'cash':
						ret = $filter('mycurrency')(v, format);
						break;
					default:
						ret = v || emptyStr;
						break;
				}
				return ret;
			};

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
				$scope.curOrderPayLst = _.result(OrderService.getOrderData(), 'payLst', []);
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
			// 计算菜品总金额
			$scope.getOrderFoodAmount = function () {
				var orderData = OrderService.getOrderData();
				return _.result(orderData, 'foodAmount', 0);
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
				jumpToDinnerPage(_.result(orderData, 'saasOrderKey'), _.result(orderData, 'tableName'));
				$scope.close();
			};
			// 完成审核
			$scope.doAudit = function () {
				var callServer = OrderService.orderAudit();
				var addAuthEMP = function () {
					AppAuthEMP.add({
						yesFn : function (empInfo) {
							callServer = OrderService.orderAudit(empInfo);
							callServer.success(successCallBack);
						},
						noFn : function () {

						}
					});
				};
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						AppAlert.add('success', "完成审核");
						$scope.reviewBy = $XP(data, 'data.reviewBy', '');
					} else if (code == 'CS005') {
						addAuthEMP();
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				};
				callServer.success(function (data) {
					successCallBack(data);
				});
			};
			// 打开订单详情窗口
			var openModal = function (modalCfg) {
				// if ($scope.modalIsOpen()) return;
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
				// $scope.modalIsOpen(true);
				// $modal.open(modalCfg);
				Hualala.ModalCom.openModal($rootScope, $modal, modalCfg);
			};
			// 修改发票
			$scope.modifyInvoice = function () {
				openModal({
					modalSize : 'md',
					windowClass : 'invoice-modal',
					backdrop : 'static',
					controller : 'OrderInvoiceViewController',
					templateUrl : 'js/dingdan/invoice.html',
					resolve : {
						_scope : function () {
							return $scope;
						}
					}
				});
			};
			// 作废操作
			$scope.abolishOrder = function () {
				openModal({
					modalSize : 'md',
					windowClass : 'invoice-modal',
					backdrop : 'static',
					controller : 'AbolishOrderViewController',
					templateUrl : 'js/dingdan/abolish.html',
					resolve : {
						_scope : function () {
							return $scope;
						}
					}
				});
			};

			$scope.refreshParentLst = function () {
				_scope.queryOrderLst({
					pageNo : _scope.curPageNo,
					pageSize : _scope.pageSize
				});
			};

			$scope.checkOrderIsVoided = function () {
				return _.result(orderData, 'orderStatus') == '30';
			};
			
			$scope.resetOrderInfo();
		}
	]);

	/*订单发票*/
	app.controller('OrderInvoiceViewController', [
		'$scope', '$modalInstance', '$filter', '$location', '_scope', 'storage', 'OrderService', 'OrderChannel', 'AppAlert', 'AppAuthEMP',
		function ($scope, $modalInstance, $filter, $location, _scope, storage, OrderService, OrderChannel, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			var shopInfo = storage.get("SHOPINFO"),
				operationMode = _.result(shopInfo, 'operationMode');
			var orderInfo = OrderService.getOrderData();
			$scope.fmEls = {
				invoiceTitle : _.result(orderInfo, 'invoiceTitle', ''),
				invoiceAmount : _.result(orderInfo, 'invoiceAmount', ''),
				sendCouponAmount : _.result(orderInfo, 'sendCouponAmount', ''),
				sendCouponRemark : _.result(orderInfo, 'sendCouponRemark', ''),
				modifyRemark : ''
			};
			// $scope.invoiceTitle = _.result(orderInfo, 'invoiceTitle', '');
			// $scope.invoiceAmount = _.result(orderInfo, 'invoiceAmount', '');
			// $scope.sendCouponAmount = _.result(orderInfo, 'sendCouponAmount', '');
			// $scope.sendCouponRemark = _.result(orderInfo, 'sendCouponRemark', '');
			// $scope.modifyRemark = '';
			// 关闭窗口
			$scope.close = function () {
				// _scope.modalIsOpen(false);
				$modalInstance.close();
			};
			// 保存数据
			$scope.save = function () {
				// var postParams = {
				// 	invoiceTitle : $scope.invoiceTitle,
				// 	invoiceAmount : $scope.invoiceAmount,
				// 	modifyRemark : $scope.modifyRemark,
				// 	sendCouponAmount : $scope.sendCouponAmount,
				// 	sendCouponRemark : $scope.sendCouponRemark
				// };
				var postParams = $scope.fmEls;
				var callServer = OrderService.updateOrderInvoice(postParams);
				var addAuthEMP = function () {
					AppAuthEMP.add({
						yesFn : function (empInfo) {
							callServer = OrderService.updateOrderInvoice(_.extend(postParams, empInfo));
							callServer.success(successCallBack);
						},
						noFn : function () {

						}
					});
				};
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						$scope.close();
					} else if (code == 'CS005') {
						addAuthEMP();
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				};
				
				callServer.success(function (data) {
					successCallBack(data);
				});
			};
		}
	]);
	/*账单作废操作*/
	app.controller('AbolishOrderViewController', [
		'$scope', '$modalInstance', '$filter', '$location', '_scope', 'storage', 'OrderService', 'OrderChannel', 'AppAlert', 'AppConfirm', 'AppAuthEMP',
		function ($scope, $modalInstance, $filter, $location, _scope, storage, OrderService, OrderChannel, AppAlert, AppConfirm, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			var orderInfo = OrderService.getOrderData();
			$scope.saasOrderRemark = '';
			// 关闭窗口
			$scope.close = function () {
				// _scope.modalIsOpen(false);
				$modalInstance.close();
			};
			// 保存数据
			$scope.save = function () {
				var callServer;
				var addAuthEMP = function () {
					AppAuthEMP.add({
						yesFn : function (empInfo) {
							callServer = OrderService.abolishOrder($scope.saasOrderRemark, empInfo);
							callServer.success(successCallBack);
						},
						noFn : function () {

						}
					});
				};
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						$scope.close();
						_scope.refreshParentLst();
						_scope.close();
					} else if (code == 'CS005') {
						addAuthEMP();
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				};
				AppConfirm.add({
					title : "订单作废",
					msg : '是否将此订单作废?',
					yesFn : function () {
						callServer = OrderService.abolishOrder($scope.saasOrderRemark);
						callServer.success(function (data) {
							successCallBack(data);
						});
					},
					noFn : function () {
						e.stopPropagation();
						return;
					}
				});
			};
		}
	]);
});