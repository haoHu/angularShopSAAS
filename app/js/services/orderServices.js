define(['app', 'uuid'], function (app, uuid) {
	// 订单数据服务
	app.service('OrderService', 
		['$rootScope', '$location', '$filter', 'storage', 'CommonCallServer', 'OrderChannel', function ($rootScope, $location, $filter, storage, CommonCallServer, OrderChannel) {
			IX.ns('Hualala');
			var self = this;
			this._OrderData = null;
			this.OrderFoodHT = null;
			this.FJZFlag = '';

			var OrderHeaderKeys = 'saasOrderKey,saasOrderNo,saasOrderRemark,saasDeviceOrderNo,timeNameStart,timeNameCheckout,tableName,selfWay,channelKey,channelName,channelOrderKey,cardNo,orderSubType,person,createBy,startTime,userName,userAddress,userMobile,reportDate,his'.split(','),
				FoodItemKeys = 'itemKey,itemType,isSetFood,isSFDetail,isTempFood,isDiscount,isNeedConfirmFoodNumber,foodKey,foodName,foodNumber,foodSendNumber,sendReason,unit,foodProPrice,foodPayPrice,foodVipPrice,foodRemark,modifyReason,parentFoodFromItemKey,makeStatus,unitAdjuvant,unitAdjuvantNumber'.split(','),
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
				self._OrderData = _.isEmpty(data) ? {} : data;
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
			 * 获取订单数据
			 * @return {[type]} [description]
			 */
			this.getOrderData = function () {
				return self._OrderData;
			};

			/**
			 * 获取订单条目字典
			 * @return {[type]} [description]
			 */
			this.getOrderFoodHT = function () {
				return self.OrderFoodHT;
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
							case "channelKey":
							case "channelName":
								var defaultChannel = OrderChannel.getAll()[0];
								v = _.result(defaultChannel, k, '');
								break;
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
					isNeedConfirmFoodNumber = _.result(food, 'isNeedConfirmFoodNumber', "0"),
					isDiscount = _.result(food, 'isDiscount', "0"),
					isSetFood = _.result(food, 'isSetFood', "0"),
					isTempFood = _.result(food, 'isTempFood', "0"),
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
							// v = _.result(foodUnit, 'unitKey');
							v = _.result(food, 'foodKey');
							break;
						case 'isDiscount':
							v = isDiscount;
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
				var isNeedConfirmFoodNumber = _.result(food, 'isNeedConfirmFoodNumber', "0"),
					isDiscount = _.result(food, 'isDiscount', "0"),
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
							// v = _.result(food, 'unitKey');
							v = _.result(food, 'foodKey');
							break;
						case 'isNeedConfirmFoodNumber':
							v = isNeedConfirmFoodNumber;
							break;
						case 'isDiscount':
							v = isDiscount;
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
				// 向子窗口推送新加菜品的消息
				Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
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
							// if (!_.isEmpty(_.result(f, 'remark'))) {
							// 	self.updateOrderFoodRemark(f.unitKey, f.remark.notesName);
							// }
						}
					});
				});
				// 向子窗口推送新加菜品的消息
				Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
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
				if (!_.isEmpty(_.result(detail, 'remark'))) {
					self.updateOrderFoodRemark(itemKey, detail.remark.notesName);
				}
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
				// 向子窗口推送新加菜品的消息
				Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
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
				// 向子窗口推送新加菜品的消息
				Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
			};

			/**
			 * 更新订单条目的数量
			 * @param  {String} itemKey 条目的itemKey
			 * @param  {Number} step    加、减
			 * @param {Number} count  直接更新数量
			 * @return {Object} 条目数据         
			 */
			this.updateOrderItemCount = function (itemKey, step, count, empInfo) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', "0"),
					isNeedConfirmFoodNumber = _.result(item, 'isNeedConfirmFoodNumber', "0");
				var callServer = null;
				var publishMsg = function () {
					// 向子窗口推送新加菜品的消息
					Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
				};
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
				if (printStatus != 0 && isNeedConfirmFoodNumber != 0) {
					// 已落单并且需要确认数量的菜品，需要进行确认数量的菜品操作服务
					callServer = self.foodOperation('QRSL', [itemKey], empInfo);
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
				if (!_.isEmpty(callServer)) {
					callServer.success(function (data) {
						publishMsg();
					});
				} else {
					publishMsg();
				}
				
				return _.isEmpty(callServer) ? item : {
					callServer : callServer,
					item : item
				};
			};

			/**
			 * 跟新订单条目确认数量标记
			 * @return {[type]} [description]
			 */
			this.updateOrderItemNeedConfirmFoodNumberFlag = function (itemKey, flag) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', "0"),
					isNeedConfirmFoodNumber = _.result(item, 'isNeedConfirmFoodNumber', "0");
				item.isNeedConfirmFoodNumber = flag || 0;
			};

			/**
			 * 获取待确认数量订单条目
			 * @return {[type]} [description]
			 */
			this.getNeedConfirmFoodNumberItems = function () {
				var items = self.OrderFoodHT.getAll();
				items = _.filter(items, function (food) {
					return _.result(food, 'isNeedConfirmFoodNumber') != 0;
				});
				return items;
			};

			/**
			 * 设置菜品制作状态
			 * @param  {[type]} itemKey    [description]
			 * @param  {[type]} makeStatus 0:等叫; 1:即起; 2:加急; 3:已上菜;
			 * @return {[type]}            [description]
			 */
			this.updateOrderItemMakeStatus = function (itemKey, makeStatus) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', 0);
				if (itemType.isFoodMethod || itemType.isNotExist || itemType.isSetFoodDetail || printStatus != 0) return;
				item.makeStatus = makeStatus;
				return item;
			};


			/**
			 * 设置赠菜原因和数量
			 * @param  {[type]} itemKey    [description]
			 * @param  {[type]} sendNumber [description]
			 * @param  {[type]} sendReason [description]
			 * @return {[type]}            [description]
			 */
			this.sendOrderFoodItem = function (itemKey, sendNumber, sendReason, empInfo) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', 0);
				var callServer = null;
				var publishMsg = function () {
					// 向子窗口推送新加菜品的消息
					Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
				};
				if (itemType.isFoodMethod || itemType.isNotExist) return;
				item.foodSendNumber = sendNumber;
				item.sendReason = sendReason;
				if (printStatus != 0) {
					// TODO 已落单菜品修改赠送， 更新数据字典后，要直接提交，并刷新订单数据
					callServer = self.foodOperation('ZC', [itemKey], empInfo);
				}
				if (callServer) {
					callServer.success(function (data) {
						publishMsg();
					});
				} else {
					publishMsg();
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
			this.cancelOrderFoodItem = function (itemKey, cancelNumber, cancelReason, empInfo) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', 0); 
				var callServer = null;
				var publishMsg = function () {
					// 向子窗口推送新加菜品的消息
					Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
				};
				if (itemType.isFoodMethod || itemType.isNotExist) return;
				item.foodCancelNumber = cancelNumber;
				item.cancelReason = cancelReason;
				if (printStatus != 0) {
					// TODO 已落单菜品修改退菜， 更新数据字典后，要直接提交，并刷新订单数据
					callServer = self.foodOperation('TC', [itemKey], empInfo);
				}
				if (callServer) {
					callServer.success(function (data) {
						publishMsg();
					});
				} else {
					publishMsg();
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
				// 向子窗口推送新加菜品的消息
				Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
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
				// 向子窗口推送新加菜品的消息
				Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
			};

			/**
			 * 设置菜品改价
			 * @param  {[type]} itemKey   [description]
			 * @param  {[type]} foodPrice [description]
			 * @param  {[type]} priceNote [description]
			 * @return {[type]}           [description]
			 */
			this.updateOrderFoodPrice = function (itemKey, foodPrice, priceNote, empInfo) {
				var item = self.OrderFoodHT.get(itemKey),
					itemType = self.orderFoodItemType(itemKey),
					printStatus = _.result(item, 'printStatus', "0"); 
				var callServer = null;
				var publishMsg = function () {
					// 向子窗口推送新加菜品的消息
					Hualala.SecondScreen.publishPostMsg('OrderDetail', self.getOrderPublishData());
				};
				if (itemType.isNotExist) return;
				// 更新菜品modifyReason字段作为改价原因；更新菜品foodPayPrice作为修改后价格
				item.modifyReason = priceNote;
				item.foodPayPrice = foodPrice;
				item.foodProPrice = foodPrice;
				item.foodVipPrice = foodPrice;
				if (printStatus != 0) {
					// TODO 已落单菜品改价，更新菜品数据字典后，要直接提交，并刷新订单数据
					callServer = self.foodOperation('GJ', [itemKey], empInfo);
				}
				if (callServer) {
					callServer.success(function (data) {
						publishMsg();
					});
				} else {
					publishMsg();
				}
				return callServer;
			};

			/**
			 * 催叫菜操作
			 * @param  {[type]} itemKeys [description]
			 * @return {[type]}          [description]
			 */
			this.urgeOrderFood = function (itemKeys, empInfo) {
				var callServer = null;
				callServer = self.foodOperation('CJC', itemKeys, empInfo);
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
			 * 获取发布给子屏幕的订单数据
			 * @return {[type]} [description]
			 */
			this.getOrderPublishData = function () {
				var saasOrderKey = self.getSaasOrderKey(),
					foodLst = self.OrderFoodHT.getAll(),
					orderHeader = self.getOrderHeaderData();
				return _.extend({
					saasOrderKey : saasOrderKey,
					foodLst : foodLst
				}, orderHeader);
			};

			/**
			 * 落单操作
			 * @return {[type]} [description]
			 */
			this.submitOrder = function (actionType, payParams, tmpEMP) {
				var params = {};
				var foodItemPostKeys = FoodItemKeys,
					postKeys = 'actionType,submitBatchNo,orderJson'.split(','),
					orderKeys = 'saasOrderKey,empCode,empName,bizModel,allFoodRemark,foodLst'.split(','),
					checkoutKeys = 'discountRate,discountRange,isVipPrice,moneyWipeZeroType,promotionAmount,promotionDesc,invoiceTitle,invoiceAmount,payLst'.split(','),
					payKeys = 'paySubjectKey,paySubjectCode,paySubjectName,debitAmount,giftItemNoLst,payRemark,payTransNo'.split(','),
					orderHeaderKeys = 'tableName,channelKey,channelName,orderSubType,person,userName,userSex,userMobile,userAddress,saasOrderRemark'.split(',');
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
					payLst = _.result(payParams, 'payLst'),
					// 如果存在未落单菜品需要落单，需要给出批次号（UUID）
					submitBatchNo = foodLst.length > 0 ? uuid.v4() : '';
				if (foodLst.length == 0 && actionType == "LD") return null;
				if (actionType == "JZ" && _.isEmpty(payLst)) return null;

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
				}, (_.isEmpty(self.FJZFlag) ? {} : {FJZFlag : self.FJZFlag}));
				if (actionType == 'JZ' || actionType == 'YJZ') {
					orderJson = _.extend(orderJson, payParams);
				}
				orderJson = Hualala.Common.formatPostData(orderJson);

				params = _.extend(params, {
					actionType : actionType,
					submitBatchNo : submitBatchNo
				}, {
					orderJson : JSON.stringify(orderJson)
				}, _.isEmpty(tmpEMP) ? null : tmpEMP);
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
			this.foodOperation = function (actionType, itemKeys, empInfo) {
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
						case "CJC":
							modifyFoodPrice = 0;
							foodNumber = 0;
							remark = "";
							break;
						case "QRSL":
							foodNumber = _.result(item, 'foodNumber', "0");
							remark = "";
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
					// foodLst : foodLst
					foodLst : JSON.stringify(Hualala.Common.formatPostData({foodLst : foodLst})),
					hisFlag : _.result(self._OrderData, 'his', 0)
				};
				if (!_.isEmpty(self.FJZFlag)) {
					_.extend(postData, {
						FJZFlag : self.FJZFlag
					});
				}
				IX.Debug.info("Current Food Operation Post Data:");
				IX.Debug.info(postData);
				return CommonCallServer.foodOperation(_.extend(postData, empInfo))
					.success(function (data) {
						var _data = _.result(data, 'data'),
							foodLst = _.result(_data, 'foodLst');
						_.each(foodLst, function (food) {
							var isNeedConfirmFoodNumber = _.result(food, 'isNeedConfirmFoodNumber', '0'),
								itemKey = _.result(food, 'itemKey');
							self.updateOrderItemNeedConfirmFoodNumberFlag(itemKey, isNeedConfirmFoodNumber);
						});
					});
			};

			/**
			 * 订单桌台操作
			 * @param  {[type]} actionType [description]
			 * @param  {[type]} params     {fromTableName,toTableName,person,saasOrderRemark,foodItemKeyLst}
			 * @return {[type]}            [description]
			 */
			this.tableOperation = function (actionType, params) {
				var orderHeader = self.getOrderHeaderData();
				var postData = _.extend({
					actionType : actionType,
					person : _.result(orderHeader, 'person', 1),
					saasOrderRemark : _.result(orderHeader, 'saasOrderRemark', '')
				}, params);
				return CommonCallServer.tableOperation(postData);
			};
			
			/**
			 * 挂单操作
			 * 将当前订单实例数据缓存到localstorage中
			 * 
			 * @return {[type]} [description]
			 */
			this.suspendOrder = function (successFn, failFn) {
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
				if (ordersCatch.length == 3) {
					failFn();
					return ;
				}
				ordersCatch.push(order);
				storage.set('OrderCatch', ordersCatch);
				self.initOrderFoodDB();
				successFn();
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
			this.pickOrder = function (catchID, successFn, failFn) {
				var ordersCatch = storage.get('OrderCatch') || [];
				var curOrderCatch;
				// var curOrderCatch = _.find(ordersCatch, function (el) {
				// 	return el['__catchID'] == catchID;
				// });
				ordersCatch = _.filter(ordersCatch, function (el) {
					var matched = el['__catchID'] == catchID;
					if (matched == true) {
						curOrderCatch = el;
					}
					return !matched;
				});
				storage.set('OrderCatch', ordersCatch);
				self.suspendOrder(successFn, failFn);
				self.initOrderFoodDB(curOrderCatch);
				self.removeCurrentSuspendedOrder();
			};

			/**
			 * 清空订单数据
			 * @return {[type]} [description]
			 */
			this.clear = function () {
				self._OrderData = null;
				self.FJZFlag = '';
				if (self.OrderFoodHT) {
					self.OrderFoodHT.clear();
				} else {
					self.OrderFoodHT = new IX.IListManager();
				}

			};

			/**
			 * 获取未落单订单条目
			 * @return {[type]} [description]
			 */
			this.getUnorderedItems = function () {
				var items = self.OrderFoodHT.getAll();
				items = _.filter(items, function (item) {
					return _.result(item, 'printStatus') != '2';
				});
				return items;
			};

			/**
			 * 更新反结账标志
			 * @param  {[type]} flag [description]
			 * @return {[type]}      [description]
			 */
			this.updateFJZFlag = function (flag) {
				self.FJZFlag = flag || '';
			};

			/**
			 * 账单审核
			 * @return {[type]} [description]
			 */
			this.orderAudit = function (empInfo) {
				return CommonCallServer.orderAudit(_.extend({
					saasOrderKey : _.result(self._OrderData, 'saasOrderKey'),
					hisFlag : _.result(self._OrderData, 'his', 0)
				}, empInfo));
			};

			/**
			 * 更改账单发票信息
			 * @return {[type]} [description]
			 */
			this.updateOrderInvoice = function (params) {
				return CommonCallServer.updateOrderInvoice(_.extend({
					saasOrderKey : _.result(self._OrderData, 'saasOrderKey'),
					hisFlag : _.result(self._OrderData, 'his', 0)
				}, params));
			};

			/**
			 * 订单作废操作
			 * @return {[type]} [description]
			 */
			this.abolishOrder = function (remark, empInfo) {
				var saasOrderKey = _.result(self._OrderData, 'saasOrderKey');
				return CommonCallServer.submitOrder(_.extend({
					actionType : 'ZF',
					orderJson : JSON.stringify({
						saasOrderKey : saasOrderKey,
						saasOrderRemark : remark
					})
				}, empInfo));
			};

			/**
			 * 订单其他操作
			 * @param  {String} actionType 操作类型：DYYJD 打印预结账单；CKZDZT	查看订单状态
			 * @return {Object}            Promise
			 */
			this.orderOtherOperation = function (actionType) {
				var saasOrderKey = self.getSaasOrderKey();
				// 如果是查看订单状态，
				// 返回数据：
				// orderStatus--20：待结账；30：已作废；40：已结账
				// isCanCheckout--0:不能；1：能
				// cannotCheckoutRemark--账单不能结账说明
				return CommonCallServer.orderOtherOperation({
					saasOrderKey : saasOrderKey,
					actionType : actionType
				});
			};
		}]
	);

	// 订单支付服务
	app.service('OrderPayService', [
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer', 'OrderService', 'PaySubjectService', 'OrderDiscountRuleService',
		function ($rootScope, $location, $filter, storage, CommonCallServer, OrderService, PaySubjectService, OrderDiscountRuleService) {
			IX.ns('Hualala');
			var HCMath = Hualala.Common.Math;
			var self = this;
			this._OrderData = null;
			this.OrderFoodHT = null;
			var paySubjectGrpLst = null,
				discountRuleLst = null;
			// 订单支付科目组的数据表
			this.OrderPaySubjectGrpHT = new IX.IListManager();
			// 结账使用的订单支付科目数据表
			this.OrderPaySubjectHT = new IX.IListManager();
			// 订单条目金额小计数据表
			this.OrderItemSubTotalHT = new IX.IListManager();
			// 订单支付计算涉及的相关全局配置参数关键字
			// 包括：是否会员价(isVipPrice)、折扣率(discountRate)、折扣范围(discountRange)、抹零方式(moneyWipeZeroType)、订单菜品金额合计(foodAmount)
			var OrderPaySettingKeys = "isVipPrice,discountRate,discountRange,moneyWipeZeroType,foodAmount,cardNo,cardKey,cardTransID".split(',');
			// 订单条目用于计算金额小计所需要的基本关键字段，用于组成OrderItemSubTotalHT数据表的字段
			// 包括：条目ID(itemKey)、点菜数量(foodNumber)、退菜数量(foodCancelNumber)、赠菜数量(foodSendNumber)、
			// 是否打折(isDiscount)、售价(foodProPrice)、会员价(foodVipPrice)、成交价(foodPayPrice)	
			var OrderItemBaseKeys = ("itemKey,foodKey,foodName,foodNumber,foodCancelNumber,foodSendNumber,isDiscount,"
							+ "foodProPrice,foodVipPrice,foodPayPrice,isSFDetail,isSetFood,isTempFood").split(',');
			// 订单条目金额小计字段
			// 点菜金额小计(foodProSubTotal)、赠菜优惠小计(sendFoodPromotionSubTotal)、会员价优惠小计(vipFoodPromotionSubTotal)、
			// 打折优惠小计(discountPromotionSubTotal)、实收小计(realSubTotal)
			var OrderItemSubTotalKeys =	"foodProSubTotal,sendFoodPromotionSubTotal,vipFoodPromotionSubTotal,discountPromotionSubTotal,realSubTotal".split(',');

			// 订单支付科目字段
			var PaySubjectItemKeys = "paySubjectKey,paySubjectCode,paySubjectName,debitAmount,giftItemNoLst,payRemark,payTransNo".split(',');
			/**
			 * 初始化订单支付科目相关的所有数据表
			 * @return {[type]} [description]
			 */
			var initOrderPaySettings = function () {
				// 获得订单支付科目计算必须的相关全局参数
				// self.isVipPrice;self.discountRate;self.discountRange;self.moneyWipeZeroType,self.foodAmount
				var shopInfo = storage.get("SHOPINFO"),
					_moneyWipeZeroType = _.result(shopInfo, 'moneyWipeZeroType', 0);
				_.each(OrderPaySettingKeys, function (k) {
					self[k] = _.result(self._OrderData, k);
					if (k == 'moneyWipeZeroType') {
						self[k] = _.isEmpty(self._OrderData[k]) ? _moneyWipeZeroType : _.result(self._OrderData, k, 0);
					}
					// for test set moneyWipeZeroType = 4
					// if (k == 'moneyWipeZeroType') {
					// 	self[k] = 4;
					// }
				});
				IX.Debug.info("初始化订单支付相关全局参数:");
				IX.Debug.info(OrderPaySettingKeys.join('\t'));
				IX.Debug.info(_.values(_.pick(self, OrderPaySettingKeys)).join('\t'));
				// IX.Debug.info(self.isVipPrice + "\t" + self.discountRate + "\t" + self.discountRange + "\t" + self.moneyWipeZeroType);

				// 计算订单条目金额小计数据表
				self.calcOrderItemsSubTotal();
				// 计算并更新订单菜品金额合计
				self.updateFoodAmount();
				// 计算并更新账单赠送菜品金额合计
				self.updatePaySubjectItem("sendFoodPromotionPay");
				// if (_.isEmpty(_.result(self._OrderData, 'payLst'))) return;
				if (!_.isEmpty(_.result(self._OrderData, 'payLst'))) {
					// 计算并更新会员价优惠金额合计
					self.updatePaySubjectItem("vipPricePromotionPay");
					// 计算并更新账单折扣合计
					self.updatePaySubjectItem("discountPay", {
						isVipPrice : self.isVipPrice,
						discountRate : self.discountRate,
						discountRange : self.discountRange
					});
				}
				// 计算并更新账单元整
				self.updatePaySubjectItem("wipeZeroPay");
			};

			/**
			 * 初始化订单支付科目组的数据表
			 * 记录所有支付科目组，并且每个组下面有具体的支付科目配置信息
			 * @return {[type]} [description]
			 */
			this.initOrderPaySubjectGrpHT = function () {
				var _payLst = _.result(self._OrderData, 'payLst', []);
				self.OrderPaySubjectGrpHT.clear();
				self.OrderPaySubjectHT.clear();
				self.OrderItemSubTotalHT.clear();
				_.each(paySubjectGrpLst, function (payGrp) {
					var name = _.result(payGrp, 'name');
					self.OrderPaySubjectGrpHT.register(name, payGrp);
				});
				if (!_.isEmpty(_payLst)) {
					_.each(_payLst, function (paySubject) {
						self.OrderPaySubjectHT.register(_.result(paySubject, 'paySubjectCode'), paySubject);
					});
				}
			};

			/**
			 * 初始化订单支付
			 * @return {[type]} [description]
			 */
			this.initOrderPay = function (successFn) {
				var paySubjectCallServer = PaySubjectService.getPaySubjectLst(),
					discountRuleCallServer = OrderDiscountRuleService.getDiscountRuleLst();
				// 获取支付科目字典数据
				paySubjectCallServer.success(function () {
					paySubjectGrpLst = PaySubjectService.getAllPaySubject();
					IX.Debug.info("Pay Subject Group Lst:");
					IX.Debug.info(paySubjectGrpLst);
					// 支付科目字典数据加载完成后，
					// 将订单数据模型中，涉及支付相关字段载入订单支付服务的数据模型中
					self._OrderData = OrderService.getOrderData();
					self.OrderFoodHT = OrderService.getOrderFoodHT();
					// 初始化支付科目组数据表
					self.initOrderPaySubjectGrpHT();
					// 初始化订单支付科目相关的数据表
					initOrderPaySettings();
					_.isFunction(successFn) && successFn();
					
				});
				// 获取账单折扣优惠方案字典数据
				discountRuleCallServer.success(function () {
					discountRuleLst = OrderDiscountRuleService.getDiscountRules();
					IX.Debug.info("Discount Rule Lst:");
					IX.Debug.info(discountRuleLst);
				});
			};

			/**
			 * 计算订单菜品条目点菜金额小计
			 * 公式：
			 * foodProSubTotal = (foodNumber - foodCancelNumber) * foodProPrice
			 * @param  {[type]} item [description]
			 * @return {[type]}      [description]
			 */
			this.calcFoodProSubTotal = function (item) {
				var foodNumber = parseFloat(_.result(item, 'foodNumber')),
					foodCancelNumber = parseFloat(_.result(item, 'foodCancelNumber')),
					foodProPrice = parseFloat(_.result(item, 'foodProPrice')),
					foodPayPrice = parseFloat(_.result(item, 'foodPayPrice')),
					isSFDetail = _.result(item, 'isSFDetail');
				// 初始计算结果(float)
				var v = HCMath.multi(HCMath.sub(foodNumber - foodCancelNumber), (isSFDetail == "1" ? foodPayPrice : foodProPrice));
				// 精确到小数点后4位
				// 将初始计算结果放大10000倍(小数点向右移动4位)，然后向下取整，最后缩小10000倍(小数点向左移动4位)
				v = parseFloat(Math.floor(v.toString().movePointRight(4)).toString().movePointLeft(4));
				return v;
			};

			/**
			 * 计算订单菜品条目赠菜优惠小计
			 * 公式：
			 * sendFoodPromotionSubTotal = (foodSendNumber) * foodProPrice
			 * @param  {[type]} item [description]
			 * @return {[type]}      [description]
			 */
			this.calcSendFoodPromotionSubTotal = function (item) {
				var foodSendNumber = parseFloat(_.result(item, 'foodSendNumber', 0)),
					foodProPrice = parseFloat(_.result(item, 'foodProPrice', 0)),
					foodPayPrice = parseFloat(_.result(item, 'foodPayPrice', 0)),
					isSFDetail = _.result(item, 'isSFDetail');
				// 初始计算结构（float）
				var v = HCMath.multi(foodSendNumber, isSFDetail == "1" ? foodPayPrice : foodProPrice);
				// 精确到小数点后4位
				// 将初始计算结果放大10000倍(小数点向右移动4位)，然后向下取整，最后缩小10000倍(小数点向左移动4位)
				v = parseFloat(Math.floor(v.toString().movePointRight(4)).toString().movePointLeft(4));
				return v;
			};

			/**
			 * 计算订单菜品条目会员价优惠小计
			 * 公式：
			 * vipFoodPromotionSubTotal = (isVipPrice == 1 ? (foodProPrice - foodPayPrice) : (foodProPrice - foodProPrice)) * (foodNumber - foodCancelNumber - foodSendNumber)
			 * @param  {[type]} item [description]
			 * @return {[type]}      [description]
			 */
			this.calcVipFoodPromotionSubTotal = function (item) {
				var isVipPrice = parseFloat(self.isVipPrice),
					foodProPrice = parseFloat(_.result(item, 'foodProPrice', 0)),
					foodVipPrice = parseFloat(_.result(item, 'foodVipPrice', 0)),
					foodPayPrice = parseFloat(_.result(item, 'foodPayPrice', 0)),
					foodNumber = parseFloat(_.result(item, 'foodNumber', 0)),
					foodCancelNumber = parseFloat(_.result(item, 'foodCancelNumber', 0)),
					foodSendNumber = parseFloat(_.result(item, 'foodSendNumber', 0)),
					isSFDetail = _.result(item, 'isSFDetail');
				// 根据算法公式为：(isVipPrice == 1 ? (foodProPrice - foodPayPrice) : (foodProPrice - foodProPrice)) * (foodNumber - foodCancelNumber - foodSendNumber)
				/*var deltaPrice = isVipPrice == 1 
					? parseFloat(HCMath.sub((isSFDetail == "1" ? foodPayPrice : foodProPrice), foodPayPrice))
					: parseFloat(HCMath.sub(foodProPrice, foodProPrice)),
					deltaNumber = parseFloat(HCMath.sub(foodNumber, foodCancelNumber, foodSendNumber));*/
				// 需求更改，根据新的需求（2015/7/27邮件中的需求更改）
				// 计算公式更改为：
				// (isSFDetail == 1 ? 0 : (isVipPrice == 1 ? (foodProPrice - foodVipPrice) : (foodProPrice - foodProPrice))) * (foodNumber - foodCancelNumber - foodSendNumber)
				var deltaPrice = isVipPrice == 1
					? (isSFDetail == "1" ? 0 : parseFloat(HCMath.sub(foodProPrice, foodVipPrice)))
					: parseFloat(HCMath.sub(foodProPrice, foodProPrice)),
					deltaNumber = parseFloat(HCMath.sub(foodNumber, foodCancelNumber, foodSendNumber));
				var v = HCMath.multi(deltaPrice, deltaNumber);
				// 精确到小数点后4位
				// 将初始计算结果放大10000倍(小数点向右移动4位)，然后向下取整，最后缩小10000倍(小数点向左移动4位)
				v = parseFloat(Math.floor(v.toString().movePointRight(4)).toString().movePointLeft(4));
				return v;
			};

			/**
			 * 计算订单菜品条目打折优惠小计
			 * 公式：
			 * discountPromotionSubTotal = (foodNumber - foodCancelNumber - foodSendNumber) * foodPayPrice * (1 - (isDiscount == 1 ? discountRate : (discountRange == 1 ? discountRate : 1)))
			 * @param  {[type]} item [description]
			 * @return {[type]}      [description]
			 */
			this.calcDiscountPromotionSubTotal = function (item) {
				var foodNumber = parseFloat(_.result(item, 'foodNumber', 0)),
					foodCancelNumber = parseFloat(_.result(item, 'foodCancelNumber', 0)),
					foodSendNumber = parseFloat(_.result(item, 'foodSendNumber', 0)),
					foodPayPrice = parseFloat(_.result(item, 'foodPayPrice', 0)),
					isDiscount = parseFloat(_.result(item, 'isDiscount', 0)),
					discountRange = parseFloat(self.discountRange),
					discountRate = parseFloat(self.discountRate),
					isSFDetail = _.result(item, 'isSFDetail');
				var deltaNumber = parseFloat(HCMath.sub(foodNumber, foodCancelNumber, foodSendNumber)),
					deltaRate = HCMath.sub(1, 
						(isDiscount == 1 ? discountRate 
							: (discountRange == 1 ? discountRate : 1))
					);
				var v = HCMath.multi(deltaNumber, foodPayPrice, deltaRate);
				// 精确到小数点后4位
				// 将初始计算结果放大10000倍(小数点向右移动4位)，然后向下取整，最后缩小10000倍(小数点向左移动4位)
				v = parseFloat(Math.floor(v.toString().movePointRight(4)).toString().movePointLeft(4));
				return v;

			};

			/**
			 * 计算订单菜品条目实收小计
			 * 公式：
			 * realSubTotal  = foodProSubTotal - sendFoodPromotionSubTotal - vipFoodPromotionSubTotal - discountPromotionSubTotal
			 * @param  {[type]} item [description]
			 * @return {[type]}      [description]
			 */
			this.calcRealSubTotal = function (item) {
				// foodProSubTotal,sendFoodPromotionSubTotal,vipFoodPromotionSubTotal,discountPromotionSubTotal,realSubTotal
				var foodProSubTotal = parseFloat(_.result(item, 'foodProSubTotal', 0)),
					sendFoodPromotionSubTotal = parseFloat(_.result(item, 'sendFoodPromotionSubTotal', 0)),
					vipFoodPromotionSubTotal = parseFloat(_.result(item, 'vipFoodPromotionSubTotal', 0)),
					discountPromotionSubTotal = parseFloat(_.result(item, 'discountPromotionSubTotal', 0));
				var v = HCMath.sub(foodProSubTotal, sendFoodPromotionSubTotal, vipFoodPromotionSubTotal, discountPromotionSubTotal);
				// 精确到小数点后4位
				// 将初始计算结果放大10000倍(小数点向右移动4位)，然后向下取整，最后缩小10000倍(小数点向左移动4位)
				v = parseFloat(Math.floor(v.toString().movePointRight(4)).toString().movePointLeft(4));
				return v;

			};

			/**
			 * 计算所有订单条目表的金额小计
			 * 1. 清空OrderItemSubTotalHT表中的数据；
			 * 2. 遍历所有订单条目；
			 * 3. 计算订单条目的各个小计字段；
			 * 4. 将条目数据与计算后的小计数据注册到OrderItemSubTotalHT表中；
			 * @return {[type]} [description]
			 */
			this.calcOrderItemsSubTotal = function () {
				var foodItems = self.OrderFoodHT.getAll();
				self.OrderItemSubTotalHT.clear();
				_.each(foodItems, function (item) {
					var itemKey = _.result(item, 'itemKey');
					var _item = {}, _subtotal = {};
					_.each(OrderItemBaseKeys, function (k) {
						// 如果self.isVipPrice == 1, foodPayPrice = foodVipPrice,否则foodPayPrice = foodProPrice
						// _item[k] = (k == 'foodPayPrice') 
						// 	? _.result(item, (self.isVipPrice == 1 ? 'foodVipPrice' : 'foodProPrice'), "0")
						// 	: _.result(item, k, "0");
						_item[k] = _.result(item, k, "0");
					});
					_.each(OrderItemSubTotalKeys, function (k) {
						var fnName = 'calc' + k.slice(0, 1).toUpperCase() + k.slice(1);
						_subtotal[k] = self[fnName](_item);
						_item = _.extend(_item, _subtotal);
					});
					self.OrderItemSubTotalHT.register(itemKey, _item);
				});
				// Test Log
				IX.Debug.info("订单支菜品条目金额小计表:");
				var _keys = OrderItemBaseKeys.concat(OrderItemSubTotalKeys);
				IX.Debug.info(_keys.join('\t'));
				_.each(self.OrderItemSubTotalHT.getAll(), function (item) {
					IX.Debug.info(_.values(item).join('\t'));
				});
			};

			/**
			 * 计算账单金额合计
			 * @return {[type]} [description]
			 */
			this.sumFoodAmount = function () {
				var items = self.OrderItemSubTotalHT.getAll();
				var subtotals = _.pluck(items, 'foodProSubTotal');
				var sum = HCMath.add.apply(null, subtotals);
				// 精确到小数点后2位
				// 将初始计算结果放大100倍(小数点向右移动2位)，然后向下取整，最后缩小100倍(小数点向左移动2位)
				sum = parseFloat(Math.floor(sum.toString().movePointRight(2)).toString().movePointLeft(2));
				return sum;
			};

			/**
			 * 计算账单赠送菜品优惠合计
			 * @return {[type]} [description]
			 */
			this.sumSendFoodPromotion = function () {
				var items = self.OrderItemSubTotalHT.getAll();
				var subtotals = _.pluck(items, 'sendFoodPromotionSubTotal');
				var sum = HCMath.add.apply(null, subtotals);
				// 精确到小数点后2位
				// 将初始计算结果放大100倍(小数点向右移动2位)，然后向下取整，最后缩小100倍(小数点向左移动2位)
				sum = parseFloat(Math.floor(sum.toString().movePointRight(2)).toString().movePointLeft(2));
				return sum;
			};

			/**
			 * 计算菜品会员价优惠合计
			 * @return {[type]} [description]
			 */
			this.sumVipFoodPromotion = function () {
				var items = self.OrderItemSubTotalHT.getAll();
				var subtotals = _.pluck(items, 'vipFoodPromotionSubTotal');
				var sum = HCMath.add.apply(null, subtotals);
				// 精确到小数点后2位
				// 将初始计算结果放大100倍(小数点向右移动2位)，然后向下取整，最后缩小100倍(小数点向左移动2位)
				sum = parseFloat(Math.floor(sum.toString().movePointRight(2)).toString().movePointLeft(2));
				return sum;
			};
			
			/**
			 * 计算账单折扣合计
			 * @return {[type]} [description]
			 */
			this.sumDiscountPromotion = function () {
				var items = self.OrderItemSubTotalHT.getAll();
				var subtotals = _.pluck(items, 'discountPromotionSubTotal');
				var sum = HCMath.add.apply(null, subtotals);
				// 精确到小数点后2位
				// 将初始计算结果放大100倍(小数点向右移动2位)，然后向下取整，最后缩小100倍(小数点向左移动2位)
				sum = parseFloat(Math.floor(sum.toString().movePointRight(2)).toString().movePointLeft(2));
				return sum;
			};

			/**
			 * 计算实际应收收小计的合计
			 * @return {[type]} [description]
			 */
			this.sumRealFoodAmount = function () {
				var foodAmountSum = self.sumFoodAmount(),
					sendFoodPromotionSum = self.sumSendFoodPromotion(),
					vipFoodPromotionSum = self.sumVipFoodPromotion(),
					discountPromotionSum = self.sumDiscountPromotion();
				var sum = HCMath.sub(foodAmountSum, sendFoodPromotionSum, vipFoodPromotionSum, discountPromotionSum);
				// 精确到小数点后2位
				// 将初始计算结果放大100倍(小数点向右移动2位)，然后向下取整，最后缩小100倍(小数点向左移动2位)
				sum = parseFloat(Math.floor(sum.toString().movePointRight(2)).toString().movePointLeft(2));
				return sum;
			};

			/**
			 * 计算账单元整
			 * @return {[type]} [description]
			 */
			this.calcMoneyWipeZeroAmount = function () {
				var moneyWipeZeroType = self.moneyWipeZeroType;
				var sumRealFoodAmount = self.sumRealFoodAmount();
				var v = 0;
				switch (moneyWipeZeroType.toString()) {
					case "0":
					// 不抹零
						v = sumRealFoodAmount;
						break;
					case "1":
					// 四舍五入到角
						v = parseFloat(Math.round(sumRealFoodAmount.toString().movePointRight(1)).toString().movePointLeft(1));
						break;
					case "2":
					// 向上抹零到角
						v = parseFloat(Math.ceil(sumRealFoodAmount.toString().movePointRight(1)).toString().movePointLeft(1));
						break;
					case "3":
					// 向下抹零到角
						v = parseFloat(Math.floor(sumRealFoodAmount.toString().movePointRight(1)).toString().movePointLeft(1));
						break;
					case "4":
					// 四舍五入到元
						v = parseFloat(Math.round(sumRealFoodAmount));
						break;
					case "5":
					// 向上抹零到元
						v = parseFloat(Math.ceil(sumRealFoodAmount));
						break;
					case "6":
					// 向下抹零到元
						v = parseFloat(Math.floor(sumRealFoodAmount));
						break;
					default :
						break;
				}
				v = HCMath.sub(sumRealFoodAmount, v);
				return v;
			};

			/**
			 * 开启|关闭使用会员价
			 * @param  {Number} enabled		1:使用会员价；0:不适用会员价 
			 * @return {[type]}   [description]
			 */
			this.enableVipPrice = function (enabled) {
				self.isVipPrice = enabled;
			};

			/**
			 * 更新折扣率
			 * @param  {Float} discountRate 1：不打折；0.5：5折
			 * @return {[type]}              [description]
			 */
			this.updateDiscountRate = function (discountRate) {
				self.discountRate = isNaN(discountRate) ? 1 : discountRate;
			};

			/**
			 * 开启全部菜品折扣
			 * @param  {Number} discountRange 0：部分菜品打折；1：全部菜品打折
			 * @return {[type]}               [description]
			 */
			this.enableAllFoodsDiscount = function (discountRange) {
				self.discountRange = discountRange;
			};

			/**
			 * 更新抹零方式
			 * @param  {Number} moneyWipeZeroType 0:不抹零;1:四舍五入到角;2:向上抹零到角;3:向下抹零到角;4:四舍五入到元;5:向上抹零到元;6:向下抹零到元;
			 * @return {[type]}                   [description]
			 */
			this.updateWipeZeroType = function (moneyWipeZeroType) {
				self.moneyWipeZeroType = (isNaN(moneyWipeZeroType) || moneyWipeZeroType < 0 || moneyWipeZeroType > 6) ? 0 : moneyWipeZeroType;
			};

			/**
			 * 整理订单支付详情
			 * 1. 计算并更新订单条目金额小计表
			 * 2. 遍历支付科目组
			 * 3. 读取支付科目组中的支付科目
			 * 4. 根据读取的支付科目，在使用支付科目表中查找支付科目数据
			 * 5. 整理出支付科目组下支付总金额，支付明细金额
			 * 6. 整理成页面需要的数据结构
			 * @return {[type]} [description]
			 */
			this.mapOrderPayDetail = function () {
				var orderPayGrps = self.OrderPaySubjectGrpHT.getAll(),
					orderPaySubjectHT = self.OrderPaySubjectHT;
				// PaySubjectItemKeys
				var payDetail = {
					saasOrderKey : _.result(self._OrderData, 'saasOrderKey'),
					isVipPrice : self.isVipPrice,
					discountRate : self.discountRate,
					discountRange : self.discountRange,
					moneyWipeZeroType : self.moneyWipeZeroType,
					foodAmount : self.foodAmount,
					payGrps : []
				};
				// 整理一个支付科目组下的支付科目数据
				var mapPayItemsData = function (items) {
					var ret = _.map(items, function (item) {
						var paySubjectCode = _.result(item, 'subjectCode');
						var curPaySubject = orderPaySubjectHT.get(paySubjectCode);
						return curPaySubject;
					});
					ret = _.reject(ret, function (el) {
						return _.isEmpty(el);
					});
					return ret;
				};
				// 整理支付科目组数据
				var mapPaySubjectGrpData = function () {
					var orderPayGrps = self.OrderPaySubjectGrpHT.getAll();
					var ret = _.map(orderPayGrps, function (payGrp) {
						var items = _.result(payGrp, 'items', []),
							payLst = [];
						payLst = mapPayItemsData(items);
						return self.mapPayGrpSchema(payGrp, payLst);
					});
					return ret;
				};
				// 更新订单条目金额小计表
				self.calcOrderItemsSubTotal();
				// 遍历支付科目组
				var payGrps = mapPaySubjectGrpData();
				var payGrpsAmount = HCMath.add.apply(null, _.pluck(payGrps, 'amount')),
					unPayAmount = HCMath.sub(_.result(payDetail, 'foodAmount'), payGrpsAmount);
				payDetail = _.extend(payDetail, {
					payGrps : payGrps,
					unPayAmount : unPayAmount
				});
				return payDetail;
			};

			/**
			 * 格式化支付科目组数据结构
			 * @param  {[type]} payGrp [description]
			 * @param  {[type]} payLst [description]
			 * @return {[type]}        [description]
			 */
			this.mapPayGrpSchema = function (payGrp, payLst) {
				var name = _.result(payGrp, 'name');
				var ret;
				var mapCommonSubjectSchema = function (items) {
					var amount = 0, detail = '',
						isEmpty = _.isEmpty(items);
					amount = isEmpty ? 0 : HCMath.add.apply(null, _.pluck(items, 'debitAmount'));
					return {
						amount : amount,
						detail : detail
					};
				};
				var mapDiscountPaySchema = function (items) {
					var amount = 0, detail = '',
						isEmpty = _.isEmpty(items);
					var discountRate = _.result(self, 'discountRate', 1),
						discountRange = _.result(self, 'discountRange', 1);
					amount = isEmpty ? 0 : HCMath.add.apply(null, _.pluck(items, 'debitAmount'));
					detail = discountRate == 1 ? '不打折' : (parseFloat(discountRate.toString().movePointRight(1)) + '折, ' + (discountRange == 0 ? '部分菜品打折' : '全部菜品打折'));
					return {
						amount : amount,
						detail : detail
					};
				};
				var mapVipCardPaySchema = function (items) {
					var amount = 0, detail = '',
						isEmpty = _.isEmpty(items);
					// var vipCardNo = isEmpty ? '' : _.pluck(items, 'payTransNo')[0] + ';';
					var vipCardNo = isEmpty ? '' : self.cardNo;
					vipCardNo = _.isEmpty(vipCardNo) ? '' : ('卡号:' + vipCardNo + ';');
					amount = isEmpty ? 0 : HCMath.add.apply(null, _.pluck(items, 'debitAmount'));
					var subjectNames = isEmpty ? '' : _.pluck(items, 'paySubjectName', ''),
						debitAmounts = isEmpty ? '' : _.pluck(items, 'debitAmount', '');
					detail = _.zip(subjectNames, debitAmounts);
					detail = _.map(detail, function (el) {
						return el.join(':');
					});
					detail = vipCardNo + detail.join(';');
					return {
						amount : amount,
						detail : detail
					};
				};
				var mapBankCardPaySchema = function (items) {
					var amount = 0, detail = '',
						isEmpty = _.isEmpty(items);
					amount = isEmpty ? 0 : HCMath.add.apply(null, _.pluck(items, 'debitAmount'));
					var subjectNames = isEmpty ? '' : _.pluck(items, 'paySubjectName', ''),
						debitAmounts = isEmpty ? '' : _.pluck(items, 'debitAmount', '');
					detail = _.zip(subjectNames, debitAmounts);
					detail = _.map(detail, function (el) {
						return el.join(':');
					});
					detail = detail.join(';');
					return {
						amount : amount,
						detail : detail
					};
				};
				var mapGroupBuySchema = function (items) {
					var amount = 0, detail = '',
						isEmpty = _.isEmpty(items);
					amount = isEmpty ? 0 : HCMath.add.apply(null, _.pluck(items, 'debitAmount'));
					var subjectNames = isEmpty ? '' : _.pluck(items, 'paySubjectName', ''),
						debitAmounts = isEmpty ? '' : _.pluck(items, 'debitAmount', '');
					detail = _.zip(subjectNames, debitAmounts);
					detail = _.map(detail, function (el) {
						return el.join(':');
					});
					detail = detail.join(';');
					return {
						amount : amount,
						detail : detail
					};
				};
				var mapHangingPaySchema = function (items) {
					var amount = 0, detail = '',
						isEmpty = _.isEmpty(items);
					amount = isEmpty ? 0 : HCMath.add.apply(null, _.pluck(items, 'debitAmount'));
					var subjectNames = isEmpty ? '' : _.pluck(items, 'paySubjectName', ''),
						debitAmounts = isEmpty ? '' : _.pluck(items, 'debitAmount', '');
					detail = _.zip(subjectNames, debitAmounts);
					detail = _.map(detail, function (el) {
						return el.join(':');
					});
					detail = detail.join(';');
					return {
						amount : amount,
						detail : detail
					};
				};
				switch(name) {
					// 账单赠送
					case "sendFoodPromotionPay":
					// 账单会员价优惠
					case "vipPricePromotionPay":
					// 账单元整
					case "wipeZeroPay":
					// 账单减免
					case "remissionPay":
					// 现金支付
					case "cashPay":
					// 哗啦啦
					case "hualalaPay":
					// 代金券
					case "voucherPay":
						ret = mapCommonSubjectSchema(payLst);
						break;
					// 账单折扣
					case "discountPay":
						ret = mapDiscountPaySchema(payLst);
						break;
					// 会员卡
					case "vipCardPay":
						ret = mapVipCardPaySchema(payLst);
						break;
					// 银行存款
					case "bankCardPay":
						ret = mapBankCardPaySchema(payLst);
						break;
					// 团购
					case "groupBuyPay":
						ret = mapGroupBuySchema(payLst);
						break;
					// 挂账
					case "hangingPay":
						ret = mapHangingPaySchema(payLst);
						break;

				}
				return _.extend(ret, payGrp);
				// return _.extend(ret, {
				// 	name : name,
				// 	label : _.result(payGrp, 'label', '')
				// });
			};

			/**
			 * 更新订单菜品金额
			 * @return {[type]} [description]
			 */
			this.updateFoodAmount = function () {
				self.foodAmount = self.sumFoodAmount();
			};

			/**
			 * 删除已经记录的支付科目
			 * @param  {[type]} subjectNames [description]
			 * @return {[type]}              [description]
			 */
			this.deletePaySubjectItem = function (paySubjectCodes, subjectGrpName) {
				var paySubjectHT = self.OrderPaySubjectHT;
				_.each(paySubjectCodes, function (code) {
					paySubjectHT.remove(code);
				});
				if (subjectGrpName == 'discountPay') {
					// 除了撤销折扣金额外，还要把折扣方案设置为不打折
					self.isVipPrice = 0;
					self.discountRate = 1;
					self.discountRange = 0;
					// 计算并更新账单折扣合计
					self.updatePaySubjectItem("discountPay", {
						isVipPrice : self.isVipPrice,
						discountRate : self.discountRate,
						discountRange : self.discountRange
					});
				}
			};

			/**
			 * 更新支付科目数据
			 * @param  {[type]} subjectGrpName [description]
			 * @param  {[type]} params      [description]
			 * @return {[type]}             [description]
			 */
			this.updatePaySubjectItem = function (subjectGrpName, params) {
				// var subjectSetting = self.getPaySubjectSettings(subjectCode);
				var subjectGrp = self.OrderPaySubjectGrpHT.get(subjectGrpName),
					items = _.result(subjectGrp, 'items');
				var fnName;
				switch(subjectGrpName) {
					// 账单赠送
					case "sendFoodPromotionPay":
					// 账单会员价优惠
					case "vipPricePromotionPay":
					// 账单元整
					case "wipeZeroPay":
						// 自动计算值，或者取消
						_.each(items, function (el) {
							var paySubjectName = _.result(el, 'subjectName'),
								paySubjectCode = _.result(el, 'subjectCode'),
								paySubjectKey = _.result(el, 'subjectKey');
							var debitAmount = 0;
							if (subjectGrpName == "sendFoodPromotionPay") {
								debitAmount = self.sumSendFoodPromotion();
							} else if (subjectGrpName == "vipPricePromotionPay") {
								debitAmount = self.sumVipFoodPromotion();
							} else if (subjectGrpName == "wipeZeroPay") {
								debitAmount = self.calcMoneyWipeZeroAmount();
							}
							self.OrderPaySubjectHT.register(paySubjectCode, {
								paySubjectName : paySubjectName,
								paySubjectCode : paySubjectCode,
								paySubjectKey : paySubjectKey,
								debitAmount : debitAmount,
								giftItemNoLst : '',
								payRemark : '',
								payTransNo : ''
							});
						});
						break;
					// 账单减免
					case "remissionPay":
					// 现金支付
					case "cashPay":
					// 哗啦啦
					case "hualalaPay":
					// 代金券
					case "voucherPay":
						// 根据输入金额更新值，或者取消
						_.each(items, function (el) {
							var paySubjectName = _.result(el, 'subjectName'),
								paySubjectCode = _.result(el, 'subjectCode'),
								paySubjectKey = _.result(el, 'subjectKey');
							var debitAmount = _.result(params, 'debitAmount', 0),
								payRemark = _.result(params, 'payRemark', '');
							self.OrderPaySubjectHT.register(paySubjectCode, {
								paySubjectName : paySubjectName,
								paySubjectCode : paySubjectCode,
								paySubjectKey : paySubjectKey,
								debitAmount : debitAmount,
								giftItemNoLst : '',
								payRemark : payRemark,
								payTransNo : ''
							});

						});
						break;
					// 账单折扣
					case "discountPay":
						// 根据选择折扣方案，更新值，或者取消
						_.each(items, function (el) {
							var paySubjectName = _.result(el, 'subjectName'),
								paySubjectCode = _.result(el, 'subjectCode'),
								paySubjectKey = _.result(el, 'subjectKey');
							var isVipPrice = _.result(params, 'isVipPrice'),
								discountRate = _.result(params, 'discountRate'),
								discountRange = _.result(params, 'discountRange');
							// 更新打折方案配置
							_.extend(self, params);
							self.calcOrderItemsSubTotal();
							var debitAmount = self.sumDiscountPromotion();
							var payRemark = (discountRange == 1 ? '全部' : '部分') + '菜品;'
								+ (isVipPrice == 1 ? '' : '不') + '使用会员价;'
								+ '打' + parseFloat(discountRate.toString().movePointRight(1)) + '折'
							self.OrderPaySubjectHT.register(paySubjectCode, {
								paySubjectName : paySubjectName,
								paySubjectCode : paySubjectCode,
								paySubjectKey : paySubjectKey,
								debitAmount : debitAmount,
								giftItemNoLst : '',
								payRemark : discountRate == 1 ? '不打折' : payRemark,
								payTransNo : ''
							});
							// 计算并更新账单赠送菜品金额合计
							self.updatePaySubjectItem("sendFoodPromotionPay");
							// 计算并更新会员价优惠金额合计
							self.updatePaySubjectItem("vipPricePromotionPay");
							// 计算并更新账单元整
							self.updatePaySubjectItem("wipeZeroPay");
						});
						break;
					// 会员卡
					case "vipCardPay":
						// 根据选择使用会员卡支付方案，更新值
						_.each(items, function (el) {
							var paySubjectName = _.result(el, 'subjectName'),
								paySubjectCode = _.result(el, 'subjectCode'),
								paySubjectKey = _.result(el, 'subjectKey');
							// 先清空之前的支付科目
							self.OrderPaySubjectHT.remove(paySubjectCode);
							var _paySubjectParams = params[paySubjectCode];
							if (!_.isEmpty(_paySubjectParams)) {
								self.OrderPaySubjectHT.register(paySubjectCode, _.extend({
									paySubjectName : paySubjectName,
									paySubjectCode : paySubjectCode,
									paySubjectKey : paySubjectKey
								}, _paySubjectParams));
							}
							
							self.calcOrderItemsSubTotal();
							// 计算并更新账单赠送菜品金额合计
							self.updatePaySubjectItem("sendFoodPromotionPay");
							// 计算并更新会员价优惠金额合计
							self.updatePaySubjectItem("vipPricePromotionPay");
							// 计算并更新账单元整
							self.updatePaySubjectItem("wipeZeroPay");
						});
						break;
					// 银行存款
					case "bankCardPay":
					// 团购
					case "groupBuyPay":
					// 挂账
					case "hangingPay":
						// 根据选择的银行、团购、挂账科目，缓存支付数据
						_.each(items, function (el) {
							var paySubjectName = _.result(el, 'subjectName'),
								paySubjectCode = _.result(el, 'subjectCode'),
								paySubjectKey = _.result(el, 'subjectKey');
							var debitAmount = _.result(params, 'debitAmount', 0),
								subjectCode = _.result(params, 'subjectCode', '');
							if (paySubjectCode == subjectCode) {
								self.OrderPaySubjectHT.register(paySubjectCode, {
									paySubjectName : paySubjectName,
									paySubjectCode : paySubjectCode,
									paySubjectKey : paySubjectKey,
									debitAmount : debitAmount,
									giftItemNoLst : '',
									payRemark : '',
									payTransNo : ''
								});
							}
							
						});
						break;
				}
				IX.Debug.info("OrderPaySubjectLst:");
				IX.Debug.info(self.OrderPaySubjectHT.getAll());
			};

			/**
			 * 根据支付科目code获取支付科目配置信息
			 * @param  {[type]} subjectCode [description]
			 * @return {[type]}             [description]
			 */
			this.getPaySubjectSettings = function (subjectCode) {
				var subjects = self.OrderPaySubjectGrpHT.getAll(),
					paySubjectHT = self.OrderPaySubjectHT;
				subjects = _.flatten(_.pluck(subjects, 'items'));
				var subjectSetting = _.find(subjects, function (el) {
					return el.subjectCode == subjectCode;
				});
				return subjectSetting;
			};

			/**
			 * 根据支付科目code（subjectCode）获取已支付科目的数据记录
			 * @param  {[type]} subjectCode [description]
			 * @return {[type]}             [description]
			 */
			this.getPaySubjectRecord = function (subjectCode) {
				if (_.isEmpty(subjectCode)) {
					return self.OrderPaySubjectHT.getAll();
				}
				return self.OrderPaySubjectHT.get(subjectCode);
			};

			/**
			 * 预计算应收
			 * 根据订单支付科目详情和支付科目组名称，预计算支付科目组需要收取的金额
			 * @return {[type]} [description]
			 */
			this.preCalcPayAmountByPaySubjectGrpName = function (name) {
				var foodAmount = self.foodAmount,
					payDetail = self.mapOrderPayDetail(),
					payGrps = _.result(payDetail, 'payGrps', []);
				// 过滤出当前支付科目组名称之外的所有支付科目组
				var _otherAmounts = _.pluck(_.reject(payGrps, function (el) {
					return el.name == name;
				}), 'amount');
				var sumOtherAmount = HCMath.add.apply(null, _otherAmounts);
				var prePayAmount = HCMath.sub(foodAmount, sumOtherAmount);
				return prePayAmount;
			};

			/**
			 * 更新会员卡打折方案设置
			 * 判断当前如果没有使用账单打折方案，才可以设置会员卡优惠方案
			 * @param  {[type]} settings [description]
			 * @return {[type]}          [description]
			 */
			this.updateVipCardDicountSettings = function (settings) {
				var orderDiscount = self.OrderPaySubjectHT.get('51010503');
				if (!orderDiscount || orderDiscount.debitAmount == 0) {
					// self.discountRate = _.result(settings, 'discountRate');
					// self.discountRange = _.result(settings, 'discountRange');
					// self.isVipPrice = _.result(settings, 'isVipPrice');
					self.updatePaySubjectItem('discountPay', settings);
				}
			};

			/**
			 * 获取支付提交数据
			 * @return {[type]} [description]
			 */
			this.getOrderPayParams = function () {
				var payLst = self.getPaySubjectRecord();
				var checkoutKeys = 'cardNo,cardKey,cardTransID,discountRate,discountRange,isVipPrice,moneyWipeZeroType,promotionAmount,promotionDesc,invoiceTitle,invoiceAmount,payLst'.split(',');
				var pdata = _.pick(self, checkoutKeys);
				pdata = _.extend(pdata, {
					payLst : payLst
				});
				return pdata;
			};
			

			/**
			 * 获取打折方案字典
			 * @return {[type]} [description]
			 */
			this.getDiscountRules = function () {

				return discountRuleLst;
			};

			/**
			 * 获取当前订单支付优惠规则
			 * @return {[type]} [description]
			 */
			this.getCurDiscountRule = function () {
				var params = _.pick(self, 'discountRate,discountRange,isVipPrice'.split(','));
				if (params.discountRate == 1) {
					return '1;0;0';
				} else {
					return _.values(params).join(';');
				}
			};

			/**
			 * 设置当前打折优惠规则方案
			 * @param {[type]} params {discountRate,discountRange,isVipPrice}
			 */
			this.setCurDiscountRule = function (params) {
				params = _.pick(params, ['discountRate', 'discountRange', 'isVipPrice']);
				_.extend(self, params);
				self.updatePaySubjectItem('discountPay', params);
			};

			/**
			 * 更新会员卡支付操作相关参数
			 * @return {[type]} [description]
			 */
			this.updateVIPCardPayParams = function (params) {
				self.cardNo = _.result(params, 'cardNo', '');
				self.cardKey = _.result(params, 'cardKey', '');
				self.cardTransPWD = _.result(params, 'cardTransPWD', '');
			};

			/**
			 * 会员卡交易撤销服务操作
			 * @return {[type]} [description]
			 */
			this.vipCardTransRevoke = function () {
				var cardKey = self.cardKey,
					transID = self.cardTransID;
				var callServer = CommonCallServer.cardTransRevoke({
					cardNoOrMobile : cardKey,
					transID : transID
				});
				return callServer;
			};

			/**
			 * 会员卡扣款服务操作
			 * @return {[type]} [description]
			 */
			this.vipCardDeductMoney = function () {
				var cardKey = self.cardKey,
					cardTransPWD = self.cardTransPWD,
					operator = _.result(storage.get('EMPINFO'), 'empCode'),
					foodAmount = self.foodAmount,
					consumptionAmount = 0,
					consumptionPointAmount = 0,
					paySubjects = self.getPaySubjectRecord(),
					deductGiftAmount = 0,
					deductMoneyAmount = 0,
					deductPointAmount = 0,
					discountAmount = 0,
					EgiftItemIDList = '',
					exchangeItemIDList = '',
					posOrderNo = self._OrderData.saasOrderKey;
				var payDetail = self.mapOrderPayDetail(),
					payGrps = _.result(payDetail, 'payGrps', []);
				// 计算消费金额
				var promotionTotal = _.filter(payGrps, function (el) {
					var promotionKeys = 'sendFoodPromotionPay,vipPricePromotionPay,wipeZeroPay,remissionPay,discountPay'.split(',');
					var idx = _.indexOf(promotionKeys, el.name);
					return idx > -1;
				});
				promotionTotal = _.pluck(promotionTotal, 'amount');
				promotionTotal = HCMath.add.apply(null, promotionTotal);
				consumptionAmount = HCMath.sub(foodAmount, promotionTotal);
				// 计算消费可积分金额
				consumptionPointAmount = _.filter(payGrps, function (el) {
					var pointKeys = 'cashPay,bankCardPay,hualalaPay';
					var idx = _.indexOf(pointKeys, el.name);
					return idx > -1;
				});
				consumptionPointAmount = _.pluck(consumptionPointAmount, 'amount');
				consumptionPointAmount = HCMath.add.apply(null, consumptionPointAmount);
				// 计算会员卡代金券支付金额
				deductGiftAmount = _.result(_.find(paySubjects, function (el) {
					return el.paySubjectCode == '51010615';
				}), 'debitAmount', 0);
				// 计算会员卡现金支付金额
				deductMoneyAmount = _.result(_.find(paySubjects, function (el) {
					return el.paySubjectCode == '51010609';
				}), 'debitAmount', 0);
				// 计算会员卡积分支付金额
				deductPointAmount = _.result(_.find(paySubjects, function (el) {
					return el.paySubjectCode == '51010613';
				}), 'debitAmount', 0);
				// 代金券编号列表
				EgiftItemIDList = _.result(_.find(paySubjects, function (el) {
					return el.paySubjectCode == '51010615';
				}), 'giftItemNoLst', '');

				var postParams = {
					cardKey : cardKey,
					cardTransPWD : cardTransPWD,
					operator : operator,
					consumptionAmount : consumptionAmount,
					consumptionPointAmount : consumptionPointAmount,
					deductGiftAmount : deductGiftAmount,
					deductMoneyAmount : deductMoneyAmount,
					deductPointAmount : deductPointAmount,
					discountAmount : discountAmount,
					EgiftItemIDList : EgiftItemIDList,
					exchangeItemIDList : exchangeItemIDList,
					posOrderNo : posOrderNo
				};
				var callServer = CommonCallServer.cardDeductMoney(postParams);
				callServer.success(function (data) {
					var code = _.result(data, 'code'),
						ret = _.result(data, 'data');
					// 如果扣款成功，会返回交易号 
					self.cardTransID = code == '000' ? _.result(ret, 'transID', '') : ''; 
					var vipCardMoneyPay = _.find(paySubjects, function (el) {
							return el.paySubjectCode == '51010609';
						}),
						vipCardPointPay = _.find(paySubjects, function (el) {
							return el.paySubjectCode == '51010613';
						}),
						vipCashVoucherPay = _.find(paySubjects, function (el) {
							return el.paySubjectCode == '51010615';
						});
					!_.isEmpty(vipCardMoneyPay) && _.extend(vipCardMoneyPay, {payTransNo : self.cardTransID});
					!_.isEmpty(vipCardPointPay) && _.extend(vipCardPointPay, {payTransNo : self.cardTransID});
					!_.isEmpty(vipCashVoucherPay) && _.extend(vipCashVoucherPay, {payTransNo : self.cardTransID});


				}).error(function (data) {

				});
				return callServer;



				// CommonCallServer.cardDeductMoney();
			};

			/**
			 * 判断会员卡扣款服务成功
			 * @return {[type]} [description]
			 */
			this.vipCardDeductMoneySuccess = function () {
				return !_.isEmpty(self.cardTransID);
			};
		}
	]);

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
				var ret = self.getOrderNotesByNotesType(30);
				var items = _.result(ret, 'items', []);
				if (!_.isEmpty(items[0].notesName)) {
					ret.items.unshift({
						label : '清空',
						value : '',
						addPriceType : 0,
						addPriceValue : 0,
						notesName : '',
						notesType : '30'
					});
				}
				return ret;
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

			/**
			 * 获取订单预定退订原因字典
			 * @return {[type]} [description]
			 */
			this.getOrderRejectNotes = function () {
				return self.getOrderNotesByNotesType(80);
			};
			/**
			 * 获取外卖类订单退订原因字典
			 * @return {[type]} [description]
			 */
			this.getTakeoutOrderRejectNotes = function () {
				return self.getOrderNotesByNotesType(90);
			};

			/**
			 * 获取退款原因字典
			 * @return {[type]} [description]
			 */
			this.getOrderRefundNotes = function () {
				return self.getOrderNotesByNotesType(100);
			};
		}
	]);

	// 订单支付科目字典服务
	app.service('PaySubjectService',[
		'$rootScope', '$location', '$filter', '$sanitize', '$sce', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, $sanitize, $sce, storage, CommonCallServer) {
			IX.ns("Hualala");
			var self = this;
			var paySubjectGroups = Hualala.TypeDef.OrderPaySubjectGroups;
			// var paySubjectGroupNames = '账单赠送,账单会员价优惠,账单折扣,账单减免,现金,银行存款,会员卡,哗啦啦,团购,代金券,挂账,账单元整'.split(',');
			self.paySubjectDict = new IX.IListManager();

			/**
			 * 初始化订单支付科目字典数据
			 * @param  {[type]} records [description]
			 * @return {[type]}         [description]
			 */
			this.initPaySubjectDict = function (records) {
				// var datas = _.indexBy(records, 'subjectGroupName');
				self.paySubjectDict.clear();
				_.each(paySubjectGroups, function (g, i) {
					var v = _.result(g, 'value', ''),
						isPrefix = _.result(g, 'isPrefix'),
						label = _.result(g, 'label', ''),
						name = _.result(g, 'name', '');
					var items = _.filter(records, function (item) {
						var subjectCode = _.result(item, 'subjectCode'),
							delta = isPrefix == "0" ? subjectCode : subjectCode.slice(0, v.length);
						return delta == v;
					});
					self.paySubjectDict.register(name, _.extend(g, {
						items : items
					}));
				});
			};

			/**
			 * 向服务器获取支付科目字典信息
			 * @param  {[type]} params  [description]
			 * @param  {[type]} success [description]
			 * @param  {[type]} error   [description]
			 * @return {[type]}         [description]
			 */
			this.getPaySubjectLst = function (params, success, error) {
				return CommonCallServer.getPaySubjectLst(params)
					.success(function (data, status, headers, config) {
						var ret = _.result(data, 'data', {});
						self.initPaySubjectDict(_.result(ret, 'records', []));
						_.isFunction(success) && success(data, status, headers, config);
					})
					.error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 获取整理后的支付科目字典数据
			 * @return {[type]} [description]
			 */
			this.getAllPaySubject = function () {
				return self.paySubjectDict.getAll();
			};

			
		}
	]);

	// 订单打折方案服务
	app.service('OrderDiscountRuleService', [
		'$rootScope', '$location', '$filter', '$sanitize', '$sce', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, $sanitize, $sce, storage, CommonCallServer) {
			IX.ns("Hualala");
			var self = this;
			var _OrderDiscountRules = null;

			/**
			 * 初始化打折方案数据
			 * @param  {[type]} records [description]
			 * @return {[type]}         [description]
			 */
			this.initDiscountRules = function (records) {
				if (_.isEmpty(records)) return;
				records.unshift({"discountWayName" : "不打折", "discountRate" : "1", "discountRange" : "0", "isVipPrice" : "0"});
				_OrderDiscountRules = _.map(records, function (el) {
					var discountWayName = _.result(el, 'discountWayName', ''),
						discountRate = _.result(el, 'discountRate', ''),
						discountRange = _.result(el, 'discountRange', ''),
						isVipPrice = _.result(el, 'isVipPrice', '');
					var txt = '<p>' + discountWayName + '</p>'
						+ (discountRate != 1 ? 
						('<p>'
						+ (discountRange == 1 ? '全部菜品' : '部分菜品')
						+ ';'
						+ (isVipPrice == 1 ? '会员价' : '售价')
						+ '</p>') : '');
					return _.extend(el, {
						label : txt,
						// 默认顺序：折扣率；折扣范围；是否执行会员价
						value : IX.id() + ';' + discountRate + ';' + discountRange + ';' + isVipPrice
					});
				});
			};

			/**
			 * 向服务器获取打折方案字典数据
			 * @param  {[type]} params  [description]
			 * @param  {[type]} success [description]
			 * @param  {[type]} error   [description]
			 * @return {[type]}         [description]
			 */
			this.getDiscountRuleLst = function (params, success, error) {
				return CommonCallServer.getDiscountRuleLst(params)
					.success(function (data, status, headers, config) {
						var ret = _.result(data, 'data', {});
						self.initDiscountRules(_.result(ret, 'records', []));
					})
					.error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 获取打折方案
			 * @return {[type]} [description]
			 */
			this.getDiscountRules = function () {
				// for test
				if (_.isEmpty(_OrderDiscountRules)) {
					var discountRuleLst = [
						{"discountWayName" : "内部员工8折", "discountRate" : "0.8", "discountRange" : "1", "isVipPrice" : "0"},
						{"discountWayName" : "7.7折", "discountRate" : "0.77", "discountRange" : "1", "isVipPrice" : "0"},
						{"discountWayName" : "8.5折", "discountRate" : "0.85", "discountRange" : "0", "isVipPrice" : "1"},
						{"discountWayName" : "5折", "discountRate" : "0.5", "discountRange" : "1", "isVipPrice" : "0"},
						{"discountWayName" : "7.3折", "discountRate" : "0.73", "discountRange" : "1", "isVipPrice" : "1"}
					];
					self.initDiscountRules(discountRuleLst);
				}
				return _OrderDiscountRules;
			};
		}
	]);


	// 会员卡服务
	app.service('VIPCardService', [
		'$rootScope', '$location', '$filter', '$sanitize', '$sce', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, $sanitize, $sce, storage, CommonCallServer) {
			IX.ns("Hualala");
			var self = this;
			// BaseInfoKeys:会员卡基本信息字段
			// BusinessKeys:会员卡金额、积分、优惠规则字段
			// cashVoucherLstKey:会员卡代金券列表
			// exchangeVoucherLst:可用现金代金券列表
			var BaseInfoKeys = 'mobileIsCardID,cardKey,cardNo,cardIsCanUsing,cardNotCanUsingNotes,cardTypeName,userMobile,customerBirthday,userSex,userName'.split(','),
				BusinessKeys = 'cardPointAsMoney,shopPointRate,pointRate,cardPointBalance,pointAsMoneyRate,cardGiveBalance,shopDiscountRate,cardCashBalance,discountRate,discountRange,isVIPPrice'.split(','),
				cashVoucherLstKey = 'cashVoucherLst',
				exchangeVoucherLstKey = 'exchangeVoucherLst';
			this.origCardData = null;
			this.BaseInfo = null;
			this.BusinessInfo = null;
			this.CashVoucherHT = new IX.IListManager();
			this.ExchangeVoucherHT = new IX.IListManager();

			/**
			 * 初始化会员卡数据
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			this.initVIPCardInfo = function (data) {
				self.BaseInfo = _.pick(data, BaseInfoKeys);
				self.BusinessInfo = _.pick(data, BusinessKeys);
				self.CashVoucherHT.clear();
				self.ExchangeVoucherHT.clear();
				var cashVouchers = _.result(data, cashVoucherLstKey, []),
					exchangeVouchers = _.result(data, exchangeVoucherLstKey, []);
				
				_.each(cashVouchers, function (el) {
					self.CashVoucherHT.register(_.result(el, 'voucherID'), el);
				});
				_.each(exchangeVouchers, function (el) {
					self.ExchangeVoucherHT.register(_.result(el, 'voucherID'), el);
				});
			};

			/**
			 * 发送请求获取会员卡信息
			 * @return {[type]} [description]
			 */
			this.loadVIPCardInfo = function (params) {
				return CommonCallServer.getVIPCardInfo(params)
					.success(function (data, status, headers, config) {
						var ret = _.result(data, 'data', {});
						self.origCardData = ret;
						if (data.code == '000') {
							self.initVIPCardInfo(ret);
						}
					});
			};

			/**
			 * 整理会员卡信息渲染数据
			 * @return {[type]} [description]
			 */
			this.mapVIPCardInfo = function () {
				return _.extend({}, self.BaseInfo, self.BusinessInfo);
			};

			/**
			 * 整理现金代金券选项数据
			 * @return {[type]} [description]
			 */
			this.mapCashVoucherOpts = function () {
				var opts = self.CashVoucherHT.getAll();
				return _.map(opts, function (opt) {
					var label = '￥' + _.result(opt, 'voucherValue') + '元',
						id = _.result(opt, 'voucherID');
					return _.extend({}, opt, {
						label : label,
						value : id
					});
				});
			};

			/**
			 * 通过代金券的ID获取代金券信息
			 * @return {[type]} [description]
			 */
			this.getCashVoucherInfoByID = function (voucherIDs) {
				voucherIDs = _.isString(voucherIDs) ? voucherIDs.split(',') : (_.isArray(voucherIDs) ? voucherIDs : null);
				if (_.isEmpty(voucherIDs) || _.isNull(voucherIDs) || _.isUndefined(voucherIDs)) {
					return self.CashVoucherHT.getAll();
				}
				return self.CashVoucherHT.getByKeys(voucherIDs);
			};

			/**
			 * 获取原始会员卡数据
			 * @return {[type]} [description]
			 */
			this.getOrigVIPCardData = function () {
				return self.origCardData;
			}

			this.clear = function () {
				self.origCardData = null;
				self.BaseInfo = null;
				self.BusinessInfo = null;
				self.CashVoucherHT.clear();
				self.ExchangeVoucherHT.clear();
			};
		}
	]);

	// 本地订单列表服务
	app.service('LocalOrderLstService', [
		'$rootScope', '$location', '$filter', '$sanitize', '$sce', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, $sanitize, $sce, storage, CommonCallServer) {
			IX.ns("Hualala");
			var self = this;
			var orderHT = new IX.IListManager(),
				totalSize = 0,
				pageNo = 1,
				pageSize = 15;

			// 初始化列表数据
			var initListData = function (records) {
				orderHT.clear();
				_.each(records, function (order) {
					var saasOrderKey = _.result(order, 'saasOrderKey');
					orderHT.register(saasOrderKey, order);
				});
			};

			var updatePageParams = function (_pageNo, _pageSize, _totalSize) {
				pageNo = _pageNo;
				pageSize = _pageSize;
				totalSize = _totalSize;
			};

			// 获取本地订单列表数据
			this.loadLocalOrderLstData = function (params) {
				var callServer = CommonCallServer.getLocalOrderLst(params);
				callServer.success(function (data) {
					var _d = _.result(data, 'data'),
						records = _.result(_d, 'records'),
						recordCount = _.result(_d, 'recordCount', 0);
					updatePageParams(_.result(params, 'pageNo', 1), _.result(params, 'pageSize', 15), recordCount);
					initListData(records);
				});
				return callServer;
			};

			// 获取当前页搜索订单结果
			this.getOrderLst = function () {
				return orderHT.getAll();
			};

			// 根据saasOrderKey获取订单数据
			this.getOrderBySaasOrderKey = function (saasOrderKey) {
				return orderHT.get(saasOrderKey);
			};

			// 获取分页信息
			this.getPaginationParams = function () {
				return {
					pageNo : pageNo,
					pageSize : pageSize,
					totalSize : totalSize
				};
			};
		}
	]);

	// 网上订单列表服务
	app.service('CloudOrderLstService', [
		'$rootScope', '$location', '$filter', '$sanitize', '$sce', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, $sanitize, $sce, storage, CommonCallServer) {
			IX.ns("Hualala");
			var self = this;
			var orderHT = new IX.IListManager(),
				totalSize = 0,
				pageNo = 1,
				pageSize = 6;

			// 初始化列表数据
			var initListData = function (records) {
				orderHT.clear();
				_.each(records, function (order) {
					var saasOrderKey = _.result(order, 'orderKey');
					orderHT.register(saasOrderKey, order);
				});
			};

			var updatePageParams = function (_pageNo, _pageSize, _totalSize) {
				pageNo = _pageNo;
				pageSize = _pageSize;
				totalSize = _totalSize;
			};
			// 获取云端订单列表数据
			this.loadCloudOrderLstData = function (params) {
				var callServer = CommonCallServer.getCloudOrderLst(params);
				callServer.success(function (data) {
					var _d = _.result(data, 'data'),
						records = _.result(_d, 'orderLst'),
						recordCount = _.result(_d, 'orderCount', 0);
					updatePageParams(_.result(params, 'pageNo', 1), _.result(params, 'pageSize', 6), recordCount);
					initListData(records);
				});
				return callServer;
			};
			// 获取当前页搜索订单结果
			this.getOrderLst = function () {
				return orderHT.getAll();
			};

			// 根据saasOrderKey获取订单数据
			this.getOrderByOrderKey = function (orderKey) {
				return orderHT.get(orderKey);
			};
			// 更新订单数据
			this.updateOrder = function (order) {
				var orderKey = _.result(order, 'orderKey');
				orderHT.register(orderKey, order);
			};

			// 获取分页信息
			this.getPaginationParams = function () {
				return {
					pageNo : pageNo,
					pageSize : pageSize,
					totalSize : totalSize
				};
			};
			//  根据orderKey判断订单条目在列表中的索引
			this.indexOfLst = function (orderKey) {
				var idx = orderHT.indexOf(orderKey);
				return idx;
			};
			// 通过orderKey获取上一条订单条目
			this.getPrevOrder = function (orderKey) {
				var idx = this.indexOfLst(orderKey) - 1;
				if (idx < 0) return null;
				return orderHT.getAll()[idx];
			};
			// 通过orderKey获取下一条订单条目
			this.getNextOrder = function (orderKey) {
				var idx = this.indexOfLst(orderKey) + 1;
				if (idx < 0) return null;
				return orderHT.getAll()[idx];
			};
			// 根据索引获取订单条目
			this.getOrderByIdx = function (idx) {
				return orderHT.getAll()[idx];
			};
			// 获取当前列表条目数
			this.getOrderLstCount = function () {
				return orderHT.getAll().length;
			};
		}
	]);

	// 网上订单数据服务
	app.service('CloudOrderService', [
		'$rootScope', '$location', '$filter', '$sanitize', '$sce', 'storage', 'CommonCallServer', 
		function ($rootScope, $location, $filter, $sanitize, $sce, storage, CommonCallServer) {
			IX.ns('Hualala');
			var self = this;
			this._OrderData = null;
			this.OrderFoodHT = new IX.IListManager();
			this.PaySubjectHT = new IX.IListManager();

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
					var itemKey = _.result(food, 'unitCode') + '_' + IX.id();
					food = _.extend(food, {
						itemKey : itemKey
					});
					// 为字典注册菜品条目数据
					_HT.register(itemKey, food);
				});
			};

			/**
			 * 初始化支付科目数据
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			this.initOrderPaySubjectDB = function (data) {
				var _HT = self.PaySubjectHT,
					paySubjects = _.result(self._OrderData, 'payLst', []);
				_HT.clear();
				_.each(paySubjects, function (pay) {
					var itemKey = _.result(pay, 'payName') + '_' + IX.id();
					_.extend(pay, {
						itemKey : itemKey
					});
					_HT.register(itemKey, pay);
				});
			};

			/**
			 * 确认网上订单
			 * @param  {[type]} params {saasOrderKey}
			 * @return {[type]}        [description]
			 */
			this.acceptCloudOrder = function (params) {
				self._OrderData = {};
				var orderKey = _.result(params, 'orderKey');
				self.OrderFoodHT.clear();
				self.PaySubjectHT.clear();
				return CommonCallServer.acceptCloudOrder({
					orderKey : orderKey
				}).success(function (data, status, headers, config) {
					var ret = _.result(data, 'data', {});
					self.initOrderFoodDB(ret);
					self.initOrderPaySubjectDB(ret);
				});
			};

			/**
			 * 根据订单号获取网上订单数据
			 * @param  {[type]} params [description]
			 * @return {[type]}        [description]
			 */
			this.getOrderByOrderKey = function (params) {
				self._OrderData = {};
				var orderKey = _.result(params, 'orderKey');
				self.OrderFoodHT.clear();
				self.PaySubjectHT.clear();
				return CommonCallServer.getCloudOrderDetail({
					orderKey : orderKey
				}).success(function (data, status, headers, config) {
					var ret = _.result(data, 'data', {});
					self.initOrderFoodDB(ret);
					self.initOrderPaySubjectDB(ret);
				});
			};
			// 获取网上订单详情
			this.getOrderDetail = function () {
				return self._OrderData;
			};
			/**
			 * 退单操作
			 * @param 	{String} rejectOrderCause 退单原因
			 * @return {[type]} [description]
			 */
			this.reject = function (rejectOrderCause) {
				return CommonCallServer.rejectCloudOrder({
					orderKey : _.result(self._OrderData, 'orderKey'),
					rejectOrderCause : rejectOrderCause
				});
			};
			/**
			 * 验单（下单）
			 * @param {String} tableName 桌台名称
			 * @return {[type]} [description]
			 */
			this.submit = function (tableName) {
				return CommonCallServer.submitCloudOrder({
					tableName : tableName || '',
					orderKey : _.result(self._OrderData, 'orderKey', ''),
					orderJson : JSON.stringify(self._OrderData)
				});
			};
			/**
			 * 退款操作
			 * @param {String} refundCause 退款原因
			 * @return {[type]} [description]
			 */
			this.refund = function (refundCause) {
				var orderTotalAmount = _.result(self._OrderData, 'orderTotalAmount', 0),
					receivableAmount = _.result(self._OrderData, 'receivableAmount', 0);
				return CommonCallServer.refundCloudOrder({
					orderKey : _.result(self._OrderData, 'orderKey'),
					orderTotal : Hualala.Common.Math.sub(orderTotalAmount, receivableAmount),
					refundCause : refundCause
				});
			};
			/**
			 * 确认送出操作
			 * @param {String} takeoutRemark 送餐备注
			 * @return {[type]} [description]
			 */
			this.confirmTakeout = function (takeoutRemark) {
				return CommonCallServer.confirmCloudOrderTakeout({
					orderKey : _.result(self._OrderData, 'orderKey'),
					takeoutRemark : takeoutRemark
				});
			};
			/**
			 * 确认送达操作
			 * @param {Object} params {orderKey}
			 * @return {[type]} [description]
			 */
			this.confirmDelivery = function () {
				return CommonCallServer.confirmCloudOrderDelivery({
					orderKey : _.result(self._OrderData, 'orderKey')
				});
			};

		}
	]);
	
});