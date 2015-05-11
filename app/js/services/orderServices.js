define(['app', 'uuid'], function (app, uuid) {
	// 订单数据服务
	app.service('OrderService', 
		['$rootScope', '$location', '$filter', 'storage', 'CommonCallServer', function ($rootScope, $location, $filter, storage, CommonCallServer) {
			IX.ns('Hualala');
			var self = this;
			this._OrderData = null;
			this.OrderFoodHT = null;

			var OrderHeaderKeys = 'saasOrderKey,saasOrderNo,saasDeviceOrderNo,timeNameStart,timeNameCheckout,tableName,selfWay,channelKey,channelName,channelOrderKey,cardNo,orderSubType,person,createBy,startTime,userName,userAddress,userMobile,reportDate'.split(','),
				FoodItemKeys = 'itemKey,itemType,isSetFood,isSFDetail,foodKey,foodName,foodNumber,unit,foodProPrice,foodPayPrice,foodVipPrice,foodRemark,parentFoodFromItemKey,makeStatus,unitAdjuvant,unitAdjuvantNumber'.split(','),
				FoodItemTypes = {
					"-1" : "NotExist",
					"0" : "CommonFood",
					"1" : "FoodMethod",
					"4" : "SetFood",
					"7" : "SetFoodDetail"
				};
			/**
			 * 根据订单菜品条目的数据[isSetFood,isSFDetail,parentFoodFromItemKey]三个字段判断该条目属于哪种数据单元
			 * 菜品条目，订单菜品操作的数据单元，主要分为以下4种：
			 * [普通菜品(0)],[套餐菜品(4)],[菜品作法(1)],[套餐详情中的菜品(7)]
			 * 	parseInt('		0					0					0	', 2)	=	0
			 * [普通菜品]: isSetFood == 0 && isSFDetail == 0 && _.isEmpty(parentFoodFromItemKey)
			 * 	parseInt('		1					0					0	', 2)	=	4
			 * [套餐菜品]: isSetFood == 1 && isSFDetail == 0 && _.isEmpty(parentFoodFromItemKey)
			 * 	parseInt('		0					0					1	', 2)	=	1
			 * [菜品作法]: isSetFood == 0 && isSFDetail == 0 && !_.isEmpty(parentFoodFromItemKey) && foodKey == [20]-[0|1|2|3]
			 * 	parseInt('			1				1					1	', 2)	=	7
			 * [套餐详情中的菜品]: isSetFood == 1 && isSFDetail == 1 && !_.isEmpty(parentFoodFromItemKey)
			 * @param {Object} food 		订单条目数据 
			 * @return {Number} 	计算结果为：0:普通菜品；4:套餐菜品；1;菜品作法；7:套餐详情中的菜品；-1:不存在这种数据源
			 */
			var getOrderFoodItemType = function (food) {
				var matchKeys = 'isSetFood,isSFDetail,parentFoodFromItemKey'.split(','),
					s = null;
				if (_.isEmpty(food)) return -1;
				s = _.map(matchKeys, function (k) {
					var v = 0;
					switch(k) {
						case "parentFoodFromItemKey":
							v = _.isEmpty(_.result(food, k)) ? 0 : 1;
							break;
						default:
							v = _.result(food, k, 0);
							break;
					}
					return v;
				}).join('');
				s = parseInt(s, 2);
				return s;
			};

			/**
			 * 初始化订单菜品数据字典
			 * @return {NULL} 
			 */
			this.initOrderFoodDB = function (data) {
				self._OrderData = data;
				var _HT = self.OrderFoodHT,
					foods = _.result(self._OrderData, 'foodLst', []);
				_HT.clear();
				_.each(foods, function (food) {
					var itemKey = _.result(food, 'itemKey');
					var nodeType = getOrderFoodItemType(food);
					food = _.extend(food, {
						__nodeType : nodeType == 7 ? 1 : (nodeType == 1 ? 2 : 0)
					});
					// 为字典注册菜品条目数据
					_HT.register(itemKey, food);
				});
			};

			/**
			 * 判断订单条目类型
			 * @param  {String}  itemKey 条目ID
			 * self.isNotExist
			 * self.isCommonFood
			 * self.isFoodMethod
			 * self.isSetFood
			 * self.isSetFoodDetail
			 */
			_.each(FoodItemTypes, function(f, k) {
				self['is' + f] = (function (v) {
					return function (itemKey) {
						var _HT = self.OrderFoodHT,
							_food = _HT.get(itemKey);
						return getOrderFoodItemType(_food) == v;
					};
				})(k);
			});

			/**
			 * 通过itemKey获取该条数据的类型判断值
			 * @param  {[type]} itemKey [description]
			 * @return {[type]}         [description]
			 */
			this.orderFoodItemType = function (itemKey) {
				var o = _.mapObject(FoodItemTypes, function (f, k) {
					return 'is' + f;
				});
				o = _.invert(o);
				return _.mapObject(o, function (v, f) {
					return self[f](itemKey);
				});
			};

			/**
			 * 根据itemKey获取菜品条目父节点数据
			 * @param {string} itemKey 菜品条目itemKey
			 * @return {Object|String|NULL} null:itemKey不是本字典数据；'root':itemKey已经是顶层节点; Object: itemKey对应的父节点条目数据
			 * 
			 */
			this.getParentFoodItemByItemKey = function (itemKey) {
				var _HT = self.OrderFoodHT;
				var _food = _HT.get(itemKey),
					parentFoodFromItemKey = _.result(_food, 'parentFoodFromItemKey', '');
				if (_.isEmpty(_food)) {
					return null;
				}
				if (_.isEmpty(parentFoodFromItemKey)) {
					return 'root';
				}
				return _HT.get(parentFoodFromItemKey);
			};

			/**
			 * 根据itemKey获取该item的根节点条目
			 * @param  {[type]} itemKey [description]
			 * @return {[type]}         [description]
			 */
			this.getRootParentItem = function (itemKey) {
				var curItemKey = itemKey;
				var pItem = self.getParentFoodItemByItemKey(curItemKey);
				if (pItem == 'root') {
					return self.getOrderFoodItemByItemKey(curItemKey);
				} else {
					return self.getRootParentItem(_.result(pItem, 'itemKey'));
				}
			};

			/**
			 * 根据orderKey获取订单信息
			 * @param  {Object} params  请求参数
			 * @param  {Function} success 请求成功回调
			 * @param  {Function} error   失败的回调
			 * @return {Object}         deferred/promise的APIs
			 */
			this.getOrderByOrderKey = function (params, success, error) {
				self._OrderData = {};
				var saasOrderKey = _.result(params, 'saasOrderKey');
				self.OrderFoodHT = new IX.IListManager();
				if (_.isEmpty(saasOrderKey)) {
					_.isFunction(success) && success();
					return null;
				}
				return CommonCallServer.getOrderByOrderKey(params)
					.success(function (data, status, headers, config) {
						var ret = _.result(data, 'data', {});
						self.initOrderFoodDB(ret);
						_.isFunction(success) && success(data, status, headers, config);
					})
					.error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 获取单头信息数据
			 * @return {[type]} [description]
			 */
			this.getOrderHeaderData = function () {
				var defaultData = {};
				if (_.isEmpty(self._OrderData)) {
					_.each(OrderHeaderKeys, function (k) {
						var v = '';
						switch (k) {
							case "orderSubType":
								v = "0";
								break;
							case "person":
								v = "1";
								break;
							case "createBy":
								v = _.result(storage.get('EMPINFO'), 'empCode');
								break;
							case "startTime":
								v = Hualala.Date(parseInt((new Date()).getTime() / 1000)).toText();
								v = IX.Date.getDateByFormat(v, 'yyyyMMddHHmmss');
								break;
							default :
								v = '';
								break;
						}
						defaultData[k] = v;
					});
					self._OrderData = _.extend(self._OrderData, defaultData);
				}
				return _.pick(self._OrderData, OrderHeaderKeys);
			};



			/**
			 * 更新订单单头信息
			 * @param  {Object} orderHeader 更新的单头信息
			 * @param {Function} success 发送更新单头信息请求后的回调
			 * @param {Function} error 发送更新单头信息请求失败的回调
			 * @return {null}             
			 */
			this.updateOrderHeader = function (orderHeader, success, error) {
				// 订单Key为空时，缓存单头数据
				self._OrderData = _.extend(self._OrderData, orderHeader);
				IX.Debug.info("Current Order Service Data:");
				IX.Debug.info(self._OrderData);
				if (!_.isEmpty(self.getSaasOrderKey())) {
					// 订单Key存在时，提交单头数据
					var params = {};
					_.each(OrderHeaderKeys, function (k) {
						params[k] = self._OrderData[k];
					});
					CommonCallServer.updateOrderHead(params)
						.success(function (data, status, headers, config) {
							_.isFunction(success) && success(data, status, headers, config);
						})
						.error(function (data, status, headers, config) {
							_.isFunction(error) && error(data, status, headers, config);
						});
				}
			};

			/**
			 * 获取订单key
			 * @return {String} 获取当前订单Key（saasOrderKey），当前没有生成订单时，返回空字符串
			 */
			this.getSaasOrderKey = function () {
				return _.result(self._OrderData, 'saasOrderKey', '');
			};


			/**
			 * 生成插入订单列表中菜品数据
			 * @param  {[type]} itemKey [description]
			 * @param  {[type]} food    [description]
			 * @return {[type]}         [description]
			 */
			var mapFoodItemData = function (itemKey, food) {
				var foodUnit = _.result(food, '__foodUnit'),
					soldout = _.result(food, '__soldout', null),
					isNeedConfirmFoodNumber = _.result(food, 'isNeedConfirmFoodNumber', 0),
					isSetFood = _.result(food, 'isSetFood', 0),
					setFoodDetailJson = _.result(food, 'setFoodDetailJson', ''),
					setFoodDetailLst = _.isEmpty(setFoodDetailJson) ? [] : _.result(setFoodDetailJson, 'foodLst');
				var foodItemPostKeys = FoodItemKeys;
				var ret = {};

				_.each(foodItemPostKeys, function (k) {
					var v = '';
					switch(k) {
						case 'itemKey':
							v = itemKey;
							break;
						case 'itemType':
							v = Hualala.TypeDef.OrderFoodItemType.ORDER;
							break;
						case 'foodKey':
							v = _.result(foodUnit, 'unitKey');
							break;
						case 'isNeedConfirmFoodNumber':
							v = isNeedConfirmFoodNumber;
							break;
						case 'isSFDetail':
							v = "0";
							break;
						case 'foodNumber':
							v = "1";
							break;
						case 'unit':
							v = _.result(foodUnit, 'unit', '');
							break;
						case 'foodPayPrice':
						case 'foodProPrice':
							v = _.result(foodUnit, 'price', "0");
							break;
						case 'foodVipPrice':
							v = _.result(foodUnit, 'vipPrice', "0");
							break;
						case 'unitAdjuvant':
							v = _.result(food, 'unitAdjuvant', "");
							break;
						case 'unitAdjuvantNumber':
							v = "0";
							break;
						case 'foodSendNumber':
						case 'foodCancelNumber':
							v = "0";
							break;
						case 'parentFoodFromItemKey':
							v = '';
							break;
						case 'makeStatus':
							v = _.result(_.find(Hualala.TypeDef.FoodMakeStatus, function (o) {
									return o.name == 'immediate';
								}), 'value');
							break;
						default :
							v = _.result(food, k, '');
							break;
					}
					ret[k] = v;
				});
				ret['__nodeType'] = '0';
				return ret;
			};

			/**
			 * 生成插入订单列表的套餐详情菜品数据
			 * @param  {[type]} itemKey  [description]
			 * @param  {[type]} food     [description]
			 * @param  {[type]} pItemKey [description]
			 * @return {[type]}          [description]
			 */
			var mapSetFoodDetailItemData = function (itemKey, food, pItemKey) {
				var isNeedConfirmFoodNumber = _.result(food, 'isNeedConfirmFoodNumber', 0),
					foodItemPostKeys = FoodItemKeys;
				var ret = {};
				_.each(foodItemPostKeys, function (k) {
					var v = '';
					switch(k) {
						case 'itemKey':
							v = itemKey;
							break;
						case 'itemType':
							v = Hualala.TypeDef.OrderFoodItemType.ORDER;
							break;
						case 'foodKey':
							v = _.result(food, 'unitKey');
							break;
						case 'isNeedConfirmFoodNumber':
							v = isNeedConfirmFoodNumber;
							break;
						case 'isSFDetail':
						case 'isSetFood':
							v = 1;
							break;
						case 'foodNumber':
							v = _.result(food, 'number', 0);
							break;
						case 'unit':
							v = _.result(food, 'unit', '');
							break;
						case 'foodPayPrice':
						case 'foodProPrice':
						case 'foodVipPrice':
							v = _.result(food, 'addPrice', 0);
							break;
						case 'unitAdjuvant':
							v = _.result(food, 'unitAdjuvant', "");
							break;
						case 'unitAdjuvantNumber':
							v = "0";
							break;
						case 'foodSendNumber':
						case 'foodCancelNumber':
							v = 0;
							break;
						case 'parentFoodFromItemKey':
							v = pItemKey;
							break;
						case 'makeStatus':
							v = '';
							break;
						default :
							v = _.result(food, k, '');
							break;
					}
					ret[k] = v;
				});
				ret['__nodeType'] = '1';
				return ret;
			};

			/**
			 * 生成插入订单列表的菜品作法数据
			 * @param  {[type]} itemKey  [description]
			 * @param  {[type]} item     [description]
			 * @param  {[type]} pItem [description]
			 * @return {[type]}          [description]
			 */
			var mapFoodMethodItemData = function (itemKey, item, pItem) {
				var foodItemPostKeys = FoodItemKeys;
				var ret = {};
				var pItemKey = _.result(pItem, 'itemKey');
				var addPriceType = parseInt(_.result(item, 'addPriceType', 0)),
					addPriceValue = _.result(item, 'addPriceValue', 0),
					notesType = _.result(item, 'notesType'),
					notesName = _.result(item, 'notesName', '');
				var orderPerson = _.result(self._OrderData, 'person', 1),
					pItemFoodNumber = _.result(pItem, 'foodNumber', 0),
					pItemFoodUnit = _.result(pItem, 'unit', '');

				_.each(foodItemPostKeys, function (k) {
					var v = '';
					switch(k) {
						case 'itemKey':
							v = itemKey;
							break;
						case 'itemType':
							v = Hualala.TypeDef.OrderFoodItemType.ORDER;
							break;
						case 'foodKey':
							v = notesType + '-' + addPriceType + '-' + pItemKey;
							break;
						case 'isNeedConfirmFoodNumber':
							v = '';
							break;
						case 'isSetFood':
						case 'isSFDetail':
							v = 0;
							break;
						case 'foodNumber':
							v = addPriceType < 2 ? 1 : (addPriceType == 2 ? pItemFoodNumber : orderPerson);
							// v = _.result(item, 'number', 0);
							break;
						case 'foodProPrice':
						case 'foodPayPrice':
						case 'foodVipPrice':
							v = _.result(item, 'addPriceValue', 0);
							break;
						case 'unitAdjuvant':
							v = _.result(item, 'unitAdjuvant', "");
							break;
						case 'unitAdjuvantNumber':
							v = "0";
							break;
						case 'foodSendNumber':
						case 'foodCancelNumber':
							v = 0;
							break;
						case 'unit':
							v = addPriceType == 0 ? pItemFoodUnit : (addPriceType == 1 ? '项' : (addPriceType == 2 ? pItemFoodUnit : '位'));
							// v = _.result(item, 'unit', '');
							break;
						case 'parentFoodFromItemKey':
							v = pItemKey;
							break;
						case 'makeStatus':
							v = '';
							break;
						case 'foodName':
							v = notesName;
							break;
						default :
							v = _.result(item, k, '');
							break;
					}
					ret[k] = v;
				});
				ret['__nodeType'] = '2';
				return ret;
			};

			/**
			 * 插入一个普通菜品条目
			 * @param  {Object} food 菜单菜品字典中的数据
			 * @return {[type]}      [description]
			 */
			this.insertCommonFoodItem = function (food) {
				// TODO
				// 1. 生成UUID，作为菜品条目ID--itemKey
				// 2. 整理菜品数据，
				// 3. 将整理好的数据注册到OrderFoodHT
				// 4. 将这条新的记录调整到队列首部
				var itemKey = uuid.v4();
				var item = mapFoodItemData(itemKey, food),
					firstItem = self.OrderFoodHT.getFirst(),
					firstKey = _.result(firstItem, 'itemKey', '');
				self.OrderFoodHT.register(itemKey, item);
				self.OrderFoodHT.insertBefore(itemKey, firstKey);
				return item;
			};

			/**
			 * 插入一个套餐菜品条目
			 * @param  {[type]} food [description]
			 * @return {[type]}      [description]
			 */
			this.insertSetFoodItem = function (food) {
				// TODO
				// 1. 生成UUID，作为菜品条目ID--itemKey
				// 2. 整理套餐菜品数据
				// 3. 整理套餐中选定的明细菜品数据
				// 4. 将整理好的套餐菜品数据注册到OrderFoodHT
				// 5. 将这条套餐菜品记录调整到队列首部
				// 6. 将套餐明细菜品数据插入OrderFoodHT
				var itemKey = uuid.v4();
				var item = mapFoodItemData(itemKey, food),
					firstItem = self.OrderFoodHT.getFirst(),
					firstKey = _.result(firstItem, 'itemKey', '');
				var setFoodDetailJson = _.result(food, 'setFoodDetailJson'),
					foodLst = _.result(setFoodDetailJson, 'foodLst', []);
				self.OrderFoodHT.register(itemKey, item);
				self.OrderFoodHT.insertBefore(itemKey, firstKey);
				// 遍历套餐中各个分类
				// 过滤每个分类中选中的菜品
				// 将选中菜品插入到订单列表数据字典中
				_.each(foodLst.reverse(), function (cate) {
					var items = _.result(cate, 'items');
					_.each(items, function (f) {
						var selected = _.result(f, 'selected');
						if (selected == 1) {
							self.insertSetFoodDetailItem(f, item);
						}
					});
				});
				return item;
			};

			/**
			 * 插入套餐详情菜品条目
			 * @param  {[type]} details [description]
			 * @return {[type]}         [description]
			 */
			this.insertSetFoodDetailItem = function (detail, pItem) {
				// TODO
				// 1. 遍历套餐菜品明细数据
				// 2. 为每条套餐明细菜品数据生成UUID，作为条目ID--itemKey
				// 3. 逐条注册到OrderFoodHT
				// 4. 将记录插入到其父节点--套餐菜品之后
				var itemKey = uuid.v4(),
					pItemKey = _.result(pItem, 'itemKey');
				var item = mapSetFoodDetailItemData(itemKey, detail, pItemKey);
				self.OrderFoodHT.register(itemKey, item);
				self.OrderFoodHT.insertAfter(itemKey, pItemKey);
			};

			/**
			 * 插入菜品作法条目
			 * @param  {[type]} item [description]
			 * @return {[type]}      [description]
			 */
			this.insertFoodMethodItem = function (item, pItem) {
				// TODO
				// 1. 获取当前操作菜品条目(parentItem)，并取得itemKey，作为作法条目的parentFoodFromItemKey
				// 2. 将作法配置数据，映射成菜品条目字段
				// 3. 为作法条目数据生成UUID，作为该条目的ID--itemKey
				// 4. 将记录插入到其父节点（当前操作菜品条目）之后
				var itemKey = uuid.v4(),
					pItemKey = _.result(pItem, 'itemKey');
				var item = mapFoodMethodItemData(itemKey, item, pItem);
				self.OrderFoodHT.register(itemKey, item);
				self.OrderFoodHT.insertAfter(itemKey, pItemKey);
			};


			/**
			 * 获取所有订单条目数据
			 * @return {[type]} [description]
			 */
			this.getOrderFoodItemsHT = function () {
				return self.OrderFoodHT;
			};


			/**
			 * 根据itemKey获取订单条目数据
			 * @param  {[type]} itemKey [description]
			 * @return {[type]}         [description]
			 */
			this.getOrderFoodItemByItemKey = function (itemKey) {
				return self.OrderFoodHT.get(itemKey);
			};

			/**
			 * 根据记录的itemKey，查找该条记录的所有子记录
			 * @param  {[type]} itemKey [description]
			 * @return {[type]}         [description]
			 */
			this.getOrderChildrenItemsByItemKey = function (itemKey) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey);
				var ret;
				if (_.isEmpty(item) || itemType.isFoodMethod) return null;
				if (itemType.isCommonFood || itemType.isSetFoodDetail) {
					ret = _.filter(self.OrderFoodHT.getAll(), function (el) {
						return _.result(el, 'parentFoodFromItemKey') == itemKey;
					});
				} else if (itemType.isSetFood) {
					ret = _.filter(self.OrderFoodHT.getAll(), function (el) {
						return _.result(el, 'parentFoodFromItemKey') == itemKey;
					});
					ret = _.map(ret, function (el) {
						var k = _.result(el, 'itemKey');
						return [el, self.getOrderChildrenItemsByItemKey(k)];
					});
				}
				return _.flatten(ret);
			};

			/**
			 * 删除订单条目记录
			 * 只有未落单的条目可以删除
			 * 根据条目类型进行删除：
			 * 普通菜品--删除自身，同时删除其作法条目
			 * 普通菜品作法条目--删除自身
			 * 套餐菜品--删除自身，同时删除其所有子节点（作法、套餐详情菜品、套餐详情菜品作法）
			 * 套餐作法条目--删除自身
			 * 套餐详情菜品--删除自身，同时删除其作法子节点
			 * 套餐详情作法--删除自身
			 * @param  {[type]} itemKey [description]
			 * @return {[type]}         [description]
			 */
			this.deleteOrderItem = function (itemKey) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', 0);
				if (printStatus != 0) return;

				var childItems = this.getOrderChildrenItemsByItemKey(itemKey);

				self.OrderFoodHT.remove(itemKey);
				_.each(childItems, function (el) {
					self.OrderFoodHT.remove(_.result(el, 'itemKey'));
				});
			};

			/**
			 * 更新订单条目的数量
			 * @param  {String} itemKey 条目的itemKey
			 * @param  {Number} step    加、减
			 * @param {Number} count  直接更新数量
			 * @return {Object} 条目数据         
			 */
			this.updateOrderItemCount = function (itemKey, step, count) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', "0"),
					isNeedConfirmFoodNumber = _.result(item, 'isNeedConfirmFoodNumber', "0");
				step = parseFloat(step);
				count = parseFloat(count);
				if (printStatus != 0 && isNeedConfirmFoodNumber == 0) return;
				if (step > 0) {
					// 加数量
					item.foodNumber = parseFloat(item.foodNumber) + step;
				} else if (step < 0) {
					// 减数量
					item.foodNumber = parseFloat(item.foodNumber) + step;
				} else if(step == 0 && count >= 0) {
					item.foodNumber = count;
				}
				if (item.foodNumber <= 0) {
					// 删除记录
					self.deleteOrderItem(itemKey);
					return null;
				}
				// 1. 如果当前条目为普通菜品主条目
				// 	改变主条目的数量
				// 	同时查找主条目下的作法子条目
				// 	如果有作法子条目并且是按数量加价的作法
				// 	更新作法子条目的数量
				// 2. 如果当前条目为套餐菜品主条目
				// 	改变主条目数量
				// 	同时查找主条目下的所有子条目
				// 	如果子条目为套餐明细菜品
				// 	更新套餐明细菜品数量
				// 	如果子条目是套餐主条目的作法节点，并且是按量加价类型的作法
				// 	更新作法子条目的数量
				// 	如果子条目是套餐明细菜品的作法子条目，并且是按量加价类型的作法
				// 	更新作法子条目的数量
				// 
				var childrenItems = self.getOrderChildrenItemsByItemKey(itemKey);
				_.each(childrenItems, function (child) {
					var childItemKey = _.result(child, 'itemKey'),
						childType = self.orderFoodItemType(childItemKey),
						parentFoodFromItemKey = _.result(child, 'parentFoodFromItemKey'),
						addPriceType = null;
					if (itemType.isCommonFood) {
						addPriceType = _.result(child, 'foodKey', '').split('-')[1];
						if (childType.isFoodMethod && addPriceType == 2) {
							// child['foodNumber'] = item.foodNumber;
							self.updateOrderItemCount(childItemKey, 0, _.result(item, 'foodNumber', 0));
						}
					} else if (itemType.isSetFood) {
						addPriceType = _.result(child, 'foodKey', '').split('-')[1];
						if (childType.isFoodMethod && parentFoodFromItemKey == itemKey && addPriceType == 2) {
							// child['foodNumber'] = item.foodNumber;
							self.updateOrderItemCount(childItemKey, 0, _.result(item, 'foodNumber', 0));
						} else if (childType.isSetFoodDetail) {
							self.updateOrderItemCount(childItemKey, 0, _.result(item, 'foodNumber', 0));
						} else if (childType.isFoodMethod && parentFoodFromItemKey != itemKey && addPriceType == 2) {
							var _pItem = self.getParentFoodItemByItemKey(childItemKey);
							self.updateOrderItemCount(childItemKey, 0, _.result(_pItem, 'foodNumber', 0));
						}
					}
				});
				
				
				return item;
			};


			/**
			 * 设置赠菜原因和数量
			 * @param  {[type]} itemKey    [description]
			 * @param  {[type]} sendNumber [description]
			 * @param  {[type]} sendReason [description]
			 * @return {[type]}            [description]
			 */
			this.sendOrderFoodItem = function (itemKey, sendNumber, sendReason) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', 0);
				var callServer = null;
				if (itemType.isFoodMethod || itemType.isNotExist) return;
				item.foodSendNumber = sendNumber;
				item.sendReason = sendReason;
				if (printStatus != 0) {
					// TODO 已落单菜品修改赠送， 更新数据字典后，要直接提交，并刷新订单数据
					callServer = self.foodOperation('ZC', [itemKey]);
				}
				return callServer;
			};

			/**
			 * 设置退菜原因和数量
			 * @param  {[type]} itemKey      [description]
			 * @param  {[type]} cancelNumber [description]
			 * @param  {[type]} cancelReason [description]
			 * @return {[type]}              [description]
			 */
			this.cancelOrderFoodItem = function (itemKey, cancelNumber, cancelReason) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', 0); 
				var callServer = null;
				if (itemType.isFoodMethod || itemType.isNotExist) return;
				item.foodCancelNumber = cancelNumber;
				item.cancelReason = cancelReason;
				if (printStatus != 0) {
					// TODO 已落单菜品修改退菜， 更新数据字典后，要直接提交，并刷新订单数据
					callServer = self.foodOperation('TC', [itemKey]);
				}
				return callServer;
			};

			/**
			 * 设置菜品口味
			 * @param  {[type]} itemKey    [description]
			 * @param  {[type]} foodRemark [description]
			 * @return {[type]}            [description]
			 */
			this.updateOrderFoodRemark = function (itemKey, foodRemark) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', 0); 
				if (itemType.isFoodMethod || itemType.isNotExist) return;
				item['foodRemark'] = foodRemark;
				
			};

			
			/**
			 * 根据菜品条目的itemKey获取这条菜品的作法节点
			 * @param  {[type]} itemKey [description]
			 * @return {[type]}         [description]
			 */
			this.getOrderFoodMethodItem = function (itemKey) {
				var childItems = self.getOrderChildrenItemsByItemKey(itemKey);
				var methodItem = _.find(childItems, function (item) {
					var parentFoodFromItemKey = _.result(item, 'parentFoodFromItemKey'),
						k = _.result(item, 'itemKey'),
						itemType = self.orderFoodItemType(k);
					return parentFoodFromItemKey == itemKey && itemType.isFoodMethod;
				});
				return methodItem;
			};

			/**
			 * 设置菜品作法
			 * 1.查找当前菜品下是否有作法子节点
			 * 2.如果没有作法，直接插入作法子节点
			 * 3.如果有作法，删除作法子节点
			 * @param  {[type]} itemKey    [description]
			 * @param  {Object} methodSetting 作法配置数据 
			 *         methodSetting : {addPriceType,addPriceValue,notesName,notesType}
			 * @return {[type]}            [description]
			 */
			this.updateOrderFoodMethod = function (itemKey, methodSetting) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', "0"),
					_methodItem = self.getOrderFoodMethodItem(itemKey); 
				if (itemType.isNotExist) return;
				// TODO 判断菜品是否有作法节点，如果有，删除作法节点
				if (!_.isEmpty(_methodItem)) {
					self.deleteOrderItem(_.result(_methodItem, 'itemKey'));
				}
				self.insertFoodMethodItem(methodSetting, item);
			};

			/**
			 * 设置菜品改价
			 * @param  {[type]} itemKey   [description]
			 * @param  {[type]} foodPrice [description]
			 * @param  {[type]} priceNote [description]
			 * @return {[type]}           [description]
			 */
			this.updateOrderFoodPrice = function (itemKey, foodPrice, priceNote) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', "0"); 
				var callServer = null;
				if (itemType.isNotExist) return;
				// 更新菜品modifyReason字段作为改价原因；更新菜品foodPayPrice作为修改后价格
				item.modifyReason = priceNote;
				item.foodPayPrice = foodPrice;
				item.foodProPrice = foodPrice;
				item.foodVipPrice = foodPrice;
				if (printStatus != 0) {
					// TODO 已落单菜品改价，更新菜品数据字典后，要直接提交，并刷新订单数据
					callServer = self.foodOperation('GJ', [itemKey]);
				}
				return callServer;
			};

			/**
			 * 获取订单备注信息
			 * @return {[type]} [description]
			 */
			this.getOrderRemark = function () {
				return _.result(self._OrderData, 'allFoodRemark', '');
			};

			/**
			 * 设置单注信息
			 * @param  {[type]} allFoodRemark [description]
			 * @return {[type]}             [description]
			 */
			this.updateOrderRemark = function (allFoodRemark) {
				self._OrderData['allFoodRemark'] = allFoodRemark;
			};

			/**
			 * 落单操作
			 * @return {[type]} [description]
			 */
			this.submitOrder = function (actionType) {
				var params = {};
				var foodItemPostKeys = FoodItemKeys,
					postKeys = 'actionType,submitBatchNo,orderJson'.split(','),
					orderKeys = 'saasOrderKey,empCode,empName,bizModel,allFoodRemark,foodLst'.split(','),
					checkoutKeys = 'serviceAmount,packAmount,discountRate,discountRange,isVipPrice,promotionDesc,invoiceTitle,invoiceAmount,payLst'.split(','),
					payKeys = 'paySubjectKey,paySubjectCode,paySubjectName,debitAmount,giftItemNoLst,payRemark,payTransNo'.split(','),
					orderHeaderKeys = 'tablename,channelKey,channelName,orderSubType,person,userName,userSex,userMobile,userAddress,saasOrderRemark'.split(',');
				var empInfo = storage.get("EMPINFO"),
					empName = _.result(empInfo, 'empName'),
					empCode = _.result(empInfo, 'empCode');
				var shopInfo = storage.get("SHOPINFO"),
					operationMode = _.result(shopInfo, 'operationMode');
				var orderHeader = self.getOrderHeaderData(),
					allFoodRemark = self.getOrderRemark();
				var saasOrderKey = self.getSaasOrderKey(),
					foodLst = _.filter(self.OrderFoodHT.getAll(), function (food) {
						var printStatus = _.result(food, 'printStatus');
						// 过滤出所有未落单菜品
						return printStatus != 2;
					}),
					// 如果存在未落单菜品需要落单，需要给出批次号（UUID）
					submitBatchNo = foodLst.length > 0 ? uuid.v4() : '';
				if (foodLst.length == 0) return null;

				// 过滤出落单需要的订单条目数据
				foodLst = _.map(foodLst, function (food) {
					return _.pick(food, foodItemPostKeys);
				});
				// 过滤出落单需要的单头信息
				orderHeader = _.pick(orderHeader, orderHeaderKeys);

				var orderJson = _.extend({
					saasOrderKey : saasOrderKey,
					empCode : empCode,
					empName : empName,
					bizModel : operationMode,
					allFoodRemark : allFoodRemark
				}, orderHeader, {
					foodLst : foodLst
				});
				orderJson = Hualala.Common.formatPostData(orderJson);

				params = _.extend(params, {
					actionType : actionType,
					submitBatchNo : submitBatchNo
				}, {
					orderJson : JSON.stringify(orderJson)
				});
				params = Hualala.Common.formatPostData(params);

				IX.Debug.info("Current Post Order Data:");
				IX.Debug.info(params);
				IX.Debug.info(JSON.stringify(params));
				var callServer = CommonCallServer.submitOrder(params);
				callServer.success(function (data) {
					self.removeCurrentSuspendedOrder();
				});
				return callServer;
			};

			/**
			 * 落单菜品条目的操作
			 * @param  {[type]} actionType [description]
			 * @param  {[type]} itemKeys    [description]
			 * @return {[type]}            [description]
			 */
			this.foodOperation = function (actionType, itemKeys) {
				itemKeys = _.isString(itemKeys) ? [itemKeys] : itemKeys;
				var saasOrderKey = self.getSaasOrderKey();
				var foodLst = _.map(itemKeys, function (itemKey) {
					var item = self.getOrderFoodItemByItemKey(itemKey),
						remark = '',
						foodNumber = '',
						modifyFoodPrice = '';
					var params = {};
					switch(actionType) {
						case "GJ":
							modifyFoodPrice = _.result(item, 'foodPayPrice', "0");
							remark = _.result(item, 'modifyReason', "");
							break;
						case "TC":
							foodNumber = _.result(item, 'foodCancelNumber', "0");
							remark = _.result(item, 'cancelReason', "");
							break;
						case "ZC":
							foodNumber = _.result(item, 'foodSendNumber', "0");
							remark = _.result(item, 'sendReason', "");
							break;
					}
					params = _.extend(params, {
						itemKey : itemKey,
						modifyFoodPrice : modifyFoodPrice,
						foodNumber : foodNumber,
						remark : remark
					});
					return params;
				});
				var postData = {
					actionType : actionType,
					saasOrderKey : saasOrderKey,
					foodLst : foodLst
				};
				IX.Debug.info("Current Food Operation Post Data:");
				IX.Debug.info(postData);
				return CommonCallServer.foodOperation(postData);
			};
			
			/**
			 * 挂单操作
			 * 将当前订单实例数据缓存到localstorage中
			 * 
			 * @return {[type]} [description]
			 */
			this.suspendOrder = function () {
				var order = self._OrderData,
					foodLst = self.OrderFoodHT.getAll();
				
				var catchID = _.result(order, '__catchID');
				catchID = _.isEmpty(catchID) ? uuid.v4() : catchID;
				order = _.extend(order, {
					foodLst : foodLst,
					__catchID : catchID
				});
				if (foodLst.length == 0) return;
				IX.Debug.info("Current Order Data:");
				IX.Debug.info(order);
				var ordersCatch = storage.get('OrderCatch');
				if (_.isEmpty(ordersCatch)) {
					ordersCatch = [];
				}
				var curCatch = _.find(ordersCatch, function (el) {
					return el['__catchID'] == catchID;
				});
				if (!_.isEmpty(curCatch)) {
					ordersCatch = _.reject(ordersCatch, function (el) {
						return el['__catchID'] == catchID;
					});
				}
				ordersCatch.push(order);
				storage.set('OrderCatch', ordersCatch);
				self.initOrderFoodDB();

			};

			/**
			 * 清除localStorage中当前订单的挂单数据
			 * @return {[type]} [description]
			 */
			this.removeCurrentSuspendedOrder = function () {
				var order = self._OrderData,
					catchID = _.result(order, '__catchID');
				var ordersCatch = storage.get('OrderCatch');
				if (_.isEmpty(catchID) || _.isEmpty(ordersCatch)) return;
				ordersCatch = _.reject(ordersCatch, function (el) {
					return el['__catchID'] == catchID;
				});
				storage.set('OrderCatch', ordersCatch);
			};

			/**
			 * 提单操作
			 * 将当前localStorage中缓存的订单实例数据提取出来
			 * 1.将当前操作订单数据缓存到localStorage中（挂单）
			 * 2.从本地缓存中提取订单数据，更新订单数据
			 * 3.从本地缓存中删除提取出来的订单数据
			 * @return {[type]} [description]
			 */
			this.pickOrder = function (catchID) {
				var ordersCatch = storage.get('OrderCatch') || [];
				var curOrderCatch = _.find(ordersCatch, function (el) {
					return el['__catchID'] == catchID;
				});
				self.suspendOrder();
				self.initOrderFoodDB(curOrderCatch);
				self.removeCurrentSuspendedOrder();
			};

		}]
	);

	// 订单附加信息字典服务
	// 10：点单备注；20：作法；30：口味；40：退菜原因；50：赠菜原因；
	// 60：改价原因；70：改单原因；80：预定退订原因；90：外卖退单原因
	app.service('OrderNoteService',[
		'$rootScope', '$location', '$filter', '$sanitize', '$sce', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, $sanitize, $sce, storage, CommonCallServer) {
			IX.ns("Hualala");
			var self = this;
			var OrderNoteTypes = Hualala.TypeDef.OrderNoteTypes;
			self.OrderNoteDict = _.indexBy(OrderNoteTypes, 'value');

			/**
			 * 清空订单附加信息字典数据
			 * @return {[type]} [description]
			 */
			this.clearOrderNoteDict = function () {
				_.each(self.OrderNoteDict, function (o) {
					if (o.items) {
						o.items = [];
					}
				});
			};

			/**
			 * 初始化订单附加信息字典数据
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			this.initOrderNoteDictDB = function (data) {
				var _data = _.groupBy(data, 'notesType');
				self.OrderNoteDict = _.mapObject(self.OrderNoteDict, function (v, k) {
					return _.extend(v, {
						items : _.map(_data[k], function (el) {
							var label = _.result(el, 'notesName', '');
							return _.extend(el, {
								label : label,
								value : label
							});
						})
					});
				});
			};
			
			/**
			 * 获取所有字典数据
			 * @param  {[type]} params  [description]
			 * @param  {[type]} success [description]
			 * @param  {[type]} error   [description]
			 * @return {[type]}         [description]
			 */
			this.getOrderNotesLst = function (params, success, error) {
				return CommonCallServer.getOrderNotesLst(params)
					.success(function (data, status, headers, config) {
						var ret = _.result(data, 'data', {});
						self.clearOrderNoteDict();
						self.initOrderNoteDictDB(_.result(ret, 'records', []));
						_.isFunction(success) && success(data, status, headers, config);
					})
					.error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 根据备注类型，获取字典数据
			 * @param  {[type]} notesType [description]
			 * @return {[type]}           [description]
			 */
			this.getOrderNotesByNotesType = function (notesType) {
				var ret = self.OrderNoteDict[notesType];
				return ret;
			};

			/**
			 * 获取赠菜原因字典数据
			 * @return {[type]} [description]
			 */
			this.getSendFoodReasonNotes = function () {
				return self.getOrderNotesByNotesType(50);
			};

			/**
			 * 获取退菜原因字典数据
			 * @return {[type]} [description]
			 */
			this.getCancelFoodReasonNotes = function () {
				return self.getOrderNotesByNotesType(40);
			};

			/**
			 * 获取菜品口味字典数据
			 * @return {[type]} [description]
			 */
			this.getFoodRemarkNotes = function () {
				return self.getOrderNotesByNotesType(30);
			};

			/**
			 * 获取菜品作法字典数据
			 * @return {[type]} [description]
			 */
			this.getFoodMethodNotes = function () {
				var noteData = self.getOrderNotesByNotesType(20);
				noteData = _.extend(noteData, {
					items : _.map(_.result(noteData, 'items', []), function (el) {
						var label = _.result(el, 'notesName', ''),
							addPriceType = _.result(el, 'addPriceType', 0),
							addPriceValue = _.result(el, 'addPriceValue', 0);
						var txt = '<p>' + label + '</p>';
						if (addPriceType == 1) {
							txt += '<p>加价￥' + addPriceValue + '</p>';
						} else if (addPriceType == 2) {
							txt += '<p>加价￥' + addPriceValue + '/份</p>';
						} else if (addPriceType == 3) {
							txt += '<p>加价￥' + addPriceValue + '/人</p>';
						}

						return _.extend(el, {
							label : txt
						});
					})
				});
				return self.getOrderNotesByNotesType(20);
			};

			/**
			 * 获取菜品改价原因数据字典
			 * @return {[type]} [description]
			 */
			this.getModifyPriceNotes = function () {
				return self.getOrderNotesByNotesType(60);
			};

			/**
			 * 获取单注数据字典
			 * @return {[type]} [description]
			 */
			this.getOrderRemarkNotes = function () {
				return self.getOrderNotesByNotesType(10);
			};
		}
	]);
});