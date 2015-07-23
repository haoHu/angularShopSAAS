define(['app'], function (app) {
	app.controller('ProduceViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$interval', 'storage', 'CommonCallServer', 'OrderService', 'ProduceOrderService', 'AppAlert', 'AppAuthEMP',
		function ($scope, $rootScope, $modal, $location, $filter, $interval, storage, CommonCallServer, OrderService, ProduceOrderService, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common,
				shopInfo = storage.get('SHOPINFO'),
				isFoodMakeStatusActive = _.result(shopInfo, 'isFoodMakeStatusActive'),
				foodMakeWarningTimeout = parseInt(_.result(shopInfo, 'foodMakeWarningTimeout', 300)),
				foodMakeDangerTimeout = parseInt(_.result(shopInfo, 'foodMakeDangerTimeout', 600));
			$scope.curFocusOrder = null;
			$scope.curFocusFoods = [];
			$scope.orderPageNo = 1;
			$scope.qform = {
				// 查询关键字
				qKeyword : '',
				// 过滤条件
				qActionType : 'JXZ'
			};
			$scope.OrderLst = [];
			$scope.oInterval = null;
			// 清空当前选中的订单数据
			var cleanCurFocusOrderData = function () {
				cleanCurFocusFoods();
				$scope.curFocusOrder = null;
			};
			var cleanCurFocusFoods = function () {
				_.each(_.result($scope.curFocusOrder, 'foodLst'), function (el) {
					el.selected = false;
				});
				$scope.curFocusFoods = [];
			};
			// 判断是否为当前选中的菜品
			var isSelectedFood = function (order, food) {
				var saasOrderKey = _.result(order, 'saasOrderKey'),
					_f = null;
				if (saasOrderKey != _.result(order, 'saasOrderKey')) return false;
				_f = _.find($scope.curFocusFoods, function (item) {
					return _.result(item, 'itemKey') == _.result(food, 'itemKey');
				});
				return !_.isEmpty(_f);
			};
			// 添加选中菜品
			var addCurFocusFood = function (food) {
				$scope.curFocusFoods.push(food);
			};
			// 删除选中菜品
			var deleteCurFocusFood = function (food) {
				var itemKey = _.result(food, 'itemKey');
				$scope.curFocusFoods = _.filter($scope.curFocusFoods, function (el) {
					return _.result(el, 'itemKey') != itemKey;
				});
			};
			// 计时器开启
			var pollingOrderDealInterval = function () {
				$scope.oInterval = $interval(function () {
					_.each($scope.OrderLst, function (order) {
						var s = $scope.getOrderDealInterval(_.result(order, 'startTime', null));
						order.makeIntervalTime = s;
						$scope.getOrderDealStatus(order);
					});
				}, 1000);
			};
			// 计时器取消
			var cancelPollingOrderDealInterval = function () {
				return $interval.cancel($scope.oInterval);
			};
			// 关键字搜索
			$scope.queryByKeyword = function ($event) {
				var evtType = $event.type,
					keyCode = $event.keyCode;
				if (evtType == 'keyup' && keyCode != 13) return;
				console.info('qKeyword:' + $scope.qform.keyword);
				$scope.queryFoodMakeStatusLst();
			};
			// 过滤条件查询
			$scope.queryByActionType = function (v) {
				$scope.qform.qActionType = v;
				$scope.queryFoodMakeStatusLst();
			};
			// 查询数据
			$scope.queryFoodMakeStatusLst = function () {
				cancelPollingOrderDealInterval();
				cleanCurFocusOrderData();
				var callServer = ProduceOrderService.loadFoodMakeStatusLst({
					actionType : $scope.qform.qActionType,
					keyword : $scope.qform.keyword
				});
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code != '000') {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					} else {
						$scope.OrderLst = ProduceOrderService.getOrderLst();
						pollingOrderDealInterval();
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
			};
			
			// 订单是否选中
			$scope.isSelectedOrder = function (order) {
				var saasOrderKey = _.result(order, 'saasOrderKey');
				return _.isEmpty($scope.curFocusOrder) ? false : (_.result($scope.curFocusOrder, 'saasOrderKey') == saasOrderKey);
			};
			// 订单是否展开
			$scope.isPopupOrder = function (order) {

			};
			// 订单类型
			$scope.getOrderSubType = function (order) {
				var orderSubType = _.result(order, 'orderSubType');
				var clz = '';
				switch(orderSubType) {
					case '0':
					// 堂食
						clz = 'icon-tangshi';
						break;
					case '20':
					// 外卖
						clz = 'icon-waimai';
						break;
					case '21':
					// 自提
						clz = 'icon-ziti';
						break;
				}
				return clz;
			};
			// 订单处理状态标示
			$scope.getOrderDealStatus = function (order) {
				var makeIntervalTime = _.result(order, 'makeIntervalTime'),
					orderDealStatus = _.result(order, 'orderDealStatus'),
					timer, status;
				if (_.isEmpty(makeIntervalTime)) return '';
				timer = makeIntervalTime.split(':');
				timer = parseInt(timer[0]) * 3600 + parseInt(timer[1] * 60) + parseInt(timer[2]);
				status = timer < foodMakeWarningTimeout ? '' : (timer < foodMakeDangerTimeout ? 'warning' : 'danger');
				status = $scope.qform.qActionType == 'YWC' ? '' : status;
				order.orderDealStatus = orderDealStatus != status ? status : orderDealStatus;
			};
			// 获得订单开始时间距现在的时间间隔
			$scope.getOrderDealInterval = function (timeStamp) {
				var dateStr = HC.formatDateTimeValue(timeStamp),
					timeTickInSec = IX.Date.getTimeTickInSec(dateStr),
					udate = IX.Util.Date(timeTickInSec);
				// return _.isEmpty(timeStamp) ? '' : udate.toInterval();
				return _.isEmpty(timeStamp) ? '' : udate.toTimer();
			};
			// 选择当前操作订单
			$scope.selectOrder = function (order) {
				if (!_.isEmpty($scope.curFocusOrder)) {
					cleanCurFocusFoods();
				}
				$scope.curFocusOrder = order;
			};
			// 选择/取消选择菜品
			$scope.toggleFood = function ($event, order, food) {
				var saasOrderKey = _.result(order, 'saasOrderKey');
				if (_.result($scope.curFocusOrder, 'saasOrderKey') !== saasOrderKey) {
					cleanCurFocusOrderData();
					$scope.curFocusOrder = order;
				}
				if (_.result(food, 'selected')) {
					food.selected = false;
					deleteCurFocusFood(food);
				} else {
					food.selected = true;
					addCurFocusFood(food);
				}
				$event.stopPropagation();
			};
			// 菜品出品状态操作
			$scope.foodOperate = function (actionType) {
				var saasOrderKey = _.result($scope.curFocusOrder, 'saasOrderKey'),
					foodItemKeyLst = _.map($scope.curFocusFoods, function (food) {
						return _.result(food, 'itemKey');
					}),
					post = {
						actionType : actionType,
						saasOrderKey : saasOrderKey,
						foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})
					}, c;
				if (_.isEmpty($scope.curFocusOrder)) return ;
				c = ProduceOrderService.foodMakeStatusOperate(post);
				c.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						cleanCurFocusFoods();
						// $scope.OrderLst = ProduceOrderService.getOrderLst();
					} else {
						AppAlert.add('danger', _,result(data, 'msg', ''));
					}
				});
			};
			// 菜品制作状态样式
			$scope.getFoodMakeStatusStyle = function (order, food) {
				var r = ProduceOrderService.getOrderFoodMakeStatus(_.result(order, 'saasOrderKey'), _.result(food, 'itemKey'));
				return _.result(r, 'name');
			};
			// 菜品制作状态文字
			$scope.getFoodMakeStatusStr = function (order, food) {
				var r = ProduceOrderService.getOrderFoodMakeStatus(_.result(order, 'saasOrderKey'), _.result(food, 'itemKey'));
				return _.result(r, 'str');
			};
			// 订单列表翻页
			$scope.nextOrderLstPage = function () {
				var winWidth = window.screen.width,
					pageSize = winWidth < 992 ? 2 : winWidth >= 992 && winWidth < 1200 ? 6 : 8,
					orderLst = ProduceOrderService.getOrderLst(),
					total = orderLst.length,
					pageCount = Math.ceil(total / pageSize),
					nextNo = $scope.orderPageNo >= pageCount ? 1 : $scope.orderPageNo + 1,
					startIdx = (nextNo - 1) * pageSize,
					endIdx = nextNo * pageSize;
				_.each(orderLst, function (order, idx) {
					if (idx >= startIdx && idx < endIdx) {
						order.hidden = false;
					} else {
						order.hidden = true;
					}
				});
				$scope.orderPageNo = nextNo;
			};
			$scope.queryFoodMakeStatusLst();
			pollingOrderDealInterval();
		}
	]);
});