define(['app', 'uuid'], function (app, uuid) {
	app.service('OrderService', 
		['$location', '$filter', 'storage', 'CommonCallServer', function ($location, $filter, storage, CommonCallServer) {
			IX.ns('Hualala');
			var self = this;
			this._OrderData = null;
			this.OrderFoodHT = null;

			var OrderHeaderKeys = 'saasOrderKey,saasOrderNo,saasDeviceOrderNo,timeNameStart,timeNameCheckout,tableName,selfWay,channelKey,channelName,channelOrderKey,cardNo,orderSubType,person,createBy,startTime,userName,userAddress,userMobile,reportDate'.split(','),
				FoodItemKeys = "itemKey,saasOrderKey,foodCategorySortIndex,foodCategoryKey,foodCategoryName,foodSubjectKey,foodSubjectCode,foodSubjectName,departmentKeyLst,isSetFood,isSFDetail,foodKey,foodName,foodNumber,foodCancelNumber,foodSendNumber,cancelReason,cancelTime,sendReason,sendTime,isWaitConfirmNumber,unit,isDiscount,foodSourcePrice,foodProPrice,foodVipPrice,foodPayPrice,foodPayPriceReal,foodRemark,modifyReason,modifyPriceLog,modifyTime,parentFoodFromItemKey,orderBy,makeStatus,makedTime,printStatus,actionTime,createTime".split(','),
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
			var initOrderFoodDB = function () {
				var _HT = self.OrderFoodHT,
					foods = _.result(self._OrderData, 'foodLst', []);
				_.each(foods, function (food) {
					var itemKey = _.result(food, 'itemKey');
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
			 * [matchOrderFoodItemType description]
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
						self._OrderData = ret;
						initOrderFoodDB();
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
								v = 0;
								break;
							case "person":
								v = 1;
								break;
							case "createBy":
								v = _.result(storage.get('EMPINFO'), 'empCode');
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
					isNeedConfirmFoodNumber = _.result(food, 'IsNeedConfirmFoodNumber', 0),
					isSetFood = _.result(food, 'isSetFood', 0),
					setFoodDetailJson = _.result(food, 'setFoodDetailJson', ''),
					setFoodDetailLst = _.isEmpty(setFoodDetailJson) ? [] : _.result(setFoodDetailJson, 'foodLst');
				var foodItemPostKeys = 'itemKey,itemType,isSetFood,isSFDetail,foodKey,foodName,foodNumber,unit,foodProprice,foodPayPrice,foodRemark,parentFoodFromItemKey,makeStatus'.split(',');
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
						case 'isWaitConfirmNumber':
							v = isNeedConfirmFoodNumber;
							break;
						case 'isSFDetail':
							v = 0;
							break;
						case 'foodNumber':
							v = 1;
							break;
						case 'unit':
							v = _.result(foodUnit, 'unit', '');
							break;
						case 'parentFoodFromItemKey':
							v = '';
							break;
						case 'makeStatus':
							v = _.result(_.find(Hualala.TypeDef.FoodMakeStatus, function (o) {
									return o.name == 'immediate';
								}), 'value');
						default :
							v = _.result(food, k, '');
							break;
					}
					ret[k] = v;
				});
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
				var isNeedConfirmFoodNumber = _.result(food, 'IsNeedConfirmFoodNumber', 0),
					foodItemPostKeys = 'itemKey,itemType,isSetFood,isSFDetail,foodKey,foodName,foodNumber,unit,foodProprice,foodPayPrice,foodRemark,parentFoodFromItemKey,makeStatus'.split(',');
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
						case 'isWaitConfirmNumber':
							v = isNeedConfirmFoodNumber;
							break;
						case 'isSFDetail':
							v = 1;
							break;
						case 'foodNumber':
							v = _.result(food, 'number', 0);
							break;
						case 'unit':
							v = _.result(food, 'unit', '');
							break;
						case 'parentFoodFromItemKey':
							v = pItemKey;
							break;
						case 'makeStatus':
							v = '';
						default :
							v = _.result(food, k, '');
							break;
					}
					ret[k] = v;
				});
				return ret;
			};

			var mapFoodMethodItemData = function (itemKey, item, pItemKey) {
				var foodItemPostKeys = 'itemKey,itemType,isSetFood,isSFDetail,foodKey,foodName,foodNumber,unit,foodProprice,foodPayPrice,foodRemark,parentFoodFromItemKey,makeStatus'.split(',');
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
							v = _.result(item, 'notesType', '') + '-' + _.result(item, 'addPriceType', '');
							break;
						case 'isWaitConfirmNumber':
							v = '';
							break;
						case 'isSFDetail':
							v = 0;
							break;
						case 'foodNumber':
							v = _.result(item, 'number', 0);
							break;
						case 'foodPayPrice':
							v = _.result(item, 'addPriceValue', 0);
						case 'unit':
							v = _.result(item, 'unit', '');
							break;
						case 'parentFoodFromItemKey':
							v = pItemKey;
							break;
						case 'makeStatus':
							v = '';
						default :
							v = _.result(item, k, '');
							break;
					}
					ret[k] = v;
				});
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
					firstKey = _.result(firstItem, 'itemkey', '');
				self.OrderFoodHT.register(item);
				self.OrderFoodHT.insertBefore(itemKey, firstKey);
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
					firstKey = _.result(firstItem, 'itemkey', '');
				var setFoodDetailJson = _.result(food, 'setFoodDetailJson'),
					foodLst = _.result(setFoodDetailJson, 'foodLst', []);
				self.OrderFoodHT.register(item);
				self.OrderFoodHT.insertBefore(itemKey, firstKey);
				_.each(foodLst.reverse(), function (f) {
					self.insertSetFoodDetailItem(f, item);
				});
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
				self.OrderFoodHT.register(item);
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
				var item = mapFoodMethodItemData(itemKey, item, pItemKey);
				self.OrderFoodHT.register(item);
				self.OrderFoodHT.insertAfter(itemKey, pItemKey)
			};





		}]
	);
});