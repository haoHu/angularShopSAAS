define(['app'], function (app) {
	app.controller('SoldOutViewController', [
		'$rootScope', '$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer', 'AppAlert', 'AppConfirm', 'FoodMenuService', 'SoldoutService',
		function ($rootScope, $scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer, AppAlert, AppConfirm, FoodMenuService, SoldoutService) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			var modalIsOpenning = false;
			var $searchFoodModal = $('#search_food');
			$scope.isModified = false;
			$scope.curSoldoutItems = [];
			// 设置/获取当前是否打开了详情模态窗口
			$scope.modalIsOpen = function (b) {
				if (_.isBoolean(b)) {
					modalIsOpenning = b;
				}
				return modalIsOpenning;
			};
			$scope.updateCurSoldoutItems = function (isModified) {
				var recs = SoldoutService.getSoldoutFoodLst();
				// recs = recs.length == 0 ? [
				// 	{"foodKey" : '1002', 'foodName': '冷拌水果', 'unit' : '例', unitKey : 'uk_1002', 'qty' : '0', defaultQty : '0'}
				// ] : recs;
				$scope.curSoldoutItems = recs;
				$scope.isModified = isModified;
			};
			// 加载菜单数据
			FoodMenuService.initFoodMenuData(function (data) {
				var firstCate = FoodMenuService.getFirstCategory();
				FoodMenuService.setCurFoodCategory(_.result(firstCate, 'foodCategoryKey', null));
				// 为当前作用域绑定菜品分类数据
				$scope.FoodCategories = FoodMenuService.getFoodCategoryData();
				IX.Debug.info("All FoodCategories Data:");
				IX.Debug.info($scope.FoodCategories);
				
			}, function (data) {
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});
			// 加载沽清列表
			(SoldoutService.initSoldoutLst()).success(function (data) {
				var code = _.result(data, 'code');
				if (code != "000") {
					AppAlert.add('danger', _.result(code, 'result', ''));
				}
				$scope.updateCurSoldoutItems();
			});
			// 为菜品分类绑定事件
			$scope.$on('foodCategory.change', function () {
				// 为当前作用域绑定当前菜品分类Key，并绑定当前分类下的菜品数据
				$scope.curFoodCategory = FoodMenuService.getCurFoodCategory();
				$scope.curFoods = FoodMenuService.getFoodLstByCategoryKey($scope.curFoodCategory)[$scope.curFoodCategory];

				IX.Debug.info("Current Food Menu Datas:");
				IX.Debug.info($scope.curFoodCategory);
				IX.Debug.info($scope.curFoods);

			});
			// 切换菜品分类
			$scope.changeFoodCategory = function (cateKey) {
				FoodMenuService.setCurFoodCategory(cateKey);
			};
			// 打开搜索菜品窗口
			$scope.openSearch = function () {
				$searchFoodModal.modal({
					backdrop : false
				});
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
				console.info($scope.curSearchKey);
				var matchedFoods = FoodMenuService.searchFoodsByFoodCode($scope.curSearchKey);
				$('.menu-plain .foods').addClass('hidden');

				$scope.curFoods = matchedFoods.slice(0, 35);
				IX.Debug.info("Matched Foods:");
				IX.Debug.info(matchedFoods);
				$('.menu-plain .foods').removeClass('hidden');
			};
			// 为沽清列表插入菜品条目
			// 1. 弹出配置沽清菜品表单的模态窗
			// 2. 提交表单数据，向沽清菜品数据模型中插入一条记录
			// 3. 关闭模态窗口
			// 4. 刷新沽清菜品列表
			$scope.insertFoodItem = function (unitKey) {
				var food = FoodMenuService.getFoodByUnitKey(unitKey),
					unitKey = $XP(food, '_foodUnit.unitKey'),
					isSoldoutFood = SoldoutService.isSoldoutFood(unitKey),
					isSetFood = FoodMenuService.isSetFood(unitKey);
				$scope.curFoodItem = {
					foodName : $XP(food, 'foodName', ''),
					foodKey : $XP(food, 'foodKey', ''),
					unit : $XP(food, '__foodUnit.unit', ''),
					unitKey : $XP(food, '__foodUnit.unitKey', ''),
					defaultQty : '',
					qty : '',
				};

				var modalSize = 'md',
					windowClass = '',
					backdrop = 'static',
					controller = 'SoldoutFoodSettingController',
					templateUrl = 'js/profile/soldoutfoodset.html',
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				console.info(food);
				if (isSoldoutFood) {
					AppAlert.add('danger', '该菜品已经添加到沽清列表中!');
					return;
				}
				if ($scope.modalIsOpen()) return;

				$scope.modalIsOpen(true);
				$modal.open({
					size : modalSize,
					windowClass : windowClass,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve,
					backdrop : backdrop
				});
			};

			/**
			 * 清空沽清列表
			 * @return {[type]} [description]
			 */
			$scope.cleanSoldoutFoods = function () {
				AppConfirm.add({
					msg : "是否清空沽清列表?",
					yesFn : function () {
						var c = SoldoutService.cleanSoldoutFoods();
						c.success(function () {
							$scope.updateCurSoldoutItems();
						});
					},
					noFn : function () {

					}
				})
			};

			/**
			 * [saveSetoutFoods description]
			 * @return {[type]} [description]
			 */
			$scope.commitSoldoutFoods = function () {
				AppConfirm.add({
					msg : "是否保存当前沽清菜品数据?",
					yesFn : function () {
						var c = SoldoutService.commitSoldoutFoods();
						c.success(function () {
							$scope.updateCurSoldoutItems();
						});
					},
					noFn : function () {

					}
				})
			};
			var _locationChangeStartEvt = $scope.$on('$locationChangeStart', function (ev, tarHref, curHref) {
				console.info('locationChangeStart');
				console.info(arguments);
				if ($scope.isModified) {
					var jumpRoute = function () {
						location.href = tarHref;
					};
					AppConfirm.add({
						msg : "是否保存当前沽清菜品的修改?",
						yesFn : function () {
							var c = SoldoutService.commitSoldoutFoods();
							c.success(function (data) {
								var code = _.result(data, 'code');
								if (code != '000') {
									AppAlert.add('danger', _.result(data, 'msg', ''));
									return;
								} else {
									$scope.updateCurSoldoutItems(false);
									jumpRoute();
								}
							});
						},
						noFn : function () {
							$scope.updateCurSoldoutItems(false);
							jumpRoute();
							return ;
						}
					});
					ev.preventDefault();
				} else {
					return ;
				}
				
			});
			var _locationChangeSuccessEvt = $scope.$on('$locationChangeSuccess', function (ev, tarScope, curScope) {
				console.info('locationChangeSuccess');
				console.info(arguments);
				_locationChangeStartEvt();
				_locationChangeSuccessEvt();
			});


			

		}
	]);

	app.controller('SoldoutFoodSettingController', [
		'$scope', '$modalInstance', '$filter', '$location', '_scope', 'storage', 'CommonCallServer', 'AppAlert', 'AppConfirm', 'SoldoutService',
		function ($scope, $modalInstance, $filter, $location, _scope, storage, CommonCallServer, AppAlert, AppConfirm, SoldoutService) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			var curFood = _scope.curFoodItem;
			$scope.formData = curFood;

			// 关闭窗口
			$scope.close = function () {
				AppConfirm.add({
					msg : '是否取消此沽清菜品?',
					yesFn : function () {
						SoldoutService.deleteSoldoutFoodItem($scope.formData);
						_scope.modalIsOpen(false);
						_scope.updateCurSoldoutItems(true);
						$modalInstance.close();
					},
					noFn : function () {

					}
				});
				
			};
			// 提交表单
			$scope.save = function () {
				IX.Debug.info($scope.formData);
				AppConfirm.add({
					msg : '是否保存此沽清菜品设置?',
					yesFn : function () {
						SoldoutService.addSoldoutFoodItem($scope.formData);
						_scope.modalIsOpen(false);
						_scope.updateCurSoldoutItems(true);
						$modalInstance.close();
					},
					noFn : function () {

					}
				});
			};
		}
	]);
});