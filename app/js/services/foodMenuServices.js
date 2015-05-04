define(['app'], function (app) {
	app.service('FoodMenuService', 
		['$rootScope', '$location', '$filter', 'storage', 'CommonCallServer', function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this;
			// 当前浏览菜品分类Key
			var curCateKey = null;
			var curFoodSearchKey = null;
			// 菜品，沽清菜品源数据
			this._Foods = [];
			this._SoldOutFoods = [];
			// 菜品字典
			this.foodHT = null;
			// 菜品类别字典
			this.foodCategoryHT = null;
			// 沽清菜品字典
			this.foodSoldOutHT = null;
			


			
			/**
			 * 整理菜品数据结构
			 * @param {String} unitKey 菜品规格Key
			 * @param  {Object} food         菜品源数据
			 * 
			 * @param  {Array} foodDBKeys   菜品字典的Keys
			 * @param  {Array} foodUnitKeys 菜品规格的Keys
			 * @param {Object} foodSoldOutHT 沽清菜品字典
			 * @return {Object}              菜品数据字典中数据的存储结构
			 */
			var mapFoodDBData = function (unitKey, food, foodDBKeys, foodUnitKeys, foodSoldOutHT) {
				var ret = {},
					units = _.isArray(food.units) ? food.units : JSON.parse(food.units),
					foodUnit = _.find(units, function (unit) {
						return _.result(unit, 'unitKey') == unitKey;
					}),
					soldoutFood = foodSoldOutHT.get(unitKey);
				_.each(foodDBKeys, function (k1) {
					var val = null;
					switch(k1) {
						case "__foodUnit":
							val = {};
							_.each(foodUnitKeys, function (k2) {
								val[k2] = _.result(foodUnit, k2);
							});
							break;
						case "__soldout":
							val = _.isEmpty(soldoutFood) ? null : soldoutFood;
							break;
						case "py":
							val = _.result(food, 'foodKey').split(';') + _.result(food, 'foodKey') + ';';
							break;
						default :
							val = _.result(food, k1);
							break;
					}
					ret[k1] = val;
				});
				return ret;
			};

			/**
			 * 整理菜品分类数据结构
			 * @param  {String} foodCategoryKey    菜品分类Key
			 * @param  {[type]} foodCategoryHT     菜品分类表
			 * @param  {[type]} food               当前菜品数据
			 * @param  {[type]} FoodCategoryDBKeys 菜品分类字典数据字段
			 * @return {null}                    
			 */
			var mapFoodCategoryDBData = function (foodCategoryKey, foodCategoryHT, food, FoodCategoryDBKeys) {
				var units = _.result(food, 'units', []);
				units = _.isArray(units) ? units : JSON.parse(units);
				var mapFoodUnits = function (units) {
					return _.map(units, function (unit) {
							return _.result(unit, 'unitKey');
						});
				};
				var dt = {}, __foods;
				if (_.isEmpty(foodCategoryHT.get(foodCategoryKey))) {
					_.each(FoodCategoryDBKeys, function (k) {
						switch(k) {
							case "__foods":
								dt[k] = mapFoodUnits(units);
								break;
							default : 
								dt[k] = _.result(food, k);
								break;
						}
					});
					foodCategoryHT.register(foodCategoryKey, dt);
				} else {
					dt = foodCategoryHT.get(foodCategoryKey);
					__foods = _.result(dt, '__foods', []);
					__foods = __foods.concat(mapFoodUnits(units));
					dt.__foods = __foods;
				}
			};

			/**
			 * 整理并生成APP可用的菜品数据结构
			 * 菜品数据字典 (foodHT--key : unitKey, value : $$Food)
			 * $$Foods : [$$Food,...]
			 * $$Food : {
			 * 		foodCategoryNameAlias, foodCategoryName, foodCategoryCode, foodCategoryKey, foodSubjectKey, departmentKeyLst, 
			 * 		foodKey, foodName, foodCode, isDiscount, minOrderCount, IsNeedConfirmFoodNumber, description, tasteList, 
			 * 		makingMethodList, hotTag, ZXJ, salesCount, takeawayTag, takeoutPackagingFee, isSetFood, 
			 * 		setFoodDetailJson, __foodUnit : $$FoodUnit, __soldout : {qty}
			 *   }
			 * $$FoodUnit : {
			 * 		unitKey, unit, originalPrice, price, vipPrice
			 *   }
			 *
			 * 菜品分类数据字典 (foodCategoryHT--key : foodCategoryKey, value : $$FoodCategory)
			 * $$FoodCategory : {
			 * 		foodCategoryNameAlias, foodCategoryName, foodCategoryCode, foodCategoryKey, __foods : [$$FoodUnitKeys]
			 * 	}
			 * $$FoodUnitKeys : unitKey
			 *
			 * 菜品沽清数据字典 (foodSoldOutHT--key : unitKey, value : {unitKey, qty})
			 */
			var initFoodMenuDB = function () {
				var foodHT = new IX.IListManager(),
					foodCategoryHT = new IX.IListManager(),
					foodSoldOutHT = new IX.IListManager();
				var FoodDBKeys = ('foodCategoryNameAlias,foodCategoryName,foodCategoryCode,foodCategoryKey,foodSubjectKey,departmentKeyLst,'
										+ 'foodKey,foodName,foodCode,isDiscount,minOrderCount,IsNeedConfirmFoodNumber,description,tasteList,'
										+ 'makingMethodList,hotTag,ZXJ,salesCount,takeawayTag,takeoutPackagingFee,isSetFood,'
										+ 'setFoodDetailJson,__foodUnit,__soldout,py').split(','),
					FoodUnitKeys = 'unitKey,unit,originalPrice,price,vipPrice'.split(','),
					FoodCategoryDBKeys = 'foodCategoryNameAlias,foodCategoryName,foodCategoryCode,foodCategoryKey,__foods'.split(',');
				// 生成沽清菜品列表字典
				_.each(self._SoldOutFoods, function (food, idx) {
					var unitKey = _.result(food, 'unitKey');
					foodSoldOutHT.register(unitKey, food);
				});
				// 生成菜品数据字典和菜品分类数据字典
				_.each(self._Foods, function (food, idx) {
					var foodKey = _.result(food, 'foodKey'),
						foodCategoryKey = _.result(food, 'foodCategoryKey'),
						units = _.result(food, 'units', []);
					units = _.isArray(units) ? units : JSON.parse(units);
					_.each(units, function (unit) {
						var unitKey = _.result(unit, 'unitKey');
						foodHT.register(unitKey, mapFoodDBData(unitKey, food, FoodDBKeys, FoodUnitKeys, foodSoldOutHT));
					});

					mapFoodCategoryDBData(foodCategoryKey, foodCategoryHT, food, FoodCategoryDBKeys);
				});
				self.foodHT = foodHT;
				self.foodCategoryHT = foodCategoryHT;
				self.foodSoldOutHT = foodSoldOutHT;
			};
			
			/**
			 * 获取菜单列表数据
			 * @param  {Object} params  请求参数
			 * @param  {Function} success 请求返回成功的回调
			 * @param  {Function} error   请求失败的回调
			 * @return {Object}         promise/deferred 模式的APIs
			 * 
			 */
			this.getFoodLst = function (params, success, error) {
				return CommonCallServer.getFoodLst(params).
					success(function (data, status, headers, config) {
						var ret = $XP(data, 'data.records', []);
						self._Foods = !ret ? [] : ret;
						_.isFunction(success) && success(data, status, headers, config);
					}).
					error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 获取沽清列表
			 * @param  {Object} params  请求参数
			 * @param  {Function} success 请求返回成功的回调
			 * @param  {Function} error   请求失败的回调
			 * @return {Object}         promise/deferred 模式的APIs
			 */
			this.getSoldOutFoodLst = function (params, success, error) {
				return CommonCallServer.getSoldOutFoodLst(params).
					success(function (data, status, headers, config) {
						var ret = $XP(data, 'data.records', []);
						self._SoldOutFoods = !ret ? [] : ret;
						_.isFunction(success) && success(data, status, headers, config);
					}).
					error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 通过菜品数据和沽清菜品数据整理app可用的菜单数据
			 * 
			 */
			this.initFoodMenuData = function (success, faild) {
				var getSoldOutFoodSuccess = function (data, status, headers, config) {
					// TODO 组装APP可用的菜单数据
					initFoodMenuDB();
					_.isFunction(success) && success(data);
				};
				var getSoldOutFoodFaild = function (data, status, headers, config) {
					// 通信失败
					_.isFunction(faild) && faild();
				};
				var getFoodLstSuccess = function (data, status, headers, config) {
					// 获取沽清菜品源数据
					self.getSoldOutFoodLst({}, getSoldOutFoodSuccess, getSoldOutFoodFaild);
				};
				var getFoodLstFaild = function (data, status, headers, config) {
					// 通信失败
					_.isFunction(faild) && faild();
				};
				self.getFoodLst({}, getFoodLstSuccess, getFoodLstFaild);

			};
			
			/**
			 * 获取菜品类别数据
			 * @param {String|Array|undefined} foodCategoryKeys 菜品分类Key
			 * @return {Array} 菜品类别数据
			 */
			this.getFoodCategoryData = function (foodCategoryKeys) {
				var isAll = _.isEmpty(foodCategoryKeys) ? true : false;
				foodCategoryKeys = _.isArray(foodCategoryKeys) ? foodCategoryKeys : [foodCategoryKeys];
				var ret = null;
				if (isAll) {
					ret = self.foodCategoryHT.getAll();
				} else {
					ret = self.foodCategoryHT.getByKeys(foodCategoryKeys);
				}
				return ret;
			};

			/**
			 * 根据foodCategoryKey获取菜品数据
			 * @param  {String|Array|undefined} foodCategoryKeys 菜品分类
			 * @return {Object}             菜品数据
			 */
			this.getFoodLstByCategoryKey = function (foodCategoryKeys) {
				var isAll = _.isEmpty(foodCategoryKeys) ? true : false;
				foodCategoryKeys = _.isArray(foodCategoryKeys) ? foodCategoryKeys : [foodCategoryKeys];
				var ret = null;
				var categories = isAll ? self.getFoodCategoryData() : self.getFoodCategoryData(foodCategoryKeys);
				var ret = {};
				_.each(categories, function (cate) {
					var foodCategoryKey = _.result(cate, 'foodCategoryKey');
					var foods = self.foodHT.getByKeys(_.result(cate, '__foods'));
					ret[foodCategoryKey] = foods;
				});
				return ret;
			};

			/**
			 * 获取第一个分类的菜品数据
			 * @return {[type]} [description]
			 */
			this.getFirstCategoryFoods = function () {
				var category = self.foodCategoryHT.getFirst(),
					foodKeys = _.result(category, '__foods');
				return self.foodHT.getByKeys(foodKeys);
			};

			/**
			 * 获取第一个菜品分类数据
			 * @return {[type]} [description]
			 */
			this.getFirstCategory = function () {
				var category = self.foodCategoryHT.getFirst();
				return category;
			};

			/**
			 * 设置用户当前选中的是是哪个菜品类别
			 * @param {[type]} v [description]
			 */
			this.setCurFoodCategory = function (v) {
				curCateKey = v;
				$rootScope.$broadcast('foodCategory.change');
			};

			/**
			 * 获取用户当前选中的菜品类别
			 * @return {String}   当前选中菜品类别
			 */
			this.getCurFoodCategory = function () {
				return curCateKey;
			};


			/**
			 * 设置当前用户搜索菜品关键字
			 * @param {string} code 搜索词
			 */
			this.setCurFoodSearchKey = function (code) {
				curFoodSearchKey = code;
				$rootScope.$broadcast('foodSearch.change');
			};

			/**
			 * 获取当前搜索关键字
			 * @return {[type]} [description]
			 */
			this.getCurFoodSearchKey = function () {
				return curFoodSearchKey;
			};

			/**
			 * 根据助记码搜索菜品
			 * @param  {String} code 菜品助记码
			 * @return {Array}       返回匹配的菜品数据队列
			 */
			this.searchFoodsByFoodCode = function (code) {
				var matcher = (new Pymatch([]));
				var foods = self.foodHT.getAll();
				var getMatchedFn = function (searchText) {
					matcher.setNames(_.map(foods, function (el) {
						return _.extend(el, {name : el.foodKey});
					}));
					var matchedSections = matcher.match(searchText);
					var matchedOptions = _.map(matchedSections, function (el, i) {
						return el[0];
					});
					
					return matchedOptions;
				};
				return getMatchedFn(code);
			};

			/**
			 * 获取菜单中菜品数据
			 * @param  {[type]} unitKey [description]
			 * @return {[type]}         [description]
			 */
			this.getFoodByUnitKey = function (unitKey) {
				return self.foodHT.get(unitKey);
			};

			/**
			 * 判断菜品是否套餐菜品（普通菜品、套餐菜品）
			 * @param  {[type]} unitKey [description]
			 * @return {[type]}         [description]
			 */
			this.isSetFood = function (unitKey) {
				var food = self.foodHT.get(unitKey),
					isSetFood = _.result(food, 'isSetFood', 0);
				return isSetFood == 1 ? true : false;
			};

		}]
	);
});