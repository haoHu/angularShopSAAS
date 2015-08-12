define(['app', 'diandan/OrderHeaderSetController'], function (app) {
	// 桌台控制器
	app.controller('TableViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer', 'OrderService', 'TableService', 'OrderChannel', 'OrderNoteService', 'AppAlert', 'AppAuthEMP',
		function ($scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer, OrderService, TableService, OrderChannel, OrderNoteService, AppAlert, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			// HC.TopTip.reset($rootScope);
			var shopInfo = storage.get("SHOPINFO"),
				operationMode = _.result(shopInfo, 'operationMode');
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			var allTableLstPromise = TableService.loadTableStatusLst();
			// 加载渠道数据
			OrderChannel.loadOrderChannels({}, function (data) {
				$scope.OrderChannels = OrderChannel.getAll();
				IX.Debug.info("Order Channels: ");
				IX.Debug.info($scope.OrderChannels);
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});

			$scope.OrderItemHandle = [
				{name : "addFood", clz : "addfood", active : true, label : "点菜"},
				{name : "urgeFood", active : false, label : "催叫"},
				// {name : "splitFood", active : false, label : "拆分"},
				{name : "changeFood", active : false, label : "转菜"},
				{name : "changeOrder", active : false, label : "换台"},
				{name : "mergeOrder", active : false, label : "并台"},
				{name : "unionOrder", active : false, label : "联台"},
				// {name : "selectAll", active : true, label : "全选"},
				// {name : "selectNone", active : true, label : "取消选择"}
			];
			// 当前选中的订单条目
			$scope.curSelectedOrderItems = [];

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

			// 桌台名称搜索关键字
			$scope.qTblName = '';
			// 桌台状态过滤字段
			$scope.qTblStatus = '-1';
			
			// 当前选中桌台区域名
			$scope.curAreaName = '';
			// 桌台区域数据
			$scope.TableAreas = [];
			// 格式化区域选项的渲染数据
			var mapTableAreaRenderData = function (areas) {
				// areas.unshift({
				// 	__ID__ : 'all_tables',
				// 	areaName : '',
				// 	tblLst : null
				// });
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

			$scope.refresh = function (dstTable, actionType) {
				var callServer = $scope.selectTableArea($scope.curAreaName);
				callServer.success(function (data) {
					var _tbl = TableService.getTableByItemID($scope.curTableID),
						tableStatus = _.result(_tbl, 'tableStatus'),
						saasOrderKey = _.result(_tbl, 'saasOrderKey'),
						hisFlag = _.result(_tbl, 'his', 0);
					if (actionType == 'HT') {
						OrderService.clear();
						$scope.resetOrderInfo();
					} else {
						OrderService.getOrderByOrderKey({
							saasOrderKey : saasOrderKey,
							hisFlag : hisFlag
						}, function (data) {
							$scope.resetOrderInfo();
						}, function (data) {
							// HC.TopTip.addTopTips($rootScope, data);
							AppAlert.add('danger', _.result(data, 'msg', ''));
						});
					}
				});
				
				// $scope.curTableName = null;
			};
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
				return callServer;
			};

			/*创建开台配置窗口*/
			var initOpenTableModal = function () {
				$scope.fmels = {
					person : '2',
					saasOrderRemark : '',
					tableName : $scope.curTableName
				};
				// $modal.open({
    //                 size : 'lg',
    //                 controller : "OpenTableSetController",
    //                 // templateUrl : "js/diandan/opentableset.html",
    //                 templateUrl : "js/diandan/orderheaderset.html",
    //                 resolve : {
    //                     _scope : function () {
    //                         return $scope;
    //                     }
    //                 }
    //             });
                Hualala.ModalCom.openModal($rootScope, $modal, {
                    size : 'lg',
                    controller : "OpenTableSetController",
                    // templateUrl : "js/diandan/opentableset.html",
                    templateUrl : "js/diandan/orderheaderset.html",
                    resolve : {
                        _scope : function () {
                            return $scope;
                        }
                    }
                });
                
                OrderService.clear();
				$scope.resetOrderInfo();
			};

			/**
			 * 选择桌台动作
			 * @param  {[type]} v [description]
			 * @return {[type]}   [description]
			 */
			$scope.selectTableName = function (table) {
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = _.result(table, 'itemID');
				$scope.curTableName = _.result(table, 'tableName', '');
				// 获取当前选中桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					var _tbl = TableService.getTableByItemID(tableKey),
						tableStatus = _.result(_tbl, 'tableStatus'),
						saasOrderKey = _.result(_tbl, 'saasOrderKey'),
						hisFlag = _.result(_tbl, 'his', 0);
					var activeBtns = ['addFood', 'changeOrder', 'mergeOrder', 'unionOrder'];
					// 如果桌台为占用状态并且订单号不为空，加载选中桌台的订单
					if (tableStatus == 1 && !_.isEmpty(saasOrderKey)) {
						OrderService.getOrderByOrderKey({
							saasOrderKey : saasOrderKey,
							hisFlag : hisFlag
						}, function (data) {
							$scope.resetOrderInfo();
						}, function (data) {
							// HC.TopTip.addTopTips($rootScope, data);
							AppAlert.add('danger', _.result(data, 'msg', ''));
						});
					} else if (tableStatus == 0) {
						// 弹出单头配置窗口，确认后发送开台请求，待成功开台后跳转点菜页面
						activeBtns = ['addFood'];
						initOpenTableModal();
					}
					
					$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
						var n = _.result(btn, 'name'),
							i = _.indexOf(activeBtns, n);
						btn['active'] = i >= 0 ? true : false;
						return btn;
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
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = _.result(table, 'itemID');
				$scope.curTableName = _.result(table, 'tableName', '');
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					var _tbl = TableService.getTableByItemID(tableKey),
						tableStatus = _.result(_tbl, 'tableStatus'),
						saasOrderKey = _.result(_tbl, 'saasOrderKey'),
						hisFlag = _.result(_tbl, 'his', 0);
						if (tableStatus == 0) {
							// 空闲桌台，进行开台操作
							initOpenTableModal();
						} else {
							// 进入点菜
							OrderService.getOrderByOrderKey({
								saasOrderKey : saasOrderKey,
								hisFlag : hisFlag
							}, function (data) {
								$scope.resetOrderInfo();
								$scope.jumpToDinnerPage();
							}, function (data) {
								// HC.TopTip.addTopTips($rootScope, data);
								AppAlert.add('danger', _.result(data, 'msg', ''));
							});
						}
				});
				
			};

			/**
			 * 跳转点菜页面
			 * @return {[type]} [description]
			 */
			$scope.jumpToDinnerPage = function () {
				var saasOrderKey = _.result($scope.orderHeader, 'saasOrderKey'),
					// tableName = _.result($scope.orderHeader, 'tableName');
					tableName = $scope.curTableName;
				console.info($scope.orderHeader);
				if (_.isEmpty(saasOrderKey)) return;
				var path = "/dinner/" + tableName;
				$location.path(path).search({saasOrderKey : saasOrderKey});
			};

			/**
			 * 菜品催叫动作
			 * @return {[type]} [description]
			 */
			$scope.urgeFoodAction = function () {
				var orderItems = $scope.curSelectedOrderItems;
				// 使用已落单菜品操作服务进行催叫菜操作
				var callServer = OrderService.urgeOrderFood(orderItems);
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						// HC.TopTip.addTopTips($rootScope, _.extend(data, {msg : "催叫成功"}));
						AppAlert.add('success', '催叫成功');
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								callServer = OrderService.urgeOrderFood(orderItems, empInfo);
								callServer.success(successCallBack);
							},
							noFn : function () {

							}
						});
					} else {
						// HC.TopTip.addTopTips($rootScope, data);
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				};
				callServer.success(function (data) {
					successCallBack(data);
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
			 * 通过选择的订单条目数据判断可以使用哪些操作按钮
			 * @param  {string} itemKey 订单条目itemKey 
			 * 如果选多个菜品，催叫、转菜按钮可以使用，否则催叫、转菜按钮不可使用
			 * @return {[type]}         [description]
			 */
			$scope.selectOrderItem = function (itemKey) {
				// $scope.curSelectedOrderItems
				var idx = _.indexOf($scope.curSelectedOrderItems, itemKey),
					activeBtns = '';
				// 如果当前选择itemKey在队列中，则删除该条记录
				// 否则压入队列
				if (idx == -1) {
					$scope.curSelectedOrderItems.push(itemKey);
				} else {
					$scope.curSelectedOrderItems = $scope.curSelectedOrderItems.slice(0, idx).concat($scope.curSelectedOrderItems.slice(idx + 1));
				}
				IX.Debug.info("Current Selected Order Items: ");
				IX.Debug.info($scope.curSelectedOrderItems);
				if ($scope.curSelectedOrderItems.length > 0) {
					activeBtns = ['addFood', 'urgeFood', 'changeFood', 'changeOrder', 'mergeOrder', 'unionOrder'];
				} else {
					activeBtns = ['addFood', 'changeOrder', 'mergeOrder', 'unionOrder'];
				}
				$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
					var n = _.result(btn, 'name'),
						i = _.indexOf(activeBtns, n);
					btn['active'] = i >= 0 ? true : false;
					return btn;
				});


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

			/**
			 * 打印账单消费明细
			 * @return {[type]} [description]
			 */
			$scope.printOrderDetailBill = function () {
				var orderData = OrderService.getOrderData();
				if (orderData) {
					Hualala.DevCom.exeCmd("PrintOrderDetailBill", JSON.stringify(orderData));
				}
			};


		}
	]);

	// 换台操作控制器
	app.controller('ChangeTableController', [
		'$scope', '$rootScope', '$modalInstance', '$location', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'TableService', 'AppAlert', 'AppConfirm', 'AppAuthEMP',
		function ($scope, $rootScope, $modalInstance, $location, $filter, _scope, CommonCallServer, OrderService, TableService, AppAlert, AppConfirm, AppAuthEMP) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			// HC.TopTip.reset($rootScope);
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			var allTableLstPromise = TableService.loadTableStatusLst();
			var action = _scope.curOrderAction;
			IX.Debug.info("Current Order Action: ");
			IX.Debug.info(action);
			// 桌台名称搜索关键字
			$scope.qTblName = '';
			// 桌台状态过滤字段
			$scope.qTblStatus = (action == 'changeFood' || action == 'unionOrder' || action == 'mergeOrder') ? '1' : (action == 'changeOrder' ? '0' : '-1');
			
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
					var orderHeader = _scope.orderHeader,
						fromTableName = _.result(orderHeader, 'tableName', ''),
						foodItemKeyLst = _scope.curSelectedOrderItems || [];
					var actionType = action == 'changeFood' ? 'CPHT' : (action == 'changeOrder' ? 'HT' : (action == 'mergeOrder' ? 'BT' : 'LT'));
					// var con = window.confirm("是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作？');
					// if (con) {
					// 	var callServer = OrderService.tableOperation(actionType, {
					// 		fromTableName : fromTableName,
					// 		toTableName : $scope.curTableName,
					// 		foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})

					// 	});
					// 	callServer.success(function (data) {
					// 		var code = _.result(data, 'code');
					// 		if (code == '000') {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('success', _.result(data, 'msg', ''));
					// 			_scope.refresh(table, actionType);
					// 			$modalInstance.close();
					// 		} else {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('danger', _.result(data, 'msg', ''));
					// 		}
					// 	});
					// } else {
					// 	$modalInstance.close();
					// }

					AppConfirm.add({
						title : (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : (actionType == 'BT' ? '并台' : '联台'))) + '操作',
						msg : "是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : (actionType == 'BT' ? '并台' : '联台'))) + '操作？',
						yesFn : function () {
							var postParams = {
								fromTableName : fromTableName,
								toTableName : $scope.curTableName,
								foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})

							};
							var successCallBack = function (data) {
								var code = _.result(data, 'code');
								if (code == '000') {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('success', _.result(data, 'msg', ''));
									_scope.refresh(table, actionType);
									$modalInstance.close();
								} else if (code == 'CS005') {
									AppAuthEMP.add({
										yesFn : function (empInfo) {
											callServer = OrderService.tableOperation(actionType, IX.extend(postParams, empInfo));
											callServer.success(successCallBack);
										},
										noFn : function () {

										}
									});
								} else {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							};
							var callServer = OrderService.tableOperation(actionType, postParams);
							callServer.success(function (data) {
								successCallBack(data);
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
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = _.result(table, 'itemID');
				$scope.curTableName = _.result(table, 'tableName', '');
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					var orderHeader = _scope.orderHeader,
						fromTableName = _.result(orderHeader, 'tableName', ''),
						foodItemKeyLst = _scope.curSelectedOrderItems || [];
					var actionType = action == 'changeFood' ? 'CPHT' : (action == 'changeOrder' ? 'HT' : 'BT');
					// var con = window.confirm("是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作？');
					// if (con) {
					// 	var callServer = OrderService.tableOperation(actionType, {
					// 		fromTableName : fromTableName,
					// 		toTableName : $scope.curTableName,
					// 		foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})
					// 	});
					// 	callServer.success(function (data) {
					// 		var code = _.result(data, 'code');
					// 		if (code == '000') {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('success', _.result(data, 'msg', ''));
					// 			_scope.refresh(table, actionType);
					// 			$modalInstance.close();
					// 		} else {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('danger', _.result(data, 'msg', ''));
					// 		}
					// 	});
					// } else {
					// 	$modalInstance.close();
					// }
					AppConfirm.add({
						title : (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作',
						msg : "是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作？',
						yesFn : function () {
							var postParams = {
								fromTableName : fromTableName,
								toTableName : $scope.curTableName,
								foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})
							};
							var callServer = OrderService.tableOperation(actionType, postParams);
							var successCallBack = function (data) {
								var code = _.result(data, 'code');
								if (code == '000') {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('success', _.result(data, 'msg', ''));
									_scope.refresh(table, actionType);
									$modalInstance.close();
								} else if (code == 'CS005') {
									AppAuthEMP.add({
										yesFn : function (empInfo) {
											callServer = OrderService.tableOperation(actionType, _.extend(postParams, empInfo));
											callServer.success(successCallBack);
										},
										noFn : function () {

										}
									});
								} else {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							};
							callServer.success(function (data) {
								successCallBack(data);
							});
						},
						noFn : function () {
							$modalInstance.close();
						}
					});
				});
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

			$scope.close = function () {
				$modalInstance.close();
			};
		} 
	]);


	
    
});
