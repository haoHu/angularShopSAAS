define(['app', 'uuid'], function (app, uuid) {
	// 出品服务
	app.service('ProduceOrderService', [
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			IX.ns('Hualala');
			var self = this;
			var _OrderLst = [],
				OrderHT = new IX.IListManager();
			self.JZXOrderCount = 0;
			self.PDZOrderCount = 0;
			self.YGQOrderCount = 0;
			// 清空数据源
			this.clearOrderLst = function () {
				_OrderLst = [];
				OrderHT.clear();
			};
			// 初始化数据源
			this.initOrderLst = function (records) {
				_OrderLst = records;
				_.each(records, function (order) {
					var saasOrderKey = _.result(order, 'saasOrderKey');
					OrderHT.register(saasOrderKey, order);
				});
			};
			// 加载数据源
			this.loadFoodMakeStatusLst = function (params) {
				var c = CommonCallServer.getFoodMakeStatusLst(params);
				c.success(function (data) {
					var data = _.result(data, 'data', {}),
						records = _.result(data, 'records', []);
					self.JZXOrderCount = _.result(data, 'JZXOrderCount', 0);
					self.PDZOrderCount = _.result(data, 'PDZOrderCount', 0);
					self.YGQOrderCount = _.result(data, 'YGQOrderCount', 0);
					self.clearOrderLst();
					self.initOrderLst(records);
				});
				return c;
			};
			// 菜品出品状态操作
			this.foodMakeStatusOperate = function (params) {
				var c = CommonCallServer.foodMakeStatusOperation(params);
				c.success(function (data) {
					var code = _.result(data, 'code'),
						data = _.result(data, 'data', {}),
						saasOrderKey = _.result(data, 'saasOrderKey'),
						foodLst = _.result(data, 'foodLst', []),
						order = null;
					// 更新订单的foodLst
					if (code == '000') {
						order = self.getOrderItem(saasOrderKey);
						_.each(_.result(order, 'foodLst'), function (el) {
							var itemKey = _.result(el, 'itemKey');
							var targFood = _.find(foodLst, function (food) {
								return _.result(food, 'itemKey') == itemKey;
							});
							targFood && _.extend(el, targFood);
						});
					}
					
				});
				return c;
			};
			// 获取订单数据
			this.getOrderItem = function (saasOrderKey) {
				return OrderHT.get(saasOrderKey);
			},
			// 获取菜品制作状态
			this.getOrderFoodMakeStatus = function (saasOrderKey, itemKey) {
				var order = OrderHT.get(saasOrderKey),
					foodLst = _.result(order, 'foodLst', []),
					food = _.find(foodLst, function (el) {
						return _.result(el, 'itemKey') == itemKey;
					});
				var makeStatus = _.result(food, 'makeStatus'),
					makeStartTime = _.result(food, 'makeStartTime', 0),
					makeEndTime = _.result(food, 'makeEndTime', 0),
					makeCallCount = _.result(food, 'makeCallCount', 0);
				var statusName, statusStr;
				if (makeStatus == '21') {
					// 新加状态：菜品制作完成
					statusName = makeCallCount > 0 ? 'call' : 'maked';
					statusStr = makeCallCount > 0  ? '叫' + makeCallCount : '';
				} else if (makeStatus == '29') {
					statusName = 'hangup';
					statusStr = '挂';
				} else if (makeStatus == '3') {
					// 菜品完成取餐
					statusName = 'done';
					statusStr = '';
				} else {
					statusName = '';
					statusStr = '';
				}
				return {
					name : statusName,
					str : statusStr
				};
			};
			// 获取进行中、排队中、挂起中订单数
			this.getBadgeCountByType = function (type) {
				return self[type] || 0;
			};
			// 获取订单数据队列
			this.getOrderLst = function () {
				return OrderHT.getAll();
			};
			// 获取菜品数据队列
			this.getFoodLst = function () {
				var orders = OrderHT.getAll();
				var foods = [];
				// 遍历订单数据
				_.each(orders, function (order) {
					// 生成一道菜品对应一个订单的数据结构
					var _order = _.omit(order, 'foodLst');
					var foodLst = _.result(order, 'foodLst', []);
					foodLst = _.map(foodLst, function (food) {
						return _.extend(food, {
							__order : _order
						});
					});
					foods = foods.concat(foodLst);
				});
				return foods;
			};
			// 更新订单信息
			this.updateOrder = function (orders) {
				_.each(orders, function (order) {
					var saasOrderKey = _.result(order, 'saasOrderKey');
					var curOrder = this.getOrderitem(saasOrderkey);
					_.extend(curOrder, order);
				});
			};
		}
	]);
	
});