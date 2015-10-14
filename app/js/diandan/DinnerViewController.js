define(['app', 'diandan/OrderHeaderSetController'], function (app) {
	app.controller('SnackViewController', 
	[
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', 'storage', 'CommonCallServer', 'OrderService', 'FoodMenuService', 'OrderChannel', 'OrderNoteService', 'AppAlert', 'AppAuthEMP', 'AppProgressbar', 'AppConfirm', 'EMPPermission',
		function ($scope, $rootScope, $modal, $location, $filter, $timeout, storage, CommonCallServer, OrderService, FoodMenuService, OrderChannel, OrderNoteService, AppAlert, AppAuthEMP, AppProgressbar, AppConfirm, EMPPermission) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			// HC.TopTip.reset($rootScope);
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			// 解析链接参数获取订单Key (saasOrderKey)
			var urlParams = $location.search(),
				saasOrderKey = _.result(urlParams, 'saasOrderKey', null);
			var $searchFoodModal = $('#search_food');
			$scope.curSearchKey = '';
			$scope.curOrderItems = null;
			$scope.curFocusOrderItemKey = null;
			$scope.curOrderRemark = '';
			$scope.OrderItemHandle = [
				{name : "send", active : false, label : "赠"},
				{name : "cancel", active : false, label : "退"},
				{name : "delete", active : false, label : "删"},
				{name : "addOne", active : false, label : "<span class=\"glyphicon glyphicon-plus\"><span>"},
				{name : "subOne", active : false, label : "<span class=\"glyphicon glyphicon-minus\"><span>"},
				{name : "count", active : false, label : "改量"},
				{name : "price", active : false, label : "改价"},
				{name : "method", active : false, label : "作法"},
				{name : "remark", active : false, label : "口味"},
				{name : "waiting", active : false, label : "等叫"},
				{name : "urgent", active : false, label : "加急"},
				{name : "carry", active : false, label : "打包"}
			];
			$scope.OrderHandleBtns = [
				{name : "submitOrder", active : true, label : "落单(F3)"},
				{name : "suspendOrder", active : true, label : "挂单"},
				{name : "pickOrder", active : true, label : "提单"},
				{name : "cashPayOrder", active : true, label : "结账(F6)"},
				{name : "payOrder", active : true, label : "扫码结账(F7)"},
				{name : "openCashBox", active : true, label : "开钱箱(F8)"}
			];
			
			var shopInfo = storage.get("SHOPINFO"),
				operationMode = _.result(shopInfo, 'operationMode'),
				webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
			// $scope.OrderHandleBtns = _.map($scope.OrderHandleBtns, function (btn) {
			// 	var name = btn.name;
			// 	var _active = btn.active;
			// 	if (operationMode == 0) {
			// 		_active = (name == 'suspendOrder' || name == 'pickOrder') ? false : true;
			// 	} else {
			// 		_active = name == 'submitOrder' ? false : true;
			// 	}
			// 	// 正餐模式下没有挂单、提单
			// 	return _.extend(btn, {
			// 		active : _active
			// 	});
			// });
			var mapOrderHandleBtns = function () {
				var ordersCatch = storage.get('OrderCatch');
				$scope.OrderHandleBtns = _.map($scope.OrderHandleBtns, function (btn) {
					var name = btn.name;
					var _active = btn.active,
						_label = btn.label;
					if (operationMode == 0) {
						_active = (name == 'suspendOrder' || name == 'pickOrder') ? false : true;
					} else {
						_active = name == 'submitOrder' ? false : true;
					}
					if (operationMode == 1 && name == 'pickOrder') {
						_label = _.isArray(ordersCatch) && ordersCatch.length > 0 ? ('提单<span class="badge">' + ordersCatch.length + '</span>') : '提单';
					}
					// 正餐模式下没有挂单、提单
					return _.extend(btn, {
						active : _active,
						label : _label
					});
				});
			};
			mapOrderHandleBtns();
			var tmpSearchFoods = null;

			$scope.resetOrderInfo = function () {
				$scope.orderHeader = OrderService.getOrderHeaderData();
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
				$scope.curOrderRemark = OrderService.getOrderRemark();
				$scope.curOrderRemark = _.isEmpty($scope.curOrderRemark) ? '单注' : $scope.curOrderRemark;
				IX.Debug.info("Order List Info:");
				IX.Debug.info($scope.curOrderItems);
			};


			// 获取订单数据
			OrderService.getOrderByOrderKey(urlParams, function (data) {
				$scope.resetOrderInfo();
				// 反结账标记
				var _FJZFlag = _.result(urlParams, 'FJZFlag', '');
				OrderService.updateFJZFlag(_FJZFlag);
				$scope.$emit('Order.FJZStatusToggle', !_FJZFlag ? false : true);
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});
			
			// 加载渠道数据
			OrderChannel.loadOrderChannels({}, function (data) {
				$scope.OrderChannels = OrderChannel.getAll();
				IX.Debug.info("Order Channels: ");
				IX.Debug.info($scope.OrderChannels);
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});
			// 加载菜单数据
			FoodMenuService.initFoodMenuData(function (data) {
				var firstCate = FoodMenuService.getFirstCategory();
				FoodMenuService.setCurFoodCategory(_.result(firstCate, 'foodCategoryKey', null));
				// 为当前作用域绑定菜品分类数据
				$scope.FoodCategories = FoodMenuService.getFoodCategoryData();
				IX.Debug.info("All FoodCategories Data:");
				IX.Debug.info($scope.FoodCategories);
				
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});
			// 加载订单字典数据
			OrderNoteService.getOrderNotesLst({}, function (data) {
				IX.Debug.info("Order Notes: ");
				IX.Debug.info(OrderNoteService.OrderNoteDict);
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});

			// 计算订单列表中的菜品小计金额
			// $scope.calcFoodAmount = function (item) {
			// 	var math = Hualala.Common.Math;
			// 	var foodPayPrice = _.result(item, 'foodPayPrice', 0),
			// 		foodProPrice = _.result(item, 'foodProPrice', 0),
			// 		foodNumber = _.result(item, 'foodNumber', 0),
			// 		foodSendNumber = _.result(item, 'foodSendNumber', 0),
			// 		foodCancelNumber = _.result(item, 'foodCancelNumber', 0);
			// 	var v = math.multi(foodPayPrice, math.sub(foodNumber, foodSendNumber, foodCancelNumber));
			// 	var str = parseFloat(v) == 0 ? '' : math.standardPrice(v);
			// 	return str;
			// };
			// 需求变更，订单菜品金额小计算法公式变更
			// 条目小计 = （foodNumber - foodCancelNumber - foodSendNumber）* ( isSFDetail == 1 ? foodPayPrice : foodProPrice)
			$scope.calcFoodAmount = function (item) {
				var math = Hualala.Common.Math;
				var itemKey = _.result(item, 'itemKey'),
					foodPayPrice = _.result(item, 'foodPayPrice', 0),
					foodProPrice = _.result(item, 'foodProPrice', 0),
					foodNumber = _.result(item, 'foodNumber', 0),
					foodSendNumber = _.result(item, 'foodSendNumber', 0),
					foodCancelNumber = _.result(item, 'foodCancelNumber', 0),
					itemType = OrderService.orderFoodItemType(itemKey);
				var n = math.sub(foodNumber, foodSendNumber, foodCancelNumber),
					p = itemType.isSetFoodDetail ? foodPayPrice : foodProPrice,
					v = math.multi(p, n);
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

			// 切换菜品分类
			$scope.changeFoodCategory = function (cateKey) {
				FoodMenuService.setCurFoodCategory(cateKey);
			};

			// 打开搜索菜品窗口
			$scope.selectSearchInput = function () {
				$searchFoodModal.find(':text:first').trigger('focus').trigger('select');
			};
			$scope.openSearch = function () {
				$searchFoodModal.modal({
					backdrop : false
				});
				$scope.selectSearchInput();
			};
			// 为搜索菜品绑定事件 
			$searchFoodModal.on('click', '.btn', function (e) {
				$searchFoodModal.modal('hide');
				$searchFoodModal.find(":text").val('');
				tmpSearchFoods = null;
				$scope.curSearchKey = '';
				
			});
			// 搜索菜品操作
			$scope.searchFood = function () {
				IX.Debug.info($scope.curSearchKey);
				// var matchedFoods = FoodMenuService.searchFoodsByFoodCode($scope.curSearchKey);
				// if (_.isEqual(tmpSearchFoods, matchedFoods)) {
				// 	return;
				// } else {
				// 	$('.menu-plain .foods').addClass('hidden');
				// 	tmpSearchFoods = matchedFoods;
				// 	$scope.curFoods = matchedFoods;
				// 	IX.Debug.info("Matched Foods:");
				// 	IX.Debug.info(matchedFoods);
				// 	setTimeout(function () {
				// 		$('.menu-plain .foods').removeClass('hidden');
				// 	}, 100);
				// }
				
				var matchedFoods = FoodMenuService.searchFoodsByFoodCode($scope.curSearchKey);
				$('.menu-plain .foods').addClass('hidden');

				$scope.curFoods = matchedFoods.slice(0, 35);
				IX.Debug.info("Matched Foods:");
				IX.Debug.info(matchedFoods);
				$('.menu-plain .foods').removeClass('hidden');


			};

			// 为菜品分类绑定事件
			$scope.$on('foodCategory.change', function () {
				// 为当前作用域绑定当前菜品分类Key，并绑定当前分类下的菜品数据
				$scope.curFoodCategory = FoodMenuService.getCurFoodCategory();
				$scope.curFoods = FoodMenuService.getFoodLstByCategoryKey($scope.curFoodCategory)[$scope.curFoodCategory];

				IX.Debug.info("Current Food Menu Datas:");
				IX.Debug.info($scope.curFoodCategory);
				IX.Debug.info($scope.curFoods);

			});

			// 为订单插入菜品条目
			$scope.insertFoodItem = function (unitKey) {
				var food = FoodMenuService.getFoodByUnitKey(unitKey),
					soldout = _.result(food, '__soldout', null),
					isSetFood = FoodMenuService.isSetFood(unitKey),
					isTempFood = FoodMenuService.isTempFood(unitKey),
					item = null;
				var qty = _.result(soldout, 'qty', '');
				if (!_.isEmpty(soldout)) {
					if (qty != 0) {
						AppAlert.add('warning', '菜品即将沽清!');
					} else {
						AppAlert.add('danger', '菜品已经沽清!');
						return;
					}
				}
				// 向订单中添加菜品条目
				if (isSetFood) {
					// TODO  套餐需要弹出配置套餐的窗口
					$scope.curSetFoodUnitKey = unitKey;
					$scope.openSetFoodCfg();
					// item = OrderService.insertSetFoodItem(food);
				} else if (isTempFood) {
					// 临时菜需要弹出配置临时菜的窗口
					$scope.openTempFoodCfg(unitKey);
				} else {
					item = OrderService.insertCommonFoodItem(food);
					var t = (OrderService.getOrderFoodItemsHT()).getAll();
					$scope.curOrderItems = t;
					$timeout((function (itemKey) {
						return function () {
							$('.order-list .food-item[item-key=' + itemKey + ']').trigger('click');
						};
					})(item.itemKey), 0);
				}
				
				$scope.selectSearchInput();
			};

			/**
			 * 根据选择的订单条目数据判断可以使用哪些
			 * @param  {String} itemKey 订单条目的itemKey
			 * 如果被选中的订单条目是未落单普通菜品，可以操作['send','delete','addOne','subOne', 'count','price','method','remark','carry']
			 * 如果被选中的订单条目是已落单普通菜品，可以操作['send','cancel','price']
			 * 如果被选中的订单条目是未落单普通菜品的作法，可以操作['delete','addOne','subOne','count']
			 * 如果被选中的订单条目是已落单普通菜品的作法，可以操作[]
			 * 如果被选中的订单条目是未落单套餐，可以操作['send','delete','addOne','subOne','count','price','method','remark']
			 * 如果被选中的订单条目是已落单套餐，可以操作['send','cancel','price']
			 * 如果被选中的订单条目是未落单套餐的作法，可以操作['delete','addOne','subOne','count']
			 * 如果被选中的订单条目是已落单套餐的作法，可以操作[]
			 * 如果被选中的订单条目是未落单套餐详情菜品，可以操作：['delete','price','method','remark']
			 * 如果被选中的订单条目是已落单套餐详情菜品，可以操作：['cancel']
			 * 如果被选中的订单条目是未落单套餐详情菜品的作法，可以操作：['delete','addOne','subOne','count']
			 * 如果被选中的订单条目是已落单套餐详情菜品的作法，可以操作：['cancel']
			 * 
			 * @return {[type]}		 [description]
			 */
			$scope.selectOrderItem = function (itemKey) {
				var orderItemType = OrderService.orderFoodItemType(itemKey),
					orderItem = OrderService.getOrderFoodItemByItemKey(itemKey),
					isNeedConfirmFoodNumber = _.result(orderItem, 'isNeedConfirmFoodNumber', "0");
					itemStatus = _.result(orderItem, 'printStatus', 0),
					activeBtns = '';
				$scope.curFocusOrderItemKey = itemKey;
				// 先disable所有操作按钮
				$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
					btn.active = false;
					return btn;
				});
				if (orderItemType.isCommonFood || orderItemType.isSetFood) {
					activeBtns = itemStatus == 0 
						? ['send','delete','addOne','subOne', 'count','price','method','remark', 'waiting', 'urgent','carry']
						: (isNeedConfirmFoodNumber != 0 ? ['send','cancel', 'count', 'price'] : ['send','cancel','price']);
				} else if (orderItemType.isFoodMethod) {
					activeBtns = itemStatus == 0
						? ['delete','addOne','subOne','count']
						: ['send', 'cancel'];
				} else if (orderItemType.isSetFoodDetail) {
					activeBtns = itemStatus == 0
						? ['delete','price','method','remark']
						: ['cancel'];
				}
				if (activeBtns.length == 0) return;
				$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
					var n = _.result(btn, 'name'),
						i = _.indexOf(activeBtns, n);
					btn['active'] = i >= 0 ? true : false;
					return btn;
				});

			};

			// 更新单头信息
			$scope.updateOrderHeader = function (data) {
				$scope.orderHeader = data;
				OrderService.updateOrderHeader($scope.orderHeader);
			};

			// 重新刷新一下订单列表
			$scope.refreshOrderList = function () {
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
			};

			// 删除订单列表中当前选中条目
			$scope.deleteSelectedOrderItem = function () {
				var curItemKey = $scope.curFocusOrderItemKey;
				if (_.isEmpty(curItemKey)) return;
				var orderItem = OrderService.getOrderFoodItemByItemKey(curItemKey),
					orderItemType = OrderService.orderFoodItemType(curItemKey);
				if (_.isEmpty(orderItem)) return;
				OrderService.deleteOrderItem(curItemKey);
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
				// 默认选中订单列表中第一个条目
				var firstItem = $scope.curOrderItems[0];
				$scope.selectOrderItem(_.result(firstItem, 'itemKey'));
			};

			// 订单列表中当前选中条目数量加1
			$scope.addSelectedOrderItem = function () {
				var curItemKey = $scope.curFocusOrderItemKey;
				if (_.isEmpty(curItemKey)) return;
				var item = OrderService.updateOrderItemCount(curItemKey, +1);
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
			};

			// 订单列表中当前选中条目数量减1
			$scope.subSelectedOrderItem = function () {
				var curItemKey = $scope.curFocusOrderItemKey;
				if (_.isEmpty(curItemKey)) return;
				var item = OrderService.updateOrderItemCount(curItemKey, -1);
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
				if (_.isEmpty(item)) {
					// 默认选中订单列表中第一个条目
					var firstItem = $scope.curOrderItems[0];
					$scope.selectOrderItem(_.result(firstItem, 'itemKey'));
				}
			};

			// 设置菜品等叫
			$scope.setFoodWaiting = function () {
				var curItemKey = $scope.curFocusOrderItemKey;
				if (_.isEmpty(curItemKey)) return;
				var item = OrderService.updateOrderItemMakeStatus(curItemKey, 0);
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
			};

			// 设置菜品加急
			$scope.setFoodUrgent = function () {
				var curItemKey = $scope.curFocusOrderItemKey;
				if (_.isEmpty(curItemKey)) return;
				var item = OrderService.updateOrderItemMakeStatus(curItemKey, 2);
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
			};

			// 设置菜品打包
			$scope.setFoodCarry = function () {
				var curItemKey = $scope.curFocusOrderItemKey;
				if (_.isEmpty(curItemKey)) return;
				var labelNum = _.findLastIndex($scope.OrderItemHandle,{name:'carry'}),
					label = _.propertyOf($scope.OrderItemHandle[labelNum])('label');
				var item = OrderService.updateOrderFoodRemark(curItemKey, label);
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
			};

			// 打开订单备注配置窗口
			$scope.openOrderRemark = function () {
				var modalSize = "lg",
					controller = "OrderRemarkController",
					templateUrl = "js/diandan/orderRemark.html",
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				Hualala.ModalCom.openModal($rootScope, $modal, {
					windowClass : webAppPageAnimationIsActive,
					size : modalSize,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve
				}, webAppPageAnimationIsActive);
				// $modal.open({
				// 	size : modalSize,
				// 	controller : controller,
				// 	templateUrl : templateUrl,
				// 	resolve : resolve
				// });
			};

			// 打开套餐配置窗口
			$scope.openSetFoodCfg = function () {
				// Old set food config version
				// var modalSize = "lg",
				// 	windowClass = "setfood-modal",
				// 	backdrop = "static",
				// 	controller = "SetFoodCfgController",
				// 	templateUrl = "js/diandan/setFoodCfg.html",
				// 	resolve = {
				// 		_scope : function () {
				// 			return $scope;
				// 		}
				// 	};
				// $modal.open({
				// 	size : modalSize,
				// 	controller : controller,
				// 	templateUrl : templateUrl,
				// 	resolve : resolve
				// });

				var modalSize = "lg",
					windowClass = "setfood-modal " + webAppPageAnimationIsActive,
					backdrop = "static",
					controller = "SetFoodSettingController",
					templateUrl = "js/diandan/setFoodSetting.html",
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				Hualala.ModalCom.openModal($rootScope, $modal, {
					size : modalSize,
					windowClass : windowClass,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve,
					backdrop : backdrop
				}, webAppPageAnimationIsActive);
				// $modal.open({
				// 	size : modalSize,
				// 	windowClass : windowClass,
				// 	controller : controller,
				// 	templateUrl : templateUrl,
				// 	resolve : resolve,
				// 	backdrop : backdrop
				// });
			};

			// 打开临时菜配置窗口
			$scope.openTempFoodCfg = function (unitKey) {
				var modalSize = "md",
					windowClass = "tempfood-modal " + webAppPageAnimationIsActive,
					backdrop = "static",
					controller = "TempFoodSettingController",
					templateUrl = "js/diandan/tempFoodSetting.html",
					resolve = {
						_scope : function () {
							return _.extend($scope, {
								curTempFoodUnitKey : unitKey
							});
						}
					};

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

			// 落单操作
			$scope.submitOrder = function () {
				var orderData = OrderService.getOrderData(),
					foods = OrderService.getOrderFoodHT().getAll();
				if (_.isEmpty(orderData, 'saasOrderKey') || foods.length == 0) {
					AppAlert.add('danger', '请添加菜品后落单！');
					return null;
				}
				var callServer = OrderService.submitOrder('LD');
				if (_.isEmpty(callServer)) return;
				var addAuthEMP = function () {
					AppAuthEMP.add({
						yesFn : function (empInfo) {
							callServer = OrderService.submitOrder('LD', null, empInfo);
							callServer.success(successCallBack);
						},
						noFn : function () {

						}
					});
				};
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					var ret = _.result(data, 'data', {});
					if (code == '000') {
						OrderService.initOrderFoodDB(ret);
						$scope.resetOrderInfo();
						// 向子窗口推送新加菜品的消息
						Hualala.SecondScreen.publishPostMsg('OrderDetail', OrderService.getOrderPublishData());
						$timeout(function () {
							$('[item-key='+$scope.curFocusOrderItemKey + ']').trigger('click');
						}, 0);
					} else if (code == 'CS005') {
						addAuthEMP();
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				};
				callServer.success(function (data, status, headers, config) {
						successCallBack(data);
						// $scope.orderHeader = OrderService.getOrderHeaderData();
						// $scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
						// $scope.curOrderRemark = OrderService.getOrderRemark();
						// $scope.curOrderRemark = _.isEmpty($scope.curOrderRemark) ? '单注' : $scope.curOrderRemark;
						
					})
					.error(function (data, status, headers, config) {
						
					});
				return callServer;
			};

			// 挂单操作
			$scope.suspendOrder = function () {
				var orderData = OrderService.getOrderData(),
					foods = OrderService.getOrderFoodHT().getAll();
				if (foods.length == 0) {
					AppAlert.add('danger', '请添加菜品后挂单！');
					return null;
				}
				OrderService.suspendOrder(function () {
					AppAlert.add('success', '挂单成功!');
					// 向子窗口推送新加菜品的消息
					Hualala.SecondScreen.publishPostMsg('OrderDetail', OrderService.getOrderPublishData());
					mapOrderHandleBtns();
				}, function () {
					AppAlert.add('danger', '挂单列表已满，请完成当前订单!');
				});
				$scope.resetOrderInfo();
			};

			// 提单操作
			$scope.pickOrder = function (catchID) {
				OrderService.pickOrder(catchID, function () {
					AppAlert.add('success', '当前订单挂单成功!');
					// 向子窗口推送新加菜品的消息
					Hualala.SecondScreen.publishPostMsg('OrderDetail', OrderService.getOrderPublishData());
					mapOrderHandleBtns();
				}, function () {
					AppAlert.add('danger', '挂单列表已满，请完成当前订单!');
					// 向子窗口推送新加菜品的消息
					Hualala.SecondScreen.publishPostMsg('OrderDetail', OrderService.getOrderPublishData());
					mapOrderHandleBtns();
				});
				$scope.resetOrderInfo();
				mapOrderHandleBtns();
			};

			// 跳转选择桌台页面
			$scope.jumpToTablePage = function () {
				var search = $location.search(),
					path = _.result(search, 'path');
				if (_.isEmpty(path)) {
					$location.path('/dinner/table');
				} else {
					$location.path(path).search(search);
				}
				
			};

			// 开钱箱操作
			$scope.openCashBox = function () {
				var hasPermission = EMPPermission.chkPermission('2010049');
				if (hasPermission) {
					Hualala.DevCom.exeCmd("OpenCashbox");
				} else {
					AppAlert.add('danger', '没有权限开启钱箱!');
				}
				
			};

			// 打印结账消费明细
			$scope.printOrderDetailBill = function () {
				// TODO  
				// 1. 判断订单菜品是否全部落单
				// 2. 如果有菜品没有落单弹出提示消息，不进行账单打印
				// 3. 否则直接打印账单信息
				var orderData = OrderService.getOrderData();
				var foods = OrderService.getOrderFoodHT().getAll();
				var unorderedItems = OrderService.getUnorderedItems();
				if (_.isEmpty(orderData.saasOrderKey) || foods.length == 0) {
					AppAlert.add('danger', '订单未落单，无法打印！');
				} else if (unorderedItems.length > 0) {
					// HC.TopTip.addTopTips($rootScope, {
					// 	code : '111',
					// 	msg : '还有未落单菜品,无法打印,请先将所有菜品落单!'
					// });
					AppAlert.add('danger', '还有未落单菜品,无法打印,请先将所有菜品落单!');
				} else {
					Hualala.DevCom.exeCmd("PrintOrderDetailBill", JSON.stringify(orderData));
				}
			};

			$scope.getFoodTag = function (food) {
				var _ZXJ = _.result(food, 'ZXJ');
				return _ZXJ == 'Z' ? 'zfood' : (_ZXJ == 'J' ? 'jfood' : 'xfood');
			};

			// 监听是否需要弹出反结账提示
			$scope.$on('Order.CheckoutOrder', function ($event) {
				AppConfirm.add({
					title : "反结账操作",
					msg : '你正在进行反结账操作，是否完成结账？',
					yesFn : function () {
						// 打开结账窗口
						$('.btn[name=cashPayOrder]').trigger('click');
					},
					noFn : function () {

						return;
					}
				});
			});

			// 监听是否需要弹出单头配置信息界面
			$scope.$on('Order.OpenHeaderSet', function ($event, act) {
				var orderData = OrderService.getOrderData();
				orderData.hasOrderHeader = true;
				$('#order_header_handle').trigger('click', act);
			});

		}
	]);


	// 赠菜操作控制器
	app.controller('OrderItemSendController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'AppAlert',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, AppAlert) {
			IX.ns("Hualala");
			var sendReasonData = OrderNoteService.getSendFoodReasonNotes();
			var curItemKey = _scope.curFocusOrderItemKey,
				curItem = OrderService.getOrderFoodItemByItemKey(curItemKey),
				curFoodNumber = _.result(curItem, 'foodNumber', 0),
				curFoodSendNumber = _.result(curItem, 'foodSendNumber', 0),
				curSendReason = _.result(curItem, 'sendReason', ''),
				curFoodCancelNumber = _.result(curItem, 'foodCancelNumber', 0);
			$scope.SendFoodReasons = _.result(sendReasonData, 'items', []);
			$scope.enableSendNumber = curFoodNumber - curFoodCancelNumber;
			$scope.foodSendNumber = 1;
			$scope.sendReason = '';
			$scope.curFoodName = _.result(curItem, 'foodName', '');
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// TODO submit Modify result
				if (parseInt($scope.foodSendNumber) > parseInt($scope.enableSendNumber) || _.isEmpty($scope.sendReason)) {
					AppAlert.add('danger', "请检查赠送数量和原因！");
					return ;
				}
				IX.Debug.info("Food Item Send setting:");
				IX.Debug.info("foodSendNumber:" + $scope.foodSendNumber + ";sendReason:" + $scope.sendReason);
				var callServer = OrderService.sendOrderFoodItem(curItemKey, $scope.foodSendNumber, $scope.sendReason);
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						_scope.refreshOrderList();
						$modalInstance.close();
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								callServer = OrderService.sendOrderFoodItem(curItemKey, $scope.foodSendNumber, $scope.sendReason, empInfo);
								callServer.success(successCallBack);
							},
							noFn : function () {

							}
						});
					}
				};
				if (!_.isEmpty(callServer)) {
					callServer.success(successCallBack);
				} else {
					_scope.refreshOrderList();
					$modalInstance.close();
				}
				
			};
			// 赠菜原因变化
			$scope.onSendReasonChange = function (v) {
				$scope.sendReason = v;
			};
			// 输入框聚焦事件
			// 告诉软键盘当前操作控件
			$scope.inputFocus = function ($event) {
				console.info($event);
				console.info(arguments);
				var curEl = $($event.target);
				if (!curEl.attr('readonly') && !curEl.attr('disabled')) {
					$scope.focusInputEl = curEl;
				} else {
					$scope.focusInputEl = null;
				}
				return;

			};
		}
	]);

	// 退菜操作控制器
	app.controller('OrderItemCancelController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'AppAlert', 'AppAuthEMP',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var cancelReasonData = OrderNoteService.getCancelFoodReasonNotes();
			var curItemKey = _scope.curFocusOrderItemKey,
				curItem = OrderService.getOrderFoodItemByItemKey(curItemKey),
				curFoodNumber = _.result(curItem, 'foodNumber', 0),
				curFoodCancelNumber = _.result(curItem, 'foodCancelNumber', 0);
			$scope.CancelFoodReasons = _.result(cancelReasonData, 'items', []);
			$scope.enableCancelNumber = curFoodNumber;
			$scope.foodCancelNumber = 1;
			$scope.cancelReason = '';
			$scope.curFoodName = _.result(curItem, 'foodName', '');
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// TODO submit Modify result
				if (parseInt($scope.foodCancelNumber) > parseInt($scope.enableCancelNumber) || _.isEmpty($scope.cancelReason)) {
					AppAlert.add('danger', "请检查退菜数量和原因！");
					return ;
				}
				IX.Debug.info("Food Item Cancel Setting:");
				IX.Debug.info("foodCancelNumber:" + $scope.foodCancelNumber + ";cancelReason:" + $scope.cancelReason);
				var callServer = OrderService.cancelOrderFoodItem(curItemKey, $scope.foodCancelNumber, $scope.cancelReason);
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						_scope.refreshOrderList();
						$modalInstance.close();
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								callServer = OrderService.cancelOrderFoodItem(curItemKey, $scope.foodCancelNumber, $scope.cancelReason, empInfo);
								callServer.success(successCallBack);
							},
							noFn : function () {

							}
						});
					} else {

					}
				};
				callServer.success(function (data) {
					successCallBack(data);
				});

				
			};
			// 退菜原因变化
			$scope.onCancelReasonChange = function (v) {
				$scope.cancelReason = v;
			};
			// 输入框聚焦事件
			// 告诉软键盘当前操作控件
			$scope.inputFocus = function ($event) {
				console.info($event);
				console.info(arguments);
				var curEl = $($event.target);
				if (!curEl.attr('readonly') && !curEl.attr('disabled')) {
					$scope.focusInputEl = curEl;
				} else {
					$scope.focusInputEl = null;
				}
				return;

			};
		}
	]);

	// 改量操作控制器
	app.controller('OrderItemModifyCountController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'AppAlert', 'AppAuthEMP',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var curItemKey = _scope.curFocusOrderItemKey,
				curItem = OrderService.getOrderFoodItemByItemKey(curItemKey);
			$scope.foodCount = 1;
			$scope.curFoodName = _.result(curItem, 'foodName', '');
			$scope.curFoodCount = _.result(curItem, 'foodNumber', 0);
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// TODO submit Modify result
				if (isNaN($scope.foodCount) || parseFloat($scope.foodCount) < 0 || $scope.foodCount.toString().length == 0) {
					AppAlert.add('danger', "请检查菜品数量！");
					return ;
				}

				IX.Debug.info("Food Modify Count Setting:");
				IX.Debug.info("foodCount:" + $scope.foodCount);
				var obj = OrderService.updateOrderItemCount(curItemKey, 0, $scope.foodCount),
					item = null, callServer = null;
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						_scope.refreshOrderList();
						if (_.isEmpty(item)) {
							// 默认选中订单列表中第一个条目
							var firstItem = _scope.curOrderItems[0];
							_scope.selectOrderItem(_.result(firstItem, 'itemKey'));
						}
						$modalInstance.close();
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								obj = OrderService.updateOrderItemCount(curItemKey, 0, $scope.foodCount, empInfo);
								callServer = obj.callServer;
								item = obj.item;
								callServer.success(successCallBack);
							},
							noFn : function () {

							}
						});
					}
					
				};

				if (_.isEmpty(obj) || _.isEmpty(_.result(obj, 'callServer'))) {
					item = obj;
					_scope.refreshOrderList();
					if (_.isEmpty(item)) {
						// 默认选中订单列表中第一个条目
						var firstItem = _scope.curOrderItems[0];
						_scope.selectOrderItem(_.result(firstItem, 'itemKey'));
					}
					$modalInstance.close();
				} else {
					callServer = obj.callServer;
					item = obj.item;
					callServer.success(function (data) {
						successCallBack(data);
					});
				}
				
				
				
			};
			// 输入框聚焦事件
			// 告诉软键盘当前操作控件
			$scope.inputFocus = function ($event) {
				console.info($event);
				console.info(arguments);
				var curEl = $($event.target);
				if (!curEl.attr('readonly') && !curEl.attr('disabled')) {
					$scope.focusInputEl = curEl;
				} else {
					$scope.focusInputEl = null;
				}
				return;

			};
		}
	]);

	// 改价操作控制器
	app.controller('OrderItemModifyPriceController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'AppAlert', 'AppAuthEMP',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var modifyPriceData = OrderNoteService.getModifyPriceNotes();
			var curItemKey = _scope.curFocusOrderItemKey,
				curItem = OrderService.getOrderFoodItemByItemKey(curItemKey);
			$scope.ModifyPriceNotes = _.result(modifyPriceData, 'items', []);
			$scope.foodPrice = _.result(curItem, 'foodPayPrice', 0);
			$scope.priceNote = '';
			$scope.curFoodName = _.result(curItem, 'foodName', '');
			$scope.curFoodPrice = _.result(curItem, 'foodPayPrice', 0);
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				var callServer;
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						_scope.refreshOrderList();
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								callServer = OrderService.updateOrderFoodPrice(curItemKey, $scope.foodPrice, $scope.priceNote, empInfo);
								callServer.success(successCallBack);
							},
							noFn : function () {

							}
						});
					}
					
				}
				// TODO submit Modify result
				if ((_.isEmpty($scope.priceNote) && parseFloat($scope.foodPrice) >= 0) || _.isUndefined($scope.foodPrice)) {
					AppAlert.add('danger', "请检查改价数量和原因！");
					return ;
				}

				IX.Debug.info("Food Modify Price Setting:");
				IX.Debug.info("foodPrice:" + $scope.foodPrice + "; priceNote:" + $scope.priceNote);
				callServer = OrderService.updateOrderFoodPrice(curItemKey, $scope.foodPrice, $scope.priceNote);
				if (!callServer) {
					_scope.refreshOrderList();
				} else {
					callServer.success(function (data, status, headers, config) {
						successCallBack(data);
					});
				}
				$modalInstance.close();
			};
			// 改价原因变化
			$scope.onFoodPriceNoteChange = function (v) {
				$scope.priceNote = v;
			};
			// 输入框聚焦事件
			// 告诉软键盘当前操作控件
			$scope.inputFocus = function ($event) {
				console.info($event);
				console.info(arguments);
				var curEl = $($event.target);
				if (!curEl.attr('readonly') && !curEl.attr('disabled')) {
					$scope.focusInputEl = curEl;
				} else {
					$scope.focusInputEl = null;
				}
				return;

			};
		}
	]);

	// 作法操作控制器
	app.controller('OrderItemModifyMethodController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'AppAlert',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, AppAlert) {
			IX.ns("Hualala");
			var methodData = OrderNoteService.getFoodMethodNotes();
			var curItemKey = _scope.curFocusOrderItemKey,
				curItem = OrderService.getOrderFoodItemByItemKey(curItemKey),
				makingMethodList = _.result(curItem, 'makingMethodList', '');
			// 需求变更，菜品数据中包含菜品本身自带作法，需要与系统的菜品作法字典进行merge，去除重复作法，
			// 将作法选项最终呈现在作法选择组件中。
			methodData = OrderNoteService.mergeOrderNotes(methodData, makingMethodList);
			$scope.FoodMethods = _.result(methodData, 'items', []);
			$scope.foodMethod = '';
			$scope.curFoodName = _.result(curItem, 'foodName', '');
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// TODO submit Modify result
				if (_.isEmpty($scope.foodMethod)) {
					return ;
				}
				var foodMethodSetting = _.find($scope.FoodMethods, function (el) {
					return el.notesName == $scope.foodMethod;
				});
				IX.Debug.info("Food Method Setting:");
				IX.Debug.info(foodMethodSetting);
				OrderService.updateOrderFoodMethod(curItemKey, foodMethodSetting);
				_scope.refreshOrderList();
				$modalInstance.close();
			};
			// 退菜原因变化
			$scope.onFoodRemarkChange = function (v) {
				$scope.foodMethod = v;
			};
		}
	]);

	// 口味操作控制器
	app.controller('OrderItemModifyRemarkController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'AppAlert',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, AppAlert) {
			IX.ns("Hualala");
			var remarkData = OrderNoteService.getFoodRemarkNotes();
			var curItemKey = _scope.curFocusOrderItemKey,
				curItem = OrderService.getOrderFoodItemByItemKey(curItemKey),
				tasteList = _.result(curItem, 'tasteList', '');

			// 需求变更，菜品数据中包含菜品本身自带口味，需要与系统的菜品口味字典进行merge，去除重复口味
			// 将口味选项最终呈现在作法选择组件中。
			remarkData = OrderNoteService.mergeOrderNotes(remarkData, tasteList);
			$scope.FoodRemarks = _.result(remarkData, 'items', []);
			$scope.foodRemark = '';
			$scope.curFoodName = _.result(curItem, 'foodName', '');
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// TODO submit Modify result
				if (_.isEmpty($scope.foodRemark)) {
					return ;
				}
				IX.Debug.info("Food Remark Setting:");
				IX.Debug.info("foodRemark:" + $scope.foodRemark);
				OrderService.updateOrderFoodRemark(curItemKey, $scope.foodRemark);
				_scope.refreshOrderList();
				$modalInstance.close();
			};
			// 退菜原因变化
			$scope.onFoodRemarkChange = function (v) {
				$scope.foodRemark = v;
			};
		}
	]);	

	// 单注操作控制器
	app.controller('OrderRemarkController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'AppAlert',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, AppAlert) {
			IX.ns("Hualala");
			var remarkData = OrderNoteService.getOrderRemarkNotes();
			$scope.OrderRemarks = _.result(remarkData, 'items', []);
			$scope.orderRemark = '';
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// TODO submit Modify result
				if (_.isEmpty($scope.orderRemark)) {
					return ;
				}
				IX.Debug.info("Order Remark Setting:");
				IX.Debug.info("orderRemark:" + $scope.orderRemark);
				OrderService.updateOrderRemark($scope.orderRemark);
				_scope.curOrderRemark = OrderService.getOrderRemark();
				$modalInstance.close();
			};
			// 退菜原因变化
			$scope.onOrderRemarkChange = function (v) {
				$scope.orderRemark = v;
			};
		}
	]);	

	// 套餐搭配操作控制器
	app.controller('SetFoodCfgController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'OrderNoteService', 'OrderService', 'FoodMenuService', 'AppAlert',
		function ($scope, $modalInstance, $filter, _scope, OrderNoteService, OrderService, FoodMenuService, AppAlert) {
			IX.ns("Hualala");
			var curUnitKey = _scope.curSetFoodUnitKey;
			var setFoodData = FoodMenuService.getFoodByUnitKey(curUnitKey),
				setFoodDetailJson = _.result(setFoodData, 'setFoodDetailJson');
			var curSetFoodData = _.mapObject(setFoodData, function (v, k) {
				if (k == 'setFoodDetailJson') {
					var s = JSON.stringify(v);
					return JSON.parse(s);
				}
				return v;
			});
			// 整理套餐配置的数据结构，方便模板渲染
			var mapSetFoodSettings = function (foodLst) {
				return _.map(foodLst, function (cate) {
					var items = _.result(cate, 'items', []);
					var selectedFoods = [];
					items = _.map(items, function (food) {
						var foodName = _.result(food, 'foodName', ''),
							unit = _.result(food, 'unit', ''),
							addPrice = _.result(food, 'addPrice', 0),
							selected = _.result(food, 'selected', 0),
							unitKey = _.result(food, 'unitKey');
						selected == 1 && selectedFoods.push(unitKey);
						var txt = '<p>' + foodName + '/' + unit + '</p>';
						if (parseFloat(addPrice) > 0) {
							txt += '<p>加价￥' + addPrice + '</p>';
						}
						return _.extend(food, {
							label :  txt,
							value : unitKey
						});
					});
					return _.extend(cate, {
						items : items,
						selectedFoods : selectedFoods
					});
				});
			};
			$scope.curSetFoodLst = mapSetFoodSettings(_.result(setFoodDetailJson, 'foodLst', []));
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// TODO submit Modify result
				if (_.isEmpty(curSetFoodData) || !$scope.isValid()) {
					// alert("菜品搭配有误");
					// HC.TopTip.addTopTips($rootScope, {
					// 	msg : '菜品搭配有误'
					// })
					AppAlert.add('danger', '菜品搭配有误');
					return ;
				}
				IX.Debug.info("Current SetFood Settings is:");
				IX.Debug.info(curSetFoodData);
				IX.Debug.info(setFoodData);
				// 向订单插入套餐配置信息
				OrderService.insertSetFoodItem(curSetFoodData);
				_scope.refreshOrderList();
				$modalInstance.close();
			};

			// 套餐配置变化
			$scope.onSetFoodChange = function (v, checkboxName) {
				// console.info(arguments);
				var i = parseInt(checkboxName.slice('cate_'.length));
				var cate = curSetFoodData.setFoodDetailJson.foodLst[i];
				var items = _.result(cate, 'items', []);
				var chooseCount = parseInt(_.result(cate, 'chooseCount'));
				var foodCategoryName = _.result(cate, 'foodCategoryName');
				if (v.length > chooseCount || v.length < chooseCount) {
					alert(foodCategoryName + "类菜品是" + items.length + "选" + chooseCount);
				}
				items = _.map(items, function (food) {
					var selected = 0;
					if (_.indexOf(v, _.result(food, 'unitKey')) > -1) {
						selected = 1;
					}
					return _.extend(food, {
						selected : selected
					});
				});
				
				var curSetFoodDetail = curSetFoodData.setFoodDetailJson;
				curSetFoodDetail.foodLst[i] = _.extend(cate, {
					items : items
				});
				IX.Debug.info("Current SetFood Settings is:");
				IX.Debug.info(curSetFoodData);
			};

			// 检测是否可以提交
			$scope.isValid = function () {
				var cates = curSetFoodData.setFoodDetailJson.foodLst;
				var valid = true;
				_.each(cates, function (cate) {
					var items = _.result(cate, 'items', []);
					var chooseCount = parseInt(_.result(cate, 'chooseCount'));
					var choosenFoods = _.filter(items, function (food) {
						return _.result(food, 'selected') == 1;
					});
					if (chooseCount != choosenFoods.length) {
						valid = false;
					}
				});
				return valid;
			};

		}
	]);

	// 新版套餐搭配操作控制器
	app.controller('SetFoodSettingController', [
		'$scope', '$modalInstance', '$filter', '$timeout', '_scope', "$sce", 'OrderNoteService', 'OrderService', 'FoodMenuService', 'SetFoodService', 'AppAlert',
		function ($scope, $modalInstance, $filter, $timeout, _scope, $sce, OrderNoteService, OrderService, FoodMenuService, SetFoodService, AppAlert) {
			IX.ns("Hualala");
			var curUnitKey = _scope.curSetFoodUnitKey;
			var setFoodData = IX.clone(FoodMenuService.getFoodByUnitKey(curUnitKey));
			SetFoodService.initSetFoodData(setFoodData);
			$scope.curMenuType = 'food';
			$scope.curFoodCategory = '';
			$scope.curFoodUnitKey = '';
			$scope.curFoodBtnID = '';
			$scope.curSetFoodLst = SetFoodService.getSetFoodLstData();
			// 获取指定类别选中菜品
			// $scope.getChosenFoods = function (cateName) {
			// 	var foods = SetFoodService.getSelectedFoodsByCateName(cateName);
			// 	return foods;
			// };
			// 格式化选中菜品数据
			$scope.mapSelectedFoods = function (selectedFoods) {
				_.each(selectedFoods, function (food, idx) {
					_.extend(food, {
						_id : _.result(food, 'unitKey') + '_' + idx
					})
				});
				return selectedFoods;
			};
			// 获取指定类别菜品选项
			$scope.getFoodOpts = function (cateName) {
				if (_.isEmpty(cateName)) return null;
				var foods = SetFoodService.getFoodsByCateName(cateName);
				return foods;
			};
			// 获取口味字典
			$scope.getFoodRemarks = function () {
				var data = OrderNoteService.getFoodRemarkNotes();
				return _.result(data, 'items', []);
			};
			// html解析
			$scope.parseSnippet = function (v) {
				return $sce.trustAsHtml(v);
			};
			// 捕获当前操作菜品条目
			$scope.captureCurFoodItem = function (cateName, unitKey, idx) {
				$scope.curFoodCategory = cateName;
				$scope.curFoodUnitKey = unitKey;
				$scope.curFoodBtnID = unitKey + '_' + idx;

			};
			// 选择套餐配菜
			$scope.replaceFoodItem = function (unitKey) {
				var cateName = $scope.curFoodCategory;
				var s = $scope.curFoodBtnID.split('_'),
					idx = s[s.length - 1];
				// var idx = $scope.curFoodBtnID.split('_')[1];
				SetFoodService.updateFoodByCateName(cateName, $scope.curFoodUnitKey, idx, unitKey);
				$scope.curFoodUnitKey = unitKey;
				$scope.curFoodBtnID = $scope.curFoodUnitKey + '_' + idx;
				$scope.curSetFoodLst = SetFoodService.getSetFoodLstData();
			};
			// 设置选中菜品的口味
			$scope.setFoodRemark = function (remark) {
				var cateName = $scope.curFoodCategory;
				var s = $scope.curFoodBtnID.split('_'),
					idx = s[s.length - 1];
				// var idx = $scope.curFoodBtnID.split('_')[1];
				var unitKey = $scope.curFoodUnitKey;
				console.info(remark);
				SetFoodService.updateFoodRemark(cateName, unitKey, idx, remark);
			};

			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				// 向订单插入套餐配置信息
				var item = OrderService.insertSetFoodItem(SetFoodService.getSetFoodSetting());
				_scope.refreshOrderList();
				$modalInstance.close();
				$timeout((function (itemKey) {
					return function () {
						$('.order-list .food-item[item-key=' + itemKey + ']').trigger('click');
					};
				})(item.itemKey), 0);
			};

		}
	]);

	// 临时菜配置窗口
	app.controller('TempFoodSettingController', [
		'$scope', '$modalInstance', '$filter', '$timeout', '_scope', "$sce", 'OrderNoteService', 'OrderService', 'FoodMenuService', 'AppAlert',
		function ($scope, $modalInstance, $filter, $timeout, _scope, $sce, OrderNoteService, OrderService, FoodMenuService, AppAlert) {
			IX.ns("Hualala");
			var curTempFoodUnitKey = _scope.curTempFoodUnitKey;
			var tempFoodData = IX.clone(FoodMenuService.getFoodByUnitKey(curTempFoodUnitKey));
			$scope.foodName = _.result(tempFoodData, 'foodName', '');
			$scope.foodPrice = $XP(tempFoodData, '__foodUnit.price', '0');
			$scope.unit = $XP(tempFoodData, '__foodUnit.unit', '');
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 提交并关闭窗口
			$scope.save = function () {
				var item ;
				tempFoodData.__foodUnit.unit = $scope.unit;
				tempFoodData.__foodUnit.price = $scope.foodPrice;
				tempFoodData.__foodUnit.originalPrice = $scope.foodPrice;
				tempFoodData.__foodUnit.vipPrice = $scope.foodPrice;
				tempFoodData.foodName = $scope.foodName;
				item = OrderService.insertCommonFoodItem(tempFoodData);
				_scope.refreshOrderList();
				$modalInstance.close();
				$timeout((function (itemKey) {
					return function () {
						$('.order-list .food-item[item-key=' + itemKey + ']').trigger('click');
					};
				})(item.itemKey), 0);
			};
			// 输入框聚焦事件
			// 告诉软键盘当前操作控件
			$scope.inputFocus = function ($event) {
				console.info($event);
				console.info(arguments);
				var curEl = $($event.target);
				if (!curEl.attr('readonly') && !curEl.attr('disabled')) {
					$scope.focusInputEl = curEl;
				} else {
					$scope.focusInputEl = null;
				}
				return;

			};
		}
	]);

	// 提单操作控制器
	app.controller('PickOrderController', [
		'$scope', '$modalInstance', '$filter', '_scope', 'storage', 'OrderNoteService', 'OrderService', 'FoodMenuService', 'AppAlert',
		function ($scope, $modalInstance, $filter, _scope, storage, OrderNoteService, OrderService, FoodMenuService, AppAlert) {
			IX.ns("Hualala");
			$scope.OrdersCatch = storage.get('OrderCatch');
			$scope.disabled = false;
			// 关闭窗口
			$scope.close = function () {
				$modalInstance.close();
			};
			// 选择要提取的订单
			$scope.onOrderCatchClick = function ($event, catchID) {
				var $tar = $($event.target);
				if ($scope.disabled) return;
				$scope.disabled = true;
				// console.info('pick up order ' + catchID);
				_scope.pickOrder(catchID);
				$modalInstance.close();
				$event.preventDefault();
				return ;
			};
		}
	]);


	// 订单支付操作控制器
	app.controller('PayOrderController', [
		'$scope', '$rootScope', '$modalInstance', '$filter', '$location', '$timeout', '_scope', 'storage', 'OrderService', 'OrderPayService', 'PaySubjectService', 'OrderDiscountRuleService', 'VIPCardService', 'AppAlert', 'AppAuthEMP', 'AppProgressbar', 'EMPPermission',
		function ($scope, $rootScope, $modalInstance, $filter, $location, $timeout, _scope, storage, OrderService, OrderPayService, PaySubjectService, OrderDiscountRuleService, VIPCardService, AppAlert, AppAuthEMP, AppProgressbar, EMPPermission) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			// HC.TopTip.reset($rootScope);
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			$scope.orderPayDetail = OrderPayService.mapOrderPayDetail();
			IX.Debug.info("OrderPayDetail:")
			IX.Debug.info($scope.orderPayDetail);
			$scope.curVIPCard = null;
			$scope.payFormCfg = {
				"cashPay" : [
					{label : "实收", name : "realPrice", value : "", disabled : false},
					{label : "找零", name : "change", value : "", disabled : true}
				],
				"remissionPay" : [
					{label : "减免金额", name : "realPrice", value : "", disabled : false}
				],
				"voucherPay" : [
					{label : "抵扣金额", name : "realPrice", value : "", disabled : false}
				],
				"hualalaPay" : [
					{label : "金额", name : "realPrice", value : "", disabled : false}
				],
				"hangingPay" : [
					{label : "金额", name : "realPrice", value : "", disabled : false}
				],
				"bankCardPay" : [
					{label : "金额", name : "realPrice", value : "", disabled : false}
				],
				"groupBuyPay" : [
					{label : "金额", name : "realPrice", value : "", disabled : false}
				]
			};
			
			// 当前选中支付科目组名称
			$scope.curPaySubjectGrpName = _scope.act == "cashPayOrder" ?  "cashPay" : "hualalaPay";
			// 缓存会员卡数据
			$scope.$on('pay.upVIPCard', function (d, card) {
				$scope.curVIPCard = card;
				if (_.isEmpty(card)) {
					VIPCardService.clear();
				}
			});
			
			$scope.isHiddenPrice = function (v) {
				console.info(v);
				return parseFloat(v) == 0;
			};
			// 判断是否空字符串
			$scope.isNotEmptyStr = function (v) {
				return !_.isEmpty(v);
			};
			// 判断是否不可选择的支付科目
			$scope.isDisabledPaySubjectGrp = function (paySubjectGrp) {
				var name = _.result(paySubjectGrp, 'name'),
					disabledKeys = "sendFoodPromotionPay,vipPricePromotionPay,wipeZeroPay".split(",");
				return _.find(disabledKeys, function (k) {return k == name;});
			};
			// 判断是当前选中支付科目组名称
			$scope.isCurPaySubjectGrpName = function (name) {
				return name == $scope.curPaySubjectGrpName;
			};
			// 判断是可以隐藏的支付科目组
			$scope.isHiddenPaySubjectGrp = function (paySubjectGrp) {
				var name = _.result(paySubjectGrp, 'name'),
					amount = _.result(paySubjectGrp, 'amount');
				return name == "sendFoodPromotionPay" && amount == 0;
			};
			// 判断支付科目组有支付金额
			$scope.isNotZeroAmount = function (paySubjectGrp) {
				var amount = _.result(paySubjectGrp, 'amount'),
					name = _.result(paySubjectGrp, 'name');
				return amount != 0 && name != "sendFoodPromotionPay";
			};
			// 判断是否可以完成结账
			$scope.isCanbeSubmit = function (orderPayDetail) {
				var unPayAmount = parseFloat(_.result(orderPayDetail, 'unPayAmount', 0));
				return unPayAmount == 0;
			};
			// 切换支付科目组
			$scope.changeCurrentPaySubjectGrp = function (paySubjectGrp) {
				var name = _.result(paySubjectGrp, 'name');
				//删除副屏二维码
				Hualala.SecondScreen.publishPostMsg('PayQRCode', '');
				if ($scope.isDisabledPaySubjectGrp(paySubjectGrp)) return;
				$scope.curPaySubjectGrpName = name;
				$scope.formIsValid = true;
			};
			// 获取当前支付科目组的类型
			$scope.getPayFormType = function (paySubjectGrp) {
				var name = _.result(paySubjectGrp, 'name');
				return (name == 'vipCardPay' ? 'vip' : 'common');
			};
			// 关闭窗口
			$scope.close = function () {
				//删除副屏二维码
				Hualala.SecondScreen.publishPostMsg('PayQRCode', '');
				$modalInstance.close();
			};
			// 支付科目组提交
			$scope.submitPayForm = function (paySubjectGrp) {
				var name = _.result(paySubjectGrp, 'name');
				$scope.$broadcast('pay.submit', paySubjectGrp);
			};
			// 现金快捷支付结算
			$scope.quickSubmitCashPay = function ($event, paySubjectGrp) {
				var _orderPayDetail;
				var progressbar = AppProgressbar.add('warning', '提交数据...');
				$scope.submitPayForm(paySubjectGrp);
				_orderPayDetail = $scope.orderPayDetail;
				if ($scope.isCanbeSubmit(_orderPayDetail)) {
					$scope.submitOrderPay($event, progressbar);
				} else {
					AppAlert.add('danger', "请核对金额");
					AppProgressbar.close(progressbar);
				}
			};
			// 取消支付科目组支付金额
			$scope.resetPaySubject = function (paySubjectGrp) {
				var name = _.result(paySubjectGrp, 'name'),
					items = _.result(paySubjectGrp, 'items', []);
				var subjectCodes = _.pluck(items, 'subjectCode');
				if (name == "vipCardPay") {
					// 如果扣款服务成功后进行会员卡撤销,需要发送会员卡交易撤销服务
					if (OrderPayService.vipCardDeductMoneySuccess()) {
						var callServer = OrderPayService.vipCardTransRevoke();
						callServer.success(function (data) {
							if (data.code == '000') {
								OrderPayService.deletePaySubjectItem(subjectCodes, name);
								// 如果是会员卡支付撤销，需要同时撤销账单打折科目
								OrderPayService.setCurDiscountRule({
									discountRate : 1,
									discountRange : 0,
									isVipPrice : 0
								});
								// $scope.curVIPCard = null;
								$scope.$broadcast('pay.upVIPCard', null);
							} else {
								// HC.TopTip.addTopTips($rootScope, data);
								AppAlert.add('danger', _.result(data, 'msg', ''));
							}
							$scope.$broadcast('pay.detailUpdate');
						}).error(function (data) {
							// HC.TopTip.addTopTips($rootScope, {
							// 	code : '111', msg : '通信失败'
							// });
							AppAlert.add('danger', '请求服务失败');
						});
					} else {
						OrderPayService.deletePaySubjectItem(subjectCodes, name);
						// 如果是会员卡支付撤销，需要同时撤销账单打折科目
						OrderPayService.setCurDiscountRule({
							discountRate : 1,
							discountRange : 0,
							isVipPrice : 0
						});
						// $scope.curVIPCard = null;
						$scope.$broadcast('pay.upVIPCard', null);
						$scope.$broadcast('pay.detailUpdate');
					}
				} else {
					OrderPayService.deletePaySubjectItem(subjectCodes, name);
					$scope.$broadcast('pay.detailUpdate');
				}
				// $scope.$broadcast('pay.detailUpdate');
			};		
			// 跳转选择桌台页面
			$scope.jumpToTablePage = function () {
				// $location.path('/dinner/table');
				var search = $location.search(),
					path = _.result(search, 'path');
				if (_.isEmpty(path)) {
					if ($location.path() == '/dinner/table') {
						document.location.reload();
					} else {
						$location.path('/dinner/table');
					}
				} else {
					$location.path(path).search(search);
				}
			};
			// 订单支付提交
			$scope.submitOrderPay = function ($event, progressbar) {
				progressbar = progressbar || AppProgressbar.add('warning', '提交数据...');
				var $tar = $($event.target);
				var isOK = $scope.isCanbeSubmit($scope.orderPayDetail);
				var shopInfo = storage.get("SHOPINFO"),
					operationMode = _.result(shopInfo, 'operationMode');
				var hisFlag = _.result($location.search(), 'hisFlag', 0);
				// var actionType = _.result($location.search(), 'FJZFlag', 'JZ');
				var actionType = 'JZ';
				if (!isOK) return;
				// 1. 获取会员卡支付科目数据
				// 2. 如果存在会员卡的cardNo，并且cardTransID为空
				// 3. 进行会员卡扣款提交，将所有会员卡支付科目的数据加入到会员卡扣款服务中，作为一条交易记录
				// 4. 如果会员卡扣款服务失败，提示错误并返回
				// 5. 如果会员卡扣款服务成功，先将会员卡支付科目中的payTransNo更新，再进行提交订单的结账服务
				// 6. 如果提交订单结账服务失败， 会员卡支付部分不可编辑，如果点击撤销按钮，发送会员卡交易撤销请求
				// 7. 如果交易撤销失败， 返回错误，界面不变
				// 8. 如果交易撤销成功，清空会员卡支付科目中的交易号（payTransNo）
				// 
				var cardNo = OrderPayService.cardNo, cardTransID = OrderPayService.cardTransID;
				var vipCardDeductMoneyCallServer = null, submitOrderCallServer = null;
				$tar.button('loading');
				var submitOrderSuccess = function (data) {
					var code = _.result(data, 'code');
					if (code == "000") {
						$scope.$broadcast('pay.upVIPCard', null);
						OrderService.initOrderFoodDB({});
						_scope.resetOrderInfo();
						// 3. 打印结账清单
						Hualala.DevCom.exeCmd('PrintCheckoutBill', JSON.stringify(_.result(data, 'data')));
						// 向子窗口推送消息
						Hualala.SecondScreen.publishPostMsg('OrderDetail', OrderService.getOrderPublishData());
						if (operationMode == 0) {
							$scope.jumpToTablePage();
						}
						$scope.close();
						// 向上广播事件，更新反结账状态
						$scope.$emit('Order.FJZStatusToggle', false);
						$timeout(function () {
							AppProgressbar.close(progressbar);
							$tar.button('reset');
						}, 200);
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								progressbar = AppProgressbar.add('warning', '提交数据...');
								callServer = OrderService.submitOrder(actionType, 
									_.extend(OrderService.getOrderHeaderData(), OrderPayService.getOrderPayParams()), empInfo);
								callServer.success(submitOrderSuccess);
							},
							noFn : function () {

							}
						});
						AppProgressbar.close(progressbar);
					} else {
						// HC.TopTip.addTopTips($rootScope, data);
						// alert(_.result(data, 'msg', ''));
						AppAlert.add('danger', _.result(data, 'msg', ''));
						AppProgressbar.close(progressbar);
					}
				};

				if (!_.isEmpty(cardNo) && _.isEmpty(cardTransID)) {
					// 会员卡扣款提交
					vipCardDeductMoneyCallServer = OrderPayService.vipCardDeductMoney();
					vipCardDeductMoneyCallServer && vipCardDeductMoneyCallServer.success(function (data) {
						var code = _.result(data, 'code'),
							_data = _.result(data, 'data');
						if (code == '000') {
							// 1. 发送打印会员卡交易凭证
							Hualala.DevCom.exeCmd('PrintCRMTransBill', _.result(_data, 'transReceiptsTxt', ''));
							// 2. 提交订单
							submitOrderCallServer = OrderService.submitOrder(actionType, 
								_.extend(OrderService.getOrderHeaderData(), OrderPayService.getOrderPayParams())
							);
							!_.isEmpty(submitOrderCallServer) && submitOrderCallServer.success(function (data) {
								submitOrderSuccess(data);
								
							});
						} else {
							// HC.TopTip.addTopTips($rootScope, data);
							AppAlert.add('danger', _.result(data, 'msg', ''));
						}
					});
				} else {
					submitOrderCallServer = OrderService.submitOrder(actionType, 
						_.extend(OrderService.getOrderHeaderData(), OrderPayService.getOrderPayParams())
					);
					!_.isEmpty(submitOrderCallServer) && submitOrderCallServer.success(function (data) {
						submitOrderSuccess(data);
						
					});
				}
				Hualala.DevCom.exeCmd("OpenCashbox");
				
			};

			// 绑定扫码支付成功时触发的事件
			$scope.$on('scanPay.done', function () {
				var shopInfo = storage.get("SHOPINFO"),
				operationMode = _.result(shopInfo, 'operationMode');
				$scope.$broadcast('pay.upVIPCard', null);
				OrderService.initOrderFoodDB({});
				_scope.resetOrderInfo();
				// 3. 打印结账清单
				// Hualala.DevCom.exeCmd('PrintCheckoutBill', JSON.stringify(_.result(data, 'data')));
				// 向子窗口推送新加菜品的消息
				Hualala.SecondScreen.publishPostMsg('OrderDetail', OrderService.getOrderPublishData());
				
				if (operationMode == 0) {
					$scope.jumpToTablePage();
				}
				$scope.close();
			});

			// 绑定更新支付详情事件
			$scope.$on('pay.detailUpdate', function () {
				$scope.orderPayDetail = OrderPayService.mapOrderPayDetail();
				if (!_.isEmpty($scope.curVIPCard)) {
					$scope.$broadcast('pay.setVIPCard', $scope.curVIPCard);
				}
			});

			// 绑定支付科目表单校验结果事件
			$scope.$on('pay.chkPayFormValid', function (d, valid) {
				console.info(arguments);
				$scope.formIsValid = valid == true ? true : false;
			});

			// 更新扫码支付相关参数
			$scope.$on('pay.updateQRCodeParams', function (d, params) {
				console.info(arguments);
				$scope.curQRCode = params.curQRCode || '';
				$scope.curQRCodeTitle = params.curQRCodeTitle || '';
				$scope.curQRCodeLabel = params.curQRCodeLabel || '';
			});

			// 开钱箱
			$scope.openCashBox = function ($event) {
				var $btn = $($event.target);
				var hasPermission = EMPPermission.chkPermission('2010049');
				if (hasPermission) {
					$btn.button('loading');
					$timeout(function () {
						Hualala.DevCom.exeCmd("OpenCashbox");
						$btn.button('reset');
					}, 500);
				} else {
					AppAlert.add('danger', '没有权限开启钱箱!');
				}
				// Hualala.DevCom.exeCmd("OpenCashbox");
			};
			// 打印预结账清单
			$scope.printCheckoutPreBill = function ($event) {
				// TODO 
				// 1. 提交订单（actionType=YJZ）
				// 2. 提交成功后发送硬件指令
				var $btn = $($event.target);
				$btn.button('loading');
				var callServer = OrderService.submitOrder('YJZ', _.extend(OrderPayService.getOrderPayParams(), {
					payQRCodeTitle : $scope.curQRCodeTitle,
					payQRCodeTxt : $scope.curQRCode,
					payQRCodeRemark : $scope.curQRCodeLabel
				}));
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						var msg = _.extend(_.result(data, 'data'), {
							payQRCodeTitle : $scope.curQRCodeTitle,
							payQRCodeTxt : $scope.curQRCode,
							payQRCodeRemark : $scope.curQRCodeLabel 
						});
						// var msg = _.pick(_.result(data, 'data'), ['discountRate', 'discountRange', 'isVipPrice', 'moneyWipeZeroType', 'payLst'])
						Hualala.DevCom.exeCmd("PrintCheckoutPreBill", JSON.stringify(msg));
						$btn.button('reset');
					} else {
						// HC.TopTIp.addTopTips($rootScope, data);
						AppAlert.add('danger', _.result(data, 'msg', ''));
						$btn.button('reset');
					}
				});
			};
		}
	]);

	// 通用支付科目表单
	app.directive('commonpayform', [
		"$rootScope", "$filter", "CommonCallServer", "OrderService", "OrderPayService", "AppAlert",
		function ($rootScope, $filter, CommonCallServer, OrderService, OrderPayService, AppAlert) {
			return {
				restrict : 'E',
				templateUrl : 'js/diandan/commonpayform.html',
				scope : {
					paySubjectGrp : '=paySubjectGrp',
					formCfg : '=formCfg'
				},
				replace : true,
				link : function (scope, el, attr) {
					IX.ns("Hualala");
					var HCMath = Hualala.Common.Math;
					var curPayGrpName = scope.paySubjectGrp.name;
					scope.discountRuleLst = OrderPayService.getDiscountRules();
					scope.curDiscountRule = OrderPayService.getCurDiscountRule();
					// 普通单一支付科目组的提交
					var singlePaySubjectSubmit = function (curName) {
						var realPriceEl = el.find('input[name=realPrice]');
						var prePayAmount = parseFloat(OrderPayService.preCalcPayAmountByPaySubjectGrpName(curName));
						var realPay = parseFloat(realPriceEl.val());
						var delta = HCMath.sub(prePayAmount, realPay);
						var payRemark = '';
						if (curName == 'cashPay') {
							payRemark = '应收:' + prePayAmount + ';实收:' + realPay + ';找零:' + (delta <= 0 ? delta : 0);
							realPay = delta < 0 ? prePayAmount : realPay;
						}
						OrderPayService.updatePaySubjectItem(curName, {
							debitAmount : realPay,
							payRemark : payRemark
						});
						// 向子窗口推送消息
						Hualala.SecondScreen.publishPostMsg('OrderDetail', _.extend({}, OrderService.getOrderPublishData(), OrderPayService.getOrderPayParams()));
					};
					// 多支付科目组的提交
					var multiPaySubjectSubmit = function (curName) {
						// 找出scope.optCfg.selectedSubjects队列末尾的支付科目，为当前操作支付科目
						var realPriceEl = el.find('input[name=realPrice]');
						var realPay = parseFloat(realPriceEl.val());
						var selectedSubCodes = scope.optCfg.selectedSubjects;
						var curSubCode = selectedSubCodes[selectedSubCodes.length - 1];
						OrderPayService.updatePaySubjectItem(curName, {
							debitAmount : realPay,
							subjectCode : curSubCode
						});
						if (_.isEmpty(curSubCode)) {
							AppAlert.add('danger', '请选择科目');
						}
					};
					// 扫描二维码账单支付提交
					var scanQRCodePaySubmit = function () {
						var callServer = OrderService.orderOtherOperation('CKZDZT');
						callServer.success(function (data) {
							var code = _.result(data, 'code'),
								res = _.result(data, 'data'),
								orderStatus = _.result(res, 'orderStatus'),
								isCanCheckout = _.result(res, 'isCanCheckout', 0),
								cannotCheckoutRemark = _.result(res, 'cannotCheckoutRemark', '');
							if (code == '000') {
								// if (!_.isEmpty(cannotCheckoutRemark)) {
								// 	AppAlert.add('danger', cannotCheckoutRemark);
								// }
								// 扫码付款付款完成
								if (orderStatus == 40) {
									// 推送消息，清空副屏幕的二维码
									Hualala.SecondScreen.publishPostMsg('PayQRCode', '');
									// 关闭支付窗口，重置订单页面
									scope.$emit('scanPay.done');
								} else {
									AppAlert.add('danger', "该账单未支付完成");
								}
							} else {
								AppAlert.add('danger', _.result(data, 'msg', ''));
							}
						}).error(function (data) {
							AppAlert.add('danger', "服务器通信失败");
						});
					};

					// 格式化支付操作表单元素数据
					var mapFormCfg = function () {
						var formCfg = scope.formCfg;
						var prePayAmount = OrderPayService.preCalcPayAmountByPaySubjectGrpName(curPayGrpName);
						switch(curPayGrpName) {
							// 现金支付，账单减免，代金券，哗啦啦支付
							case "cashPay":
							case "remissionPay":
							case "voucherPay":
							case "hualalaPay":
								_.each(formCfg, function (el) {
									var name = _.result(el, 'name');
									if (name == 'realPrice') {
										el.value = prePayAmount;
									} else {
										el.value = 0;
									}
								});
								if (curPayGrpName == 'hualalaPay') {
									scope.payType = '';
									var curPayDetail = OrderPayService.mapOrderPayDetail(),
										payGrp = _.result(curPayDetail, 'payGrps', []),
										onlyHLLPayManual = false,
										testArr = 'cashPay,hualalaPay,voucherPay,vipCardPay,bankCardPay,groupBuyPay,hangingPay'.split(',');
									IX.Debug.info('当前支付科目明细:');
									IX.Debug.info(payGrp);
									var hasPayGrps = _.reject(payGrp, function (el) {
										return _.result(el, 'amount') == 0;
									});
									IX.Debug.info('当前已使用支付科目:');
									IX.Debug.info(hasPayGrps);
									_.each(hasPayGrps, function (el) {
										var grpName = _.result(el, 'name');
										if (_.find(testArr, function (el) {return grpName == el;})) {
											onlyHLLPayManual = true;
											return;
										}
									});
									scope.onlyHLLPayManual = onlyHLLPayManual;
								}
								break;
							case "hangingPay":
							case "groupBuyPay":
							case "bankCardPay":
								_.each(formCfg, function (el) {
									var name = _.result(el, 'name');
									var delta = HCMath.sub(prePayAmount, _.result(scope.optCfg, 'selectedAmount', 0));
									if (name == 'realPrice') {
										el.value = delta;
									} else {
										el.value = 0;
									}
								});
								break;
						}
					};
					// 格式化支付科目选项数据
					var mapPaySubjectOptsCfg = function () {
						var items = _.result(scope.paySubjectGrp, 'items', []),
							subCodes = _.pluck(items, 'subjectCode'),
							subLabels = _.pluck(items, 'subjectName'),
							subAmounts = _.map(subCodes, function (c) {
								var record = OrderPayService.getPaySubjectRecord(c);
								return _.result(record, 'debitAmount', 0);
							});
						var opts, selectedOpts, selectedAmount = 0;
						switch(curPayGrpName) {
							// 挂账，团购支付，银行卡支付
							case "hangingPay":
							case "groupBuyPay":
							case "bankCardPay":
								opts = _.zip(subCodes, subLabels, subAmounts);
								opts = _.map(opts, function (v) {
									var item = _.object(['value', 'label', 'amount'], v);
									var amount = parseFloat(_.result(item, 'amount', 0)),
										label = _.result(item, 'label', '');
									var txt = '<p>' + label + '</p>' 
										+ (amount == 0 ? '' : ('<p>已支付:￥' + amount + '</p>'));

									return _.extend(item, {
										label : txt
									});
								});
								selectedOpts = _.filter(opts, function (el) {return parseFloat(_.result(el, 'amount', 0)) != 0;});
								selectedAmount = HCMath.add.apply(null, _.pluck(opts, 'amount'));
								break;
							default : 
								opts = [];
								break;
						}
						scope.optCfg = {
							items : opts,
							selectedSubjects : _.pluck(selectedOpts, 'value'),
							selectedAmount : selectedAmount
						};
					};
					var initPayForm = function () {
						// 整理支付科目选项数据
						mapPaySubjectOptsCfg();
						// 整理支付表单数据
						mapFormCfg();
						scope.$emit('pay.chkPayFormValid', true);
						
					};
					initPayForm();
					el.on('change', 'input[name=realPrice]', function (e) {
						var txtEl = $(this), v = txtEl.val();
						var changeEl = el.find('input[name=change]');
						var prePayAmount = OrderPayService.preCalcPayAmountByPaySubjectGrpName(curPayGrpName);
						var changeVal = HCMath.sub(prePayAmount, v);
						changeEl.val(changeVal);
					});
					scope.getUnpayAmount = function () {
						var orderPayDetail = OrderPayService.mapOrderPayDetail(),
							unPayAmount = _.result(orderPayDetail, 'unPayAmount', 0);
						return unPayAmount;
					};
					// 判断是否需要左侧栏位
					scope.needLeftBar = function (name) {
						var curName = scope.paySubjectGrp.name;
						var leftBarNames = 'discountPay,bankCardPay,groupBuyPay,hangingPay'.split(',');
						return _.find(leftBarNames, function (k) {
							return k == curName;
						});
					};
					// 选择支付科目
					// scope.onPaySubjectChange = function (subCodes, name, tarScope) {
					// 	console.info(subCodes + '--' + name);
					// 	// 要删除以选中的支付科目中没有设置金额的并且不止当前正在选中的科目
					// 	var opts = scope.optCfg.items,
					// 		lastSelected = subCodes[subCodes.length - 1],
					// 		hasAmountSubCodes = _.pluck(_.reject(scope.optCfg.items, function (el) {
					// 				return _.isEmpty(_.result(el, 'amount', 0));
					// 			}), 'value');
					// 	hasAmountSubCodes.push(lastSelected);
					// 	scope.optCfg.selectedSubjects = hasAmountSubCodes;
					// 	tarScope.curVal = scope.optCfg.selectedSubjects;
					// };
					scope.onPaySubjectChange = function (subCode) {
						console.info(subCode);
						var opts = scope.optCfg.items,
							hasAmountSubCodes = _.pluck(_.reject(opts, function (el) {
								return _.result(el, 'amount', 0) != 0;
							}), 'value');
						var idx = _.indexOf(hasAmountSubCodes, subCode);
						// 将当前选择的支付科目号放在已支付的队列末尾s
						if (idx != -1) {
							hasAmountSubCodes = hasAmountSubCodes.slice(0, idx).concat(hasAmountSubCodes.slice(idx + 1));
						}
						hasAmountSubCodes.push(subCode);
						scope.optCfg.selectedSubjects = hasAmountSubCodes;
					};

					// 选择打折方案
					scope.onDiscountChange = function (discountRule) {
						var params = _.object('_id,discountRate,discountRange,isVipPrice'.split(','), discountRule.split(';'));
						console.info("current discount rule:");
						console.info(params);
						curDiscountRule = discountRule;
					};


					// 结账提交
					scope.$on('pay.submit', function (d, targetPaySubjectGrp) {
						var curName = scope.paySubjectGrp.name,
							tarName = targetPaySubjectGrp.name;
						if (curName != tarName) return;	
						switch(curName) {
							case "cashPay":
							case "remissionPay":
							case "voucherPay":
							case "hualalaPay":
								if (curName == 'hualalaPay' &&  !!scope.payType) {
									scanQRCodePaySubmit();
									return;
								} else {
									singlePaySubjectSubmit(curName);
								}
								break;
							// 挂账，团购支付，银行卡支付
							case "hangingPay":
							case "groupBuyPay":
							case "bankCardPay":
								multiPaySubjectSubmit(curName);

								break;
							// 折扣方案选择
							case "discountPay" :
								var params = _.object('_id,discountRate,discountRange,isVipPrice'.split(','), curDiscountRule.split(';'));
								OrderPayService.updatePaySubjectItem(curName, params);
								break;
						}
						scope.$emit('pay.detailUpdate');
						initPayForm();
						console.info(d);
						console.info(targetPaySubjectGrp);
						console.info(scope);
						console.info(el);
						console.info(attr);
						d.preventDefault();
						return ;
					});

					// 输入框聚焦事件
					// 告诉软键盘当前操作控件
					scope.inputFocus = function ($event) {
						IX.Debug.info($event);
						var curEl = $($event.target);
						if (!curEl.attr('readonly') && !curEl.attr('disabled')) {
							scope.focusInputEl = curEl;
						} else {
							scope.focusInputEl = null;
						}
						return;

					};

					scope.formElKeyup = function (invalid, dirty) {
						scope.$emit('pay.chkPayFormValid', (invalid == true && dirty == true) ? false : true);
					};

					// 生成支付二维码
					scope.genQRCode = function (type) {
						var realPriceEl = el.find('input[name=realPrice]');
						var prePayAmount = parseFloat(OrderPayService.preCalcPayAmountByPaySubjectGrpName(curPayGrpName));
						var saasOrderKey = OrderService.getSaasOrderKey(),
							QRCodeType = type,
							QRCodeSize = 250,
							defaultQRCodeLabels = {
								'HLL' : '请使用哗啦啦扫描二维码支付',
								'ALIPAY' : '请使用支付宝扫描二维码支付',
								'WECHAT' : '请使用微信扫描二维码支付',
								'BAIDU' : '请使用百度扫描二维码支付'
							};
						var qrcodeCallServer, precheckoutCallServer;
						scope.payType = type;
						scope.curQRCode = null;
						scope.curQRCodeOpt = null;
						scope.curQRCodeLabel = null;
						scope.curQRCodeTitle = null;
						realPriceEl.val(prePayAmount);
						realPriceEl.trigger('change');
						if (!type) {
							// 推送二维码消息
							Hualala.SecondScreen.publishPostMsg('PayQRCode', '');
							scope.$emit('pay.updateQRCodeParams', {
								curQRCode : scope.curQRCode,
								curQRCodeTitle : scope.curQRCodeTitle,
								curQRCodeLabel : scope.curQRCodeLabel
							});
							return;
						}
						var genQRCode = function (data, qrcodeType) {
							var remark = _.result(data, 'remark', null),
								title = _.result(data, 'title', null);
							scope.curQRCode = _.result(data, 'QRCodeTxt', null);
							scope.curQRCodeTitle = title;
							scope.curQRCodeLabel = remark || defaultQRCodeLabels[qrcodeType];
							scope.curPayType = scope.genPayTypeImg(qrcodeType);
							scope.curQRCodeOpt = {
								render : 'image',
								size : QRCodeSize,
								fill : '#000',
								background : '#fff',
								label : scope.curQRCode
							};
							//高亮显示二维码下方数字
							var reg=/￥(\d+.\d\d)/
							scope.curQRCodeLabel=scope.curQRCodeLabel.split(reg);

							scope.$emit('pay.updateQRCodeParams', {
								curQRCode : scope.curQRCode,
								curQRCodeTitle : scope.curQRCodeTitle,
								curQRCodeLabel : scope.curQRCodeLabel
							});
							// 生成二维码并推送给副屏幕
							// 推送二维码消息
							Hualala.SecondScreen.publishPostMsg('PayQRCode', {
								saasOrderKey : saasOrderKey, 
								QRCodeType : QRCodeType,
								curQRCode : scope.curQRCode, 
								curQRCodeTitle : scope.curQRCodeTitle,
								curQRCodeLabel : scope.curQRCodeLabel,
								curPayType : scope.curPayType,
								curQRCodeOpt : scope.curQRCodeOpt,
								curQRCodeLabelNum : scope.curQRCodeLabelNum
							});
						};
					  	scope.genPayTypeImg = function (type) {
							if (_.isEmpty(type)) return '';
							var imgPath = 'img/ic_' + type.toLowerCase() + '.png';
							return imgPath;
						};	
						precheckoutCallServer = OrderService.submitOrder('YJZ', _.extend(OrderPayService.getOrderPayParams(), {
							payQRCodeTitle : scope.curQRCodeTitle,
							payQRCodeTxt : scope.curQRCode,
							payQRCodeRemark : scope.curQRCodeLabel
						}));
						precheckoutCallServer.success(function (data) {
							var c = _.result(data, 'code');
							if (c == '000') {
								// 生成二维码
								qrcodeCallServer = CommonCallServer.getOrderCheckoutQRCode({
									saasOrderKey : saasOrderKey,
									QRCodeType : QRCodeType
								});
								qrcodeCallServer.success(function (data) {
									var code = _.result(data, 'code');
									if (code == "000") {
										genQRCode(_.result(data, 'data'), QRCodeType);
									} else {
										AppAlert.add('danger', _.result(data, 'msg', ''));
									}
								}).error(function (data) {
									AppAlert.add('danger', "通信失败");
								});
							} else {
								AppAlert.add('danger', _.result(data, 'msg', ''));
							}
						});
					};
					scope.hasQRCode = function () {
						return !_.isEmpty(scope.curQRCode);
					};
					
				}
			}
		}
	]);

	// 会员卡支付科目表单
	app.directive('vippayform', [
		"$rootScope", "$filter", "OrderService", "OrderPayService", "VIPCardService", "AppAlert", "AppConfirm",
		function ($rootScope, $filter, OrderService, OrderPayService, VIPCardService, AppAlert, AppConfirm) {
			return {
				restrict : 'E',
				templateUrl : 'js/diandan/vippayform.html',
				scope : {
					paySubjectGrp : '=paySubjectGrp'
				},
				replace : true,
				link : function (scope, el, attr) {
					IX.ns("Hualala");
					var HC = Hualala.Common;
					var HCMath = Hualala.Common.Math;
					// HC.TopTip.reset($rootScope);
					// scope.closeTopTip = function (index) {
					// 	HC.TopTip.closeTopTip($rootScope, index);
					// };
					// 初始化表单数据
					var initPayForm = function () {
						var discountRate = _.result(scope.vipInfo, 'shopDiscountRate'),
							discountRange = _.result(scope.vipInfo, 'discountRange'),
							isVipPrice = _.result(scope.vipInfo, 'isVIPPrice'),
							cardPointAsMoney = parseFloat(_.result(scope.vipInfo, 'cardPointAsMoney', 0)),
							cardCashBalance = parseFloat(_.result(scope.vipInfo, 'cardCashBalance', 0)),
							cardGiveBalance = parseFloat(_.result(scope.vipInfo, 'cardGiveBalance', 0)),
							// 会员卡现金余额居然是cardCashBalance和cardGiveBalance两个数据相加......
							cardMoneyBalance = parseFloat(HCMath.add(cardCashBalance, cardGiveBalance));

						var prePayAmount = scope.prePayAmount = parseFloat(OrderPayService.preCalcPayAmountByPaySubjectGrpName('vipCardPay'));
						var delta = 0;
						// 如果会员卡cardPointAsMoney >= prePayAmount, 全部使用积分
						// 如果cardPointAsMoney < prePayAmount, 将积分全部使用
						scope.payByPoint = cardPointAsMoney >= prePayAmount ? prePayAmount : cardPointAsMoney;
						delta = HCMath.sub(prePayAmount, scope.payByPoint);
						scope.payByCash = cardMoneyBalance >= delta ? delta : cardMoneyBalance;
						delta = HCMath.sub(delta, scope.payByCash);
						scope.prePayAmount = delta;

						var orderPayDetail = OrderPayService.mapOrderPayDetail(),
							unPayAmount = _.result(orderPayDetail, 'unPayAmount', 0);
						var cashVouchers = scope.curCashVouchers;
						var cashVoucherOpts = VIPCardService.getCashVoucherInfoByID(cashVouchers);
						var cashVoucherAmount = cashVouchers.length == 0 ? 0 : HCMath.add.apply(null, _.pluck(cashVoucherOpts, 'voucherValue'));
						var total = HCMath.add.apply(null, [scope.payByPoint, scope.payByCash, cashVoucherAmount]);
						scope.updatePaySumValue(total, unPayAmount);

					};
					// 初始化zhifukemu 
					var initPaySubject = function () {
						if (_.isEmpty(VIPCardService.getOrigVIPCardData())) {
							scope.vipInfo = null;
							scope.cashVoucherOpts = null;
							scope.curCashVouchers = [];
							scope.payByPoint = 0;
							scope.payByCash = 0;
							scope.prePayAmount = 0;
							scope.cardTransPWD = '';
						} else {
							scope.vipInfo = VIPCardService.mapVIPCardInfo();
							scope.cashVoucherOpts = VIPCardService.mapCashVoucherOpts();
							scope.curCashVouchers = [];
							scope.cardTransPWD = '';
							initPayForm();
						}
					};
					
					
					scope.$on('pay.setVIPCard', function (d, card) {
						if (!_.isEmpty(card)) {
							// 初始化会员卡数据
							VIPCardService.initVIPCardInfo(card);
						}
					});

					scope.updatePaySumValue = function (total, unPayAmount) {
						scope.vipPaySum = total;
						scope.vipRealPaySum = total > unPayAmount ? unPayAmount : total;
					};

					scope.$watch('payByCash', function (nv, ov) {
						if (nv == ov || nv == undefined) return;
						var orderPayDetail = OrderPayService.mapOrderPayDetail(),
							unPayAmount = _.result(orderPayDetail, 'unPayAmount', 0);
						var payByPoint = scope.payByPoint;
						var cashVouchers = scope.curCashVouchers;
						var cashVoucherOpts = VIPCardService.getCashVoucherInfoByID(cashVouchers);
						var cashVoucherAmount = cashVouchers.length == 0 ? 0 : HCMath.add.apply(null, _.pluck(cashVoucherOpts, 'voucherValue'));
						var total = HCMath.add.apply(null, [payByPoint, nv, cashVoucherAmount]);
						if (total > unPayAmount) {
							AppAlert.add("danger", "你使用的会员卡支付总额已经超出应付金额！");
						}
						scope.updatePaySumValue(total, unPayAmount);
					});

					scope.$watch('payByPoint', function (nv, ov) {
						if (nv == ov || nv == undefined) return;
						var orderPayDetail = OrderPayService.mapOrderPayDetail(),
							unPayAmount = _.result(orderPayDetail, 'unPayAmount', 0);
						var payByCash = scope.payByCash;
						var cashVouchers = scope.curCashVouchers;
						var cashVoucherOpts = VIPCardService.getCashVoucherInfoByID(cashVouchers);
						var cashVoucherAmount = cashVouchers.length == 0 ? 0 : HCMath.add.apply(null, _.pluck(cashVoucherOpts, 'voucherValue'));
						var total = HCMath.add.apply(null, [payByCash, nv, cashVoucherAmount]);
						if (total > unPayAmount) {
							AppAlert.add("danger", "你使用的会员卡支付总额已经超出应付金额！");
						}
						scope.updatePaySumValue(total, unPayAmount);
					});

					/**
					 * 格式化现金代金券使用记录
					 * @return {[type]} [description]
					 */
					var formatCashVoucherText = function (items) {
						var opts = _.isEmpty(items) ? [] : VIPCardService.getCashVoucherInfoByID(items);
						var l = opts.length, amount = HCMath.add.apply(null, _.pluck(opts, 'voucherValue'));
						var txt = '使用{count}张,共{amount}元'.replace('{count}', l).replace('{amount}', amount);
						scope.curCashVoucherStr = txt;
						// scope.$apply();
						var payByPoint = scope.payByPoint, payByCash = scope.payByCash;
						var orderPayDetail = OrderPayService.mapOrderPayDetail(),
							unPayAmount = _.result(orderPayDetail, 'unPayAmount', 0);
						var total = HCMath.add.apply(null, [payByPoint, payByCash, amount]);
						if (total > unPayAmount) {
							AppAlert.add("danger", "你使用的会员卡支付总额已经超出应付金额！");
						}
						scope.updatePaySumValue(total, unPayAmount);
					};
					
					// 计算会员卡卡值余额
					scope.sumVIPCardMoneyBalance = function (cardCashBalance, cardGiveBalance) {
						cardCashBalance = !cardCashBalance ? 0 : cardCashBalance;
						cardGiveBalance = !cardGiveBalance ? 0 : cardGiveBalance;
						return parseFloat(HCMath.add(cardCashBalance, cardGiveBalance));
					};
					
					// 判断是否有会员卡数据
					scope.hasVIPInfo = function () {
						return !_.isEmpty(scope.vipInfo);
						// return true;
					};

					/**
					 * 现金券选项改变操作
					 * @param  {[type]} v			[description]
					 * @param  {[type]} checkboxName [description]
					 * @return {[type]}			  [description]
					 */
					scope.onCashVoucherChange = function (v, checkboxName, tarScope, curVal) {
						console.info(curVal);
						var curVoucher = _.find(scope.cashVoucherOpts, function (el) {return el.value == curVal}),
							isActive = _.indexOf(v, curVal);
						if (isActive > -1) {
							
						}
						formatCashVoucherText(v);

					};
					el.on('click', '.btn-checkbox', function (e) {
						var btn = $(this),
							chkbox = btn.find(':checkbox'),
							val = chkbox.val();
						var checked = chkbox.is(':checked');
						var curVoucher = _.find(scope.cashVoucherOpts, function (el) {return el.value == val});
						if (!checked) {
							// var a = confirm(curVoucher.voucherUsingNotes + '\n' + '是否使用?');
							// if (!a) {
							// 	e.stopPropagation();
							// 	return;
							// }
							AppConfirm.add({
								title : "使用券",
								// msg : curVoucher.voucherUsingNotes + '<br/>' + '是否使用?',
								msg : (_.isEmpty(curVoucher.voucherUsingNotes) ? '' : curVoucher.voucherUsingNotes + '<br/>') + '是否使用？',
								yesFn : function () {
									var _cashVoucherOpts = scope.cashVoucherOpts,
										_curVoucher = curVoucher;

									setTimeout(function () {
										chkbox.trigger('click');
									});
									return;
								},
								noFn : function () {
									
									return;
								}
							});
						} else {
							chkbox.trigger('click');
						}
						e.stopPropagation();
						e.preventDefault();
					});

					

					/**
					 * 获取会员卡信息
					 * @return {[type]} [description]
					 */
					scope.getVIPCardInfo = function (val) {
						var callServer = VIPCardService.loadVIPCardInfo({
							cardNoOrMobile : val
						});
						callServer.success(function (data) {
							var code = _.result(data, 'code');
							if (code !== '000') {
								AppAlert.add('danger', _.result(data, 'msg', ''));
								return;
							}
							scope.vipInfo = VIPCardService.mapVIPCardInfo();
							scope.cashVoucherOpts = VIPCardService.mapCashVoucherOpts();
							scope.curCashVouchers = [];
							// 触发保存会员卡数据到父层控制器
							scope.$emit('pay.upVIPCard', VIPCardService.getOrigVIPCardData());
							// formatCashVoucherText();
							// 根据会员卡折扣率，折扣范围，是否享受会员价，更新支付配置，并进行应付金额的预计算
							var discountRate = _.result(scope.vipInfo, 'shopDiscountRate'),
								discountRange = _.result(scope.vipInfo, 'discountRange'),
								isVipPrice = _.result(scope.vipInfo, 'isVIPPrice');
							OrderPayService.updateVipCardDicountSettings({
								discountRate : discountRate,
								isVipPrice : isVipPrice,
								discountRange : discountRange
							});
							// 更新会员卡支付相关参数
							OrderPayService.updateVIPCardPayParams({
								cardKey : _.result(scope.vipInfo, 'cardKey', ''),
								cardNo : _.result(scope.vipInfo, 'mobileIsCardID') == 1 ? _.result(scope.vipInfo, 'userMobile', '') : _.result(scope.vipInfo, 'cardNo', ''),
								cardTransPWD : scope.cardTransPWD
							});
							scope.$emit('pay.detailUpdate');
							initPayForm();
						});
						
					};

					// 整理代金券支付科目提交数据
					var mapCashVouchers = function (paySubjectGrp) {
						var items = scope.curCashVouchers;
						var opts = _.isEmpty(items) ? [] : VIPCardService.getCashVoucherInfoByID(items);
						var amount = HCMath.add.apply(null, _.pluck(opts, 'voucherValue')),
							voucherIDs = _.pluck(opts, 'voucherID').join(',');
						var payByPoint = _.isNumber(parseFloat(scope.payByPoint)) ? scope.payByPoint : 0,
							payByCash = _.isNumber(parseFloat(scope.payByCash)) ? scope.payByCash : 0;
						var prePayAmount = parseFloat(OrderPayService.preCalcPayAmountByPaySubjectGrpName('vipCardPay'));
						var delta = HCMath.sub(prePayAmount, payByCash, payByPoint);
						var debitAmount = amount < delta ? amount : delta;
						var payRemark = '代金券总金额￥' + amount + ';实际使用￥' + debitAmount;
						return amount <= 0 ? null : {
							payRemark : payRemark,
							debitAmount : debitAmount,
							giftItemNoLst : voucherIDs
						};
					};
					// 积分抵扣
					var mapPointPay = function () {
						var payByPoint = _.isNumber(parseFloat(scope.payByPoint)) ? scope.payByPoint : 0;
						return payByPoint <= 0 ? null : {
							debitAmount : payByPoint,
							giftItemNoLst : '',
							payRemark : '会员卡积分抵扣￥' + payByPoint
						};
					};
					// 会员卡现金卡值抵扣
					var mapCashPay = function () {
						var payByCash = _.isNumber(parseFloat(scope.payByCash)) ? scope.payByCash : 0;
						return payByCash <= 0 ? null : {
							debitAmount : payByCash,
							giftItemNoLst : '',
							payRemark : '会员卡现金抵扣￥' + payByCash
						};
					};

					// 提交支付科目表单
					scope.$on('pay.submit', function (d, targetPaySubjectGrp) {
						var curName = scope.paySubjectGrp.name,
							tarName = targetPaySubjectGrp.name;
						if (curName != tarName) return;	
						if (_.isEmpty(scope.vipInfo)) {
							// alert('请使用会员卡消费');
							// HC.TopTip.addTopTips($rootScope, {
							// 	msg : '请使用会员卡消费'
							// })
							AppAlert.add('danger', '请使用会员卡消费');
							return;
						}
						var items = targetPaySubjectGrp.items;
						var ret = {};
						_.each(items, function (el) {
							var subjectCode = _.result(el, 'subjectCode');
							switch (subjectCode) {
								// 代金券抵扣
								case '51010615':
									ret[subjectCode] = mapCashVouchers(targetPaySubjectGrp);
									break;
								// 会员积分抵扣
								case '51010613':
									ret[subjectCode] = mapPointPay();
									break;
								// 会员现金抵扣
								case '51010609':
									ret[subjectCode] = mapCashPay();
									break;
							}
						});
						// 更新会员卡支付相关参数
						OrderPayService.updateVIPCardPayParams({
							cardKey : _.result(scope.vipInfo, 'cardKey', ''),
							cardNo : _.result(scope.vipInfo, 'mobileIsCardID') == 1 ? _.result(scope.vipInfo, 'userMobile', '') : _.result(scope.vipInfo, 'cardNo', ''),
							cardTransPWD : scope.cardTransPWD
						});
						// 更新会员卡支付科目数据
						OrderPayService.updatePaySubjectItem(curName, ret);
						
						scope.$emit('pay.detailUpdate');
						VIPCardService.clear();
						d.preventDefault();
						return ;
					});

					el.on('click', '.btn[name=search]', function (e) {
						var txtEl = el.find('input[name=card_id]'),
							searchStr = txtEl.val(),
							callServer = null;
						if (_.isEmpty(searchStr)) {
							// HC.TopTip.addTopTips($rootScope, {
							// 	msg : '请输入手机号或卡号'
							// })
							AppAlert.add('danger', '请输入手机号或卡号');
							// alert("请输入手机号或卡号");
							return;
						}
						callServer = scope.getVIPCardInfo(searchStr);
					});
					el.on('keypress', 'input[name=card_id]', function (e) {
						var txtEl = $(this),
							val = txtEl.val(),
							callServer;
						if (e.keyCode == 13 && !_.isEmpty(val)) {
							callServer = scope.getVIPCardInfo(val);
						}
					});
					// 输入框聚焦事件
					// 告诉软键盘当前操作控件
					scope.inputFocus = function ($event) {
						IX.Debug.info($event);
						var curEl = $($event.target);
						if (!curEl.attr('readonly') && !curEl.attr('disabled')) {
							scope.focusInputEl = curEl;
						} else {
							scope.focusInputEl = null;
						}
						return;

					};

					scope.formElKeyup = function (invalid) {
						scope.$emit('pay.chkPayFormValid', invalid == true ? false : true);
					};
					initPaySubject();
				}
			}
		}
	]);
	

	// // 订单列表
	// app.directive('orderlist', [
	// 	"$rootScope", "$filter", "OrderService", 
	// 	function ($rootScope, $filter, OrderService) {
	// 		return {
	// 			restrict : 'E',
	// 			template : [
	// 				'<ul class="list-unstyled grid-body" >',
	// 					'<li class="row grid-row" ng-repeat="el in curOrderItems" ng-class="{\'food-item\' : (el.__nodeType == 0), \'food-child-item\' : (el.__nodeType != 0), ordered : el.printStatus == 2, setfood : (el.isSetFood == 1 && el.isSFDetail == 0), \'check-count\' : (el.isNeedConfirmFoodNumber > 0), active : (curFocusOrderItemKey == el.itemKey)}" item-key="{{el.itemKey}}" ng-click="selectOrderItem(el.itemKey)" >',
	// 						'<span class="col-xs-1 grid-cell txt" ng-if="el.__nodeType == 0"><span class="make-status" title="{{el.makeStatus}}"></span></span>',
	// 						'<span class="col-xs-4 grid-cell txt" ng-class="{\'col-xs-offset-1\' : el.__nodeType != 0}">{{el.foodName}}</span>',
	// 						'<span class="col-xs-2 grid-cell num">{{el.foodNumber}}</span>',
	// 						'<span class="col-xs-2 grid-cell unit">{{el.unit}}</span>',
	// 						// '<span class="col-xs-3 grid-cell price">{{el.foodPayPrice}}</span>',
	// 						'<span class="col-xs-3 grid-cell price">{{calcFoodAmount(el)}}</span>',
	// 						'<div class="col-xs-12 grid-cell clearfix modifyprice" ng-class="{hidden : (!el.modifyReason || el.modifyReason.length == 0)}">',
	// 							'<span class="col-xs-offset-1 col-xs-11 grid-cell txt">{{el.modifyReason}}</span>',
	// 						'</div>',
	// 						'<div class="col-xs-12 grid-cell clearfix cancelreason" ng-class="{hidden : (!el.foodCancelNumber || el.foodCancelNumber == 0) }">',
	// 							'<span class="col-xs-offset-1 col-xs-4 grid-cell txt">{{el.cancelReason}}</span>',
	// 							'<span class="col-xs-2 grid-cell num">{{el.foodCancelNumber}}</span>',
	// 							'<span class="col-xs-3 grid-cell price"></span>',
	// 							'<span class="col-xs-2 grid-cell unit"></span>',
	// 						'</div>',
	// 						'<div class="col-xs-12 grid-cell clearfix sendreason" ng-class="{hidden : (!el.foodSendNumber || el.foodSendNumber == 0)}">',
	// 							'<span class="col-xs-offset-1 col-xs-4 grid-cell txt">{{el.sendReason}}</span>',
	// 							'<span class="col-xs-2 grid-cell num">{{el.foodSendNumber}}</span>',
	// 							'<span class="col-xs-3 grid-cell price"></span>',
	// 							'<span class="col-xs-2 grid-cell unit"></span>',
	// 						'</div>',
	// 						'<div class="col-xs-12 grid-cell clearfix foodremark" ng-class="{hidden : (!el.foodRemark || el.foodRemark.length == 0)}">',
	// 							'<span class="col-xs-offset-1 col-xs-11 grid-cell txt">{{el.foodRemark}}</span>',
	// 						'</div>',
	// 					'</li>',
	// 				'</ul>'
	// 			].join(''),
	// 			replace : true,
	// 			link : function (scope, el, attr) {
	// 				el.on('click', '.food-item, .food-child-item', function (e) {
	// 					var itemEl = $(this);
	// 					el.find('.food-item, .food-child-item').removeClass('active');
	// 					itemEl.addClass('active');
	// 				});
	// 			}
	// 		};

	// 	}
	// ]);

	// // 订单条目操作按钮组
	// app.directive('orderitemhandle', [
	// 	"$modal", "$rootScope", "$filter", "OrderService",
	// 	function ($modal, $rootScope, $filter, OrderService) {
	// 		return {
	// 			restrict : 'E',
	// 			template : [
	// 				'<div class="order-btngrp">',
	// 					'<button class="btn btn-default btn-block" type="button" ng-disabled="!btn.active" ng-repeat="btn in OrderItemHandle" name="{{btn.name}}">',
	// 						'{{btn.label}}',
	// 					'</button>',
	// 				'</div>'
	// 			].join(''),
	// 			replace : true,
	// 			link : function (scope, el, attr) {
	// 				el.on('click', '.btn-block', function () {
	// 					var btn = $(this), act = btn.attr('name');
	// 					var modalSize = "lg",
	// 						controller = "",
	// 						templateUrl = "",
	// 						resolve = {
	// 							_scope : function () {
	// 								return scope;
	// 							}
	// 						};
	// 					switch(act) {
	// 						case "send":
	// 							controller = "OrderItemSendController";
	// 							templateUrl = "js/diandan/orderItemSend.html";
	// 							break;
	// 						case "cancel":
	// 							controller = "OrderItemCancelController";
	// 							templateUrl = "js/diandan/orderItemCancel.html";
	// 							break;
	// 						case "delete":
	// 							// TODO delete order item by itemtype
	// 							scope.$apply("deleteSelectedOrderItem()");
	// 							break;
	// 						case "addOne":
	// 							// TODO +1 handle
	// 							scope.$apply("addSelectedOrderItem()");
	// 							break;
	// 						case "subOne":
	// 							// TODO -1 handle
	// 							scope.$apply("subSelectedOrderItem()");
	// 							break;
	// 						case "count":
	// 							controller = "OrderItemModifyCountController";
	// 							templateUrl = "js/diandan/orderItemModifyCount.html";
	// 							break;
	// 						case "price":
	// 							controller = "OrderItemModifyPriceController";
	// 							templateUrl = "js/diandan/orderItemModifyPrice.html";
	// 							break;
	// 						case "method":
	// 							controller = "OrderItemModifyMethodController";
	// 							templateUrl = "js/diandan/orderItemModifyMethod.html";
	// 							break;
	// 						case "remark":
	// 							controller = "OrderItemModifyRemarkController";
	// 							templateUrl = "js/diandan/orderItemModifyRemark.html";
	// 							break;

	// 					}
	// 					if (act != 'delete' && act != 'addOne' && act != 'subOne') {
	// 						$modal.open({
	// 							size : modalSize,
	// 							controller : controller,
	// 							templateUrl : templateUrl,
	// 							resolve : resolve
	// 						});
	// 					}
	// 				});
	// 			}
	// 		}
	// 	}
	// ]);
	

	

	// 套餐搭配按钮组分页
	app.directive('setfoodPager', [
		"$rootScope", "$filter", "OrderService", "SetFoodService",
		function ($rootScope, $filter, OrderService, SetFoodService) {
			return {
				restrict : 'A',
				link : function (scope, el, attr) {
					// 获取下一页开始条目
					var getNextPageStartItem = function (jItems, jList) {
						var jBox = jList.parent();
						var boxRect = jBox[0].getBoundingClientRect();
						var jNextItem = null;
						jItems.each(function () {
							var jItem = $(this);
							var itemRect = jItem[0].getBoundingClientRect();
							if (boxRect.bottom - itemRect.bottom < 0) {
								jNextItem = jItem;
								return false;
							}
						});
						return jNextItem;
					};
					// 获取上一页开始条目
					var getPrevPageStartItem = function (jItems, jList) {
						var jBox = jList.parent();
						var boxRect = jBox[0].getBoundingClientRect();
						var jNextItem = null;
						var l = jItems.length;
						for (var i = l-1; i >= 0; i--) {
							var jItem = jItems.eq(i);
							var itemRect = jItem[0].getBoundingClientRect();
							if (boxRect.top - itemRect.top >= boxRect.height) {
								jNextItem = jItem;
								break;
							}
						}
						if (_.isEmpty(jNextItem)) {
							jNextItem = jItems.eq(0);
						}
						return jNextItem;
					};
					el.on('click', '.btn-prev, .btn-next', function (e) {
						IX.ns("Hualala.Common");
						var jBtn = $(this), HC = Hualala.Common;
						var direct = jBtn.attr('pager-act');
						var jItems = el.find(attr['setfoodPager']);
						var jList = jItems.parent();
						var jBox = jList.parent();
						var jNextItem = null;
						if (direct == 'next') {
							jNextItem = getNextPageStartItem(jItems, jList);
						} else {
							jNextItem = getPrevPageStartItem(jItems, jList);
						}
						if (!jNextItem) {
							jBtn.attr('disabled', false);
							return;
						}

						jBox.animate(
							{scrollTop : jNextItem.offset().top - jList.find(attr['setfoodPager'] + ':first').offset().top},
							400, 'swing',
							function () {
								jBtn.attr('disabled', false);
							}
						);

						// jOrderList.animate(
						// 	{scrollTop : jNextItem.offset().top - jOrderList.find('.grid-row:first').offset().top}, 
						// 	400, 'swing', 
						// 	function () {
						// 		jBtn.attr('disabled', false);

						// 	}
						// );
					});
				}
			};
		}
	]);

	// // 订单菜品翻页
	// app.directive('orderPager', [
	// 	"$rootScope", "$filter", "OrderService",
	// 	function ($rootScope, $filter, OrderService) {
	// 		return {
	// 			restrict : 'A',
	// 			link : function (scope, el, attr) {
	// 				// 获取下一页开始条目
	// 				var getNextPageStartItem = function () {
	// 					var orderItems = OrderService.getOrderFoodItemsHT().getAll();
	// 					var jOrderList = $('.order-list'), jGridBody = $('.grid-body', jOrderList);
	// 					var orderListRect = jOrderList[0].getBoundingClientRect();
	// 					var nextItem = _.find(orderItems, function (item) {
	// 						var itemKey = _.result(item, 'itemKey'),
	// 							itemSelector = '.food-item[item-key=' + itemKey + '], .food-child-item[item-key=' + itemKey + ']',
	// 							jItem = $(itemSelector),
	// 							itemRect = jItem[0].getBoundingClientRect();
	// 						var ret = null;
	// 						if (orderListRect.bottom - parseFloat(jOrderList.css('paddingBottom')) - itemRect.top >= 0 
	// 							&& orderListRect.bottom - parseFloat(jOrderList.css('paddingBottom')) - itemRect.bottom < 0) {
	// 							// 当前条目一部分在显示范围内，一部分在显示范围外
	// 							ret = jItem;
	// 						} else if (orderListRect.bottom - parseFloat(jOrderList.css('paddingBottom')) - itemRect.bottom < 0) {
	// 							// 当前条目在显示范围外
	// 							ret = jItem;
	// 						} 
	// 						return ret;
	// 					});
	// 					if (!_.isEmpty(nextItem)) {
	// 						nextItem = OrderService.getRootParentItem(_.result(nextItem, 'itemKey'));
	// 					}
	// 					return nextItem;
	// 				};
	// 				// 获取上一页开始条目
	// 				var getPrevPageStartItem = function () {
	// 					var orderItems = OrderService.getOrderFoodItemsHT().getAll();
	// 					var jOrderList = $('.order-list'), jGridBody = $('.grid-body', jOrderList);
	// 					var orderListRect = jOrderList[0].getBoundingClientRect();
	// 					var nextItem = _.find(_.clone(orderItems).reverse(), function (item) {
	// 						var itemKey = _.result(item, 'itemKey'),
	// 							itemSelector = '.food-item[item-key=' + itemKey + '], .food-child-item[item-key=' + itemKey + ']',
	// 							jItem = $(itemSelector),
	// 							itemRect = jItem[0].getBoundingClientRect();
	// 						var ret = null;
	// 						if (orderListRect.top - itemRect.top > orderListRect.height - parseFloat(jOrderList.css('paddingBottom'))) {
	// 							// 当前条目不全在可视区域内
	// 							ret = jItem;
	// 						}
	// 						return ret;
	// 					});
	// 					if (!_.isEmpty(nextItem)) {
	// 						nextItem = OrderService.getRootParentItem(_.result(nextItem, 'itemKey'));
	// 					}
	// 					if (!nextItem) {
	// 						nextItem = orderItems[0];
	// 					}
	// 					return nextItem;
	// 				};
	// 				el.on('click', '.btn-prev, .btn-next', function (e) {
	// 					IX.ns("Hualala.Common");
	// 					var jBtn = $(this),
	// 						HC = Hualala.Common;
	// 					var direct = jBtn.attr('pager-act');
	// 					var nextItem = null, jNextItem = null;
	// 					var jOrderList = $('.order-list');
	// 					if (direct == "next") {
	// 						nextItem = getNextPageStartItem();
	// 					} else {
	// 						nextItem = getPrevPageStartItem();
	// 					}

	// 					if (!nextItem) {
	// 						jBtn.attr('disabled', false);
	// 						return;
	// 					}
	// 					jNextItem = jOrderList.find('.food-item, .food-child-item').filter('[item-key=' + _.result(nextItem, 'itemKey') + ']');
						
	// 					jOrderList.animate(
	// 						{scrollTop : jNextItem.offset().top - jOrderList.find('.grid-row:first').offset().top}, 
	// 						400, 'swing', 
	// 						function () {
	// 							jBtn.attr('disabled', false);

	// 						}
	// 					);


						

	// 				});
	// 			}
	// 		};
	// 	}
	// ]);
	
	// 订单操作按钮组
	app.directive('orderhandlebtns', [
		"$modal", "$rootScope", "$filter", "$timeout", "storage", "OrderService", "OrderPayService", "AppAlert", "AppAuthEMP",
		function ($modal, $rootScope, $filter, $timeout, storage, OrderService, OrderPayService, AppAlert, AppAuthEMP) {
			return {
				restrict : 'E',
				template : [
					'<div class="btns-plain">',
						'<div class="col-xs-10">',
							'<div class="col-xs-2" ng-repeat="btn in OrderHandleBtns">',
								'<button class="btn btn-warning btn-block" ng-disabled="!btn.active" type="button" name="{{btn.name}}" ng-bind-html="btn.label" data-loading-text="{{btn.label}}"></button>',
							'</div>',
						'</div>',
						'<div class="col-xs-2">',
							'<button class="btn btn-default btn-block" type="button" name="return">返回(F9)</button>',
						'</div>',
					'</div>'
				].join(''),
				replace : true,
				link : function (scope, el, attr) {
					var submitOrder = null;
					var shopInfo = storage.get("SHOPINFO"),
						operationMode = _.result(shopInfo, 'operationMode'),
						webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? true : false,
						// 新需求：fastModeCreateOrderBeforePopOH --是否在结账前弹出单头配置窗口0:不弹窗（默认）；1：弹窗，但不要求输入台号；2：弹窗并且必须输入台号
						fastModeCreateOrderBeforePopOH = _.result(shopInfo, 'fastModeCreateOrderBeforePopOH', 0);
					if (operationMode != 0) {
						el.find('.btn[name=return]').attr('disabled', true);
					}
					el.on('click', '.btn-block', function (e) {
						var btn = $(this), act = btn.attr('name');
						var modalSize = "lg",
							controller = "",
							templateUrl = "",
							resolve = {
								_scope : function () {
									scope.act = act;
									return scope;
								}
							};
						switch(act) {
							case "submitOrder":
								scope.$apply("submitOrder()");
								break;
							case "suspendOrder":
								scope.$apply("suspendOrder()");
								break;
							case "pickOrder":
								controller = "PickOrderController";
								templateUrl = "js/diandan/pickOrder.html";
								break;
							case "payOrder":
							case "cashPayOrder":
								controller = "PayOrderController";
								templateUrl = "js/diandan/payOrder.html";
								break;
							case "openCashBox":
								btn.button('loading');
								scope.$apply("openCashBox()");
								$timeout(function () {
									btn.button('reset');
								}, 500);
								break;
							case "return":
								if (operationMode != 0) {
									return;
								}
								scope.$apply("jumpToTablePage()");
								break;
						}
						if (act == "pickOrder") {
							// 提餐操作，直接打开提单窗口
							// $modal.open({
							// 	size : modalSize,
							// 	windowClass : "",
							// 	controller : controller,
							// 	templateUrl : templateUrl,
							// 	resolve : resolve
							// });
							Hualala.ModalCom.openModal($rootScope, $modal, {
								size : modalSize,
								windowClass : webAppPageAnimationIsActive,
								controller : controller,
								templateUrl : templateUrl,
								resolve : resolve
							});
						} else if (act == "payOrder" || act == "cashPayOrder") {
							var orderData = OrderService.getOrderData(),
								foods = OrderService.getOrderFoodHT().getAll(),
								tableName = _.result(orderData, 'tableName'),
								hasOrderHeader = _.result(orderData, 'hasOrderHeader');
							if (foods.length == 0 && _.isEmpty(orderData.saasOrderKey)) {
								AppAlert.add('danger', '请先添加菜品再结账！');
								scope.$apply();
								return;
							}
							if (operationMode != 0) {
								if ((_.isUndefined(tableName) || tableName.length == 0) && fastModeCreateOrderBeforePopOH == 2) {
									// 如果快餐模式下，订单太牌号为空，要求弹出单头配置窗口，进行单头信息的填写
									scope.$emit('Order.OpenHeaderSet', act);
									AppAlert.add('danger', '请先设置台牌号、人数等信息！');
									// scope.$apply();
									return;
								}
								if (fastModeCreateOrderBeforePopOH == 1 && !hasOrderHeader) {
									scope.$emit('Order.OpenHeaderSet', act);
									AppAlert.add('danger', '请先设置台牌号、人数等信息！');
									return ;
								}
							}
			
							// 结账操作，需要先提交一次订单，待服务返回结账数据后进行结账
							submitOrder = OrderService.submitOrder('LD');
							var successCallBack = function (data) {
								var code = _.result(data, 'code'),
									ret = _.result(data, 'data');
								if (code == '000') {
									OrderService.initOrderFoodDB(ret);
									scope.resetOrderInfo();
									openOrderPayModal();
								} else if (code == 'CS005') {
									AppAuthEMP.add({
										yesFn : function (empInfo) {
											submitOrder = OrderService.submitOrder('LD', null, empInfo);
											submitOrder.success(function (data) {
												successCallBack(data);
											});
										},
										noFn : function () {

										}
									});
								}
								
							};
							var openOrderPayModal = function () {
								var needConfirmFoodNumberItems = OrderService.getNeedConfirmFoodNumberItems();
								if (needConfirmFoodNumberItems.length > 0) {
									AppAlert.add('danger', '有菜品未确认数量,请先对菜品确认数量!');
									scope.$apply();
								} else {
									OrderPayService.initOrderPay(function () {
										// $modal.open({
										// 	size : modalSize,
										// 	windowClass : "pay-modal",
										// 	controller : controller,
										// 	templateUrl : templateUrl,
										// 	resolve : resolve,
										// 	backdrop : "static"
										// });
										Hualala.ModalCom.openModal($rootScope, $modal, {
											size : modalSize,
											windowClass : "pay-modal " + webAppPageAnimationIsActive,
											controller : controller,
											templateUrl : templateUrl,
											resolve : resolve,
											backdrop : "static"
										});
									});
								}
							};
							if (_.isEmpty(submitOrder)) {
								openOrderPayModal();
							} else {
								submitOrder.success(function (data) {
									successCallBack(data);
								});
							}
							
						}
						
					});
				}
			};
		}
	]);


	

});
















