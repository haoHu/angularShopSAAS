define(['app', 'diandan/OrderHeaderSetController'], function (app) {
	app.controller('SnackViewController', 
	[
		'$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer', 'OrderService', 'FoodMenuService', 'OrderChannel',
		function ($scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer, OrderService, FoodMenuService, OrderChannel) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			// 解析链接参数获取订单Key (saasOrderKey)
			var urlParams = $location.search(),
				saasOrderKey = _.result(urlParams, 'saasOrderKey', null);



			// 获取订单数据
			OrderService.getOrderByOrderKey(urlParams, function (data) {
				$scope.orderHeader = OrderService.getOrderHeaderData();
				IX.Debug.info("Order Header Info:");
				IX.Debug.info($scope.orderHeader);
			}, function (data) {
				HC.TopTip.addTopTips($scope, data);
			});
			
			// 加载渠道数据
			OrderChannel.loadOrderChannels({}, function (data) {
				$scope.OrderChannels = OrderChannel.getAll();
				IX.Debug.info("Order Channels: ");
				IX.Debug.info($scope.OrderChannels);
			}, function (data) {
				HC.TopTip.addTopTips($scope, data);
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
				HC.TopTip.addTopTips($scope, data);
			});

			// 切换菜品分类
			$scope.changeFoodCategory = function (cateKey) {
				FoodMenuService.setCurFoodCategory(cateKey);
			};
			
			// 为菜品分类绑定事件
			$scope.$on('foodCategory.change', function (event) {
				// 为当前作用域绑定当前菜品分类Key，并绑定当前分类下的菜品数据
				$scope.curFoodCategory = FoodMenuService.getCurFoodCategory();
				$scope.curFoods = FoodMenuService.getFoodLstByCategoryKey($scope.curFoodCategory)[$scope.curFoodCategory];

				IX.Debug.info("Current Food Menu Datas:");
				IX.Debug.info($scope.curFoodCategory);
				IX.Debug.info($scope.curFoods);

			});

		}
	]);

});
