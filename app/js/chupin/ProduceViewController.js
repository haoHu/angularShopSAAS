define(['app'], function (app) {
	app.controller('ProduceViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$interval', 'storage', 'CommonCallServer', 'OrderService', 'ProduceOrderService', 'AppAlert', 'AppAuthEMP',
		function ($scope, $rootScope, $modal, $location, $filter, $interval, storage, CommonCallServer, OrderService, ProduceOrderService, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common,
				shopInfo = storage.get('SHOPINFO'),
				isFoodMakeStatusActive = _.result(shopInfo, 'isFoodMakeStatusActive'),
				// 菜品制作即将超时阀值
				foodMakeWarningTimeout = parseInt(_.result(shopInfo, 'foodMakeWarningTimeout', 300)),
				// 菜品制作超时阀值
				foodMakeDangerTimeout = parseInt(_.result(shopInfo, 'foodMakeDangerTimeout', 600)),
				// 新增出品管理显示模式0：整单；1：单品
				// foodMakeManageShowMode = parseInt(_.result(shopInfo, 'foodMakeManageShowMode', 0)),
				foodMakeManageShowMode = storage.get('foodMakeManageShowMode') || 0;
				// 当前站点管理的菜品部门Key列表，如果为空，表示全部菜品，多个部门用逗号分隔
				// departmentKeyLst = _.result(shopInfo, 'departmentkeyLst', '');
				departmentKeyLst = storage.get('departmentKeyLst') || '';
			var popupOrderLst = function (saasOrderKey) {
				var itemEl = $('#' + saasOrderKey),
					orderTitleH = itemEl.find('.panel-title').height(),
					orderBoxH = itemEl.find('.order-box').height(),
					foodLstEl = itemEl.find('.food-lst'),
					foodLstH = foodLstEl.height();
				if (foodLstH - orderBoxH + orderTitleH > 0) {
					itemEl.removeClass('collapse').addClass('popup');
				}
			};

			$scope.foodMakeManageShowMode = foodMakeManageShowMode;
			$scope.departmentKeyLst = departmentKeyLst;
			// 进行中单数
			$scope.JZXOrderCount = 0;
			// 排队中单数
			$scope.PDZOrderCount = 0;
			// 已挂起单数
			$scope.YGQOrderCount = 0;
			// 当前聚焦订单
			$scope.curFocusOrder = null;
			// 当前聚焦菜品列表
			$scope.curFocusFoods = [];
			// 订单页数
			$scope.orderPageNo = 1;
			// 搜索表单数据
			$scope.qform = {
				// 查询关键字
				qKeyword : '',
				// 过滤条件
				qActionType : 'JXZ'
			};
			// 整单模式下订单列表
			$scope.OrderLst = [];
			// 单品模式下数据列表
			$scope.FoodLst = [];
			// 计时器
			$scope.oInterval = null;
			// 清空当前选中的订单数据
			$scope.cleanCurFocusOrderData = function () {
				$scope.cleanCurFocusFoods();
				$scope.curFocusOrder = null;
			};
			// 清空当前聚焦菜品列表
			$scope.cleanCurFocusFoods = function () {
				_.each(_.result($scope.curFocusOrder, 'foodLst'), function (el) {
					el.selected = false;
				});
				_.each($scope.curFocusFoods, function (el) {
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
			$scope.addCurFocusFood = function (food) {
				$scope.curFocusFoods.push(food);
			};
			// 删除选中菜品
			$scope.deleteCurFocusFood = function (food) {
				var itemKey = _.result(food, 'itemKey');
				$scope.curFocusFoods = _.filter($scope.curFocusFoods, function (el) {
					return _.result(el, 'itemKey') != itemKey;
				});
			};
			$scope.updateCurFocusOrder = function (order) {
				$scope.curFocusOrder = order;
			};
			$scope.updateCurFocusFoodsStatus = function () {
				var fOrder = $scope.curFocusOrder,
					fFoods = $scope.curFocusFoods,
					saasOrderKey = _.result(fOrder, 'saasOrderKey');

				if (!saasOrderKey || fFoods.length == 0) return;
				fOrder = ProduceOrderService.getOrderItem(saasOrderKey);
				_.each(_.result(fOrder, 'foodLst', []), function (food) {
					var itemKey = _.result(food, 'itemKey');
					var _food = _.find(fFoods, function (el) {
						return el.itemKey == itemKey;
					});
					if (!_.isEmpty(_food)) {
						food.selected = true;
					}
				});
				if ($scope.foodMakeManageShowMode == 0) {
					setTimeout(function () {
						popupOrderLst(saasOrderKey);
					}, 200);
				}
			};
			// 计时器开启
			var pollingOrderDealInterval = function () {
				$scope.oInterval = $interval(function () {
					if ($scope.foodMakeManageShowMode == 0) {
						_.each($scope.OrderLst, function (order) {
							var s = $scope.getOrderDealInterval(_.result(order, 'startTime', null));
							order.makeIntervalTime = s;
							$scope.getOrderDealStatus(order);
						});
					} else {
						_.each($scope.FoodLst, function (food) {
							var order = _.result(food, '__order');
							var s = $scope.getOrderDealInterval(_.result(order, 'startTime', null));
							order.makeIntervalTime = s;
							$scope.getOrderDealStatus(order);
						});
					}
				}, 1000);
			};
			// 计时器取消
			var cancelPollingOrderDealInterval = function () {
				return $interval.cancel($scope.oInterval);
			};
			// // 判断订单元素展开时是否需要偏移
			// $scope.isOffsetItem = function (idx, pageSize) {
			// 	var itemIdx = idx % pageSize;
			// 	return itemIdx >= (pageSize / 2) ? true : false;
			// };
			// 关键字搜索
			$scope.queryByKeyword = function ($event) {
				var evtType = $event.type,
					keyCode = $event.keyCode;
				if (evtType == 'keypress' && keyCode != 13) return;
				console.info('qKeyword:' + $scope.qform.qKeyword);
				$scope.queryFoodMakeStatusLst();
			};
			// 过滤条件查询
			$scope.queryByActionType = function (v) {
				$scope.qform.qActionType = v;
				$scope.queryFoodMakeStatusLst();
			};
			// 查询数据
			$scope.queryFoodMakeStatusLst = function (actionType) {
				cancelPollingOrderDealInterval();

				// 菜品操作后的获取数据，不清空当前选中菜品数据
				if (actionType != 'CCJH') {
					$scope.cleanCurFocusOrderData();
				}
				var callServer = ProduceOrderService.loadFoodMakeStatusLst({
					actionType : $scope.qform.qActionType,
					keyword : $scope.qform.qKeyword,
					departmentKeyLst : departmentKeyLst,
					showMode : foodMakeManageShowMode
				});
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code != '000') {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					} else {
						$scope.OrderLst = ProduceOrderService.getOrderLst();
						$scope.FoodLst = ProduceOrderService.getFoodLst();
						pollingOrderDealInterval();
					}
					$scope.JZXOrderCount = ProduceOrderService.getBadgeCountByType('JZXOrderCount');
					$scope.PDZOrderCount = ProduceOrderService.getBadgeCountByType('PDZOrderCount');
					$scope.YGQOrderCount = ProduceOrderService.getBadgeCountByType('YGQOrderCount');
					if (actionType == 'CCJH') {
						// 更新菜品选中状态
						$scope.updateCurFocusFoodsStatus();
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
			};
			
			// // 订单是否选中
			// $scope.isSelectedOrder = function (order) {
			// 	var saasOrderKey = _.result(order, 'saasOrderKey');
			// 	return _.isEmpty($scope.curFocusOrder) ? false : (_.result($scope.curFocusOrder, 'saasOrderKey') == saasOrderKey);
			// };
			
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
				// var saasOrderKey = _.result(order, 'saasOrderKey'),
				// 	itemEl = $('#' + saasOrderKey),
				// 	orderTitleH = itemEl.find('panel-title').height(),
				// 	orderBoxH = itemEl.find('.order-box').height(),
				// 	foodLstEl = itemEl.find('.food-lst'),
				// 	foodLstH = foodLstEl.height();
				// if (foodLstH - orderBoxH + orderTitleH > 0) {
				// 	itemEl.removeClass('collapse').addClass('popup');
				// }
				var saasOrderKey = _.result(order, 'saasOrderKey');
				popupOrderLst(saasOrderKey);
				// if (!_.isEmpty($scope.curFocusOrder)) {
				// 	$('#' + _.result($scope.curFocusOrder, 'saasOrderKey')).addClass('collapse').removeClass('popup');
				// 	$scope.cleanCurFocusFoods();
				// }
				if (!_.isEmpty($scope.curFocusOrder) && $scope.curFocusOrder.saasOrderKey != saasOrderKey) {
					$('#' + _.result($scope.curFocusOrder, 'saasOrderKey')).addClass('collapse').removeClass('popup');
					$scope.cleanCurFocusFoods();
				}
				// $scope.curFocusOrder = order;
				$scope.updateCurFocusOrder(order);
			};
			// // 选择/取消选择菜品
			// $scope.toggleFood = function ($event, order, food) {
			// 	var saasOrderKey = _.result(order, 'saasOrderKey'),
			// 		itemKey = _.result(food, 'itemKey'),
			// 		srcOrderItemEl = $('#' + _.result($scope.curFocusOrder, 'saasOrderKey'));
			// 	var foodMakeStatus = ProduceOrderService.getOrderFoodMakeStatus(saasOrderKey, itemKey);
			// 	if (_.result($scope.curFocusOrder, 'saasOrderKey') !== saasOrderKey) {
			// 		srcOrderItemEl.addClass('collapse').removeClass('popup');
			// 		cleanCurFocusOrderData();
			// 		$scope.curFocusOrder = order;
			// 	}
			// 	if (foodMakeStatus.name == 'done') {
			// 		return true;
			// 	}
			// 	if (_.result(food, 'selected')) {
			// 		food.selected = false;
			// 		$scope.deleteCurFocusFood(food);
			// 	} else {
			// 		food.selected = true;
			// 		$scope.addCurFocusFood(food);
			// 	}
			// 	// $event.stopPropagation();
			// };
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
						// $scope.cleanCurFocusFoods();
						// $scope.OrderLst = ProduceOrderService.getOrderLst();
						// 刷新当前页面
						$scope.queryFoodMakeStatusLst(actionType);
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
			// 隐藏徽章
			$scope.hideBadge = function (type) {
				return !($scope[type] > 0);
			};
			// 监听菜品制作完成的推送消息
			$scope.$on('Produce.updateOrder', function (data) {
				var records = _.result(data, 'records', []);
				IX.Debug.info("Socket Push Produce Msg:");
				IX.Debug.info(records);
				// 增量更新菜品制作状态列表
				ProduceOrderService.updateOrder(data);
			});
			// 刷新页面数据 
			$scope.refresh = function () {
				$scope.queryFoodMakeStatusLst();
			};
			$scope.queryFoodMakeStatusLst();
			pollingOrderDealInterval();
		}
	]);
	
	app.directive('orderMode', [
		"$rootScope", "$filter", "ProduceOrderService",
		function ($rootScope, $filter, ProduceOrderService) {
			return {
				restrict : 'A',
				link : function ($scope, el, attr) {

					// 判断订单元素展开时是否需要偏移
					$scope.isOffsetItem = function (idx, pageSize) {
						var itemIdx = idx % pageSize;
						return itemIdx >= (pageSize / 2) ? true : false;
					};

					// 订单是否选中
					$scope.isSelectedOrder = function (order) {
						var saasOrderKey = _.result(order, 'saasOrderKey');
						return _.isEmpty($scope.curFocusOrder) ? false : (_.result($scope.curFocusOrder, 'saasOrderKey') == saasOrderKey);
					};

					// 选择/取消选择菜品
					$scope.toggleFood = function ($event, order, food) {
						var saasOrderKey = _.result(order, 'saasOrderKey'),
							itemKey = _.result(food, 'itemKey'),
							srcOrderItemEl = $('#' + _.result($scope.curFocusOrder, 'saasOrderKey'));
						var foodMakeStatus = ProduceOrderService.getOrderFoodMakeStatus(saasOrderKey, itemKey);
						if (_.result($scope.curFocusOrder, 'saasOrderKey') !== saasOrderKey) {
							srcOrderItemEl.addClass('collapse').removeClass('popup');
							$scope.cleanCurFocusOrderData();
							// $scope.curFocusOrder = order;
							$scope.updateCurFocusOrder(order);
						}
						if (foodMakeStatus.name == 'done') {
							return true;
						}

						if (_.result(food, 'selected')) {
							food.selected = false;
							$scope.deleteCurFocusFood(food);
						} else {
							food.selected = true;
							$scope.addCurFocusFood(food);
						}
						// $event.stopPropagation();
					};
				}
			}
		}
	]);

	app.directive('foodMode', [
		"$rootScope", "$filter", "ProduceOrderService",
		function ($rootScope, $filter, ProduceOrderService) {
			return {
				restrict : 'A',
				link : function ($scope, el, attr) {
					// 菜品是否选中
					// $scope.isSelectedFood = function (food) {
					// 	var order = _.result(food, '__order'),
					// 		saasOrderKey = _.result(order, 'saasOrderKey'),
					// 		itemkey = _.result(food, 'itemKey');
					// 	return _.indexOf($scope.curFocusFoods, itemKey);
					// };
					// 选中单品
					$scope.isSelectedFood = function (food) {
						var order = _.result(food, '__order'),
							saasOrderKey = _.result(order, 'saasOrderKey'),
							itemKey = _.result(food, 'itemKey');
						var isFocus = _.find($scope.curFocusFoods, function (el) {
							return el.itemKey == itemKey;
						});
						return !isFocus ? false : true;
					};
					// 选择/取消选择菜品
					$scope.toggleFood = function ($event, food) {
						var order = _.result(food, '__order'),
							saasOrderKey = _.result(order, 'saasOrderKey'),
							itemKey = _.result(food, 'itemKey');
						var foodMakeStatus = ProduceOrderService.getOrderFoodMakeStatus(saasOrderKey, itemKey);
						if (!_.isEmpty($scope.curFocusOrder) && $scope.curFocusOrder.saasOrderKey != saasOrderKey) {
							$scope.cleanCurFocusOrderData();
						}
						if (foodMakeStatus.name == 'done') {
							return true;
						}
						// 更新当前选中的订单
						// $scope.curFocusOrder = ProduceOrderService.getOrderItem(saasOrderKey);
						$scope.updateCurFocusOrder(ProduceOrderService.getOrderItem(saasOrderKey));
						$scope.cleanCurFocusFoods();
						// 更新当前选中的foodItem
						if (_.result(food, 'selected')) {
							food.selected = false;
							$scope.deleteCurFocusFood(food);
						} else {
							food.selected = true;
							$scope.addCurFocusFood(food);
						}
						

					};

				}
			}
		}
	]);

	app.directive('foodPager', [
		"$rootScope", "$filter", "ProduceOrderService",
		function ($rootScope, $filter, ProduceOrderService) {
			return {
				restrict : 'A',
				link : function (scope, el, attr) {
					// 获取下一页开始条目
					var getNextPageStartItem = function () {
						var saasOrderKey = attr.foodPager,
							order = ProduceOrderService.getOrderItem(saasOrderKey),
							jItem = $("#" + saasOrderKey);
						var itemLst = _.result(order, 'foodLst'),
							jBox = jItem.find('.food-box'), jlst = jItem.find('.food-lst');
						var listRect = jBox[0].getBoundingClientRect();
						var nextItem = _.find(itemLst, function (item) {
							var itemKey = _.result(item, 'itemKey'),
								itemSelector = '.food-item[item-key=' + itemKey + ']',
								jItem = $(itemSelector),
								itemRect = jItem[0].getBoundingClientRect();
							var ret = null;
							if (listRect.bottom - parseFloat(jBox.css('paddingBottom')) - itemRect.top >= 0
								&& listRect.bottom - parseFloat(jBox.css('paddingBottom')) - itemRect.bottom < 0) {
								// 当前条目一部分在显示范围内，一部分在显示范围外
								ret = itemKey;
							} else if (listRect.bottom - parseFloat(jBox.css('paddingBottom')) - itemRect.bottom < 0) {
								ret = itemKey;
							}
							return ret;
						});
						return nextItem;
					};
					// 获取上一页开始条目
					var getPrevPageStartItem = function () {
						var saasOrderKey = attr.foodPager,
							order = ProduceOrderService.getOrderItem(saasOrderKey),
							jItem = $("#" + saasOrderKey);
						var itemLst = _.result(order, 'foodLst'),
							jBox = jItem.find('.food-box'), jlst = jItem.find('.food-lst');
						var listRect = jBox[0].getBoundingClientRect();
						var nextItem = _.find(_.clone(itemLst).reverse(), function (item) {
							var itemKey = _.result(item, 'itemKey'),
								itemSelector = '.food-item[item-key=' + itemKey + ']',
								jItem = $(itemSelector),
								itemRect = jItem[0].getBoundingClientRect();
							var ret = null;
							if (listRect.top - itemRect.top > listRect.height - parseFloat(jBox.css('paddingBottom'))) {
								// 当前条目不全在可视区域内
								ret = jItem;
							}
							return ret;
						});
						if (!nextItem) {
							nextItem = itemLst[0];
						}
						return nextItem;
					};
					
					el.on('click', '.btn-prev, .btn-next', function (e) {
                        IX.ns("Hualala.Common");
                        var saasOrderKey = attr.foodPager,
							order = ProduceOrderService.getOrderItem(saasOrderKey),
							jItem = $("#" + saasOrderKey);
                        var jBtn = $(this),
                            HC = Hualala.Common;
                        var direct = jBtn.attr('pager-act');
                        var nextItem = null, jNextItem = null;
                        var jBox = jItem.find('.food-box'),
                        	jlst = jItem.find('.food-lst');

                        nextItem = (direct == 'next') ? getNextPageStartItem() : getPrevPageStartItem();
                        if (!nextItem) {
                        	jBtn.attr('disabled', false);
                        	return;
                        }
                        jNextItem = jlst.find('.food-item').filter('[item-key=' + _.result(nextItem, 'itemKey') + ']');
                        jBox.animate(
                        	{scrollTop : jNextItem.offset().top - jBox.find('.food-item:first').offset().top},
                        	400, 'swing',
                        	function () {
                        		jBtn.attr('disabled', false);
                        	}
                        );
                    });
				}
			}
		}
	]);
});