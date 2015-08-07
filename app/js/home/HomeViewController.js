define(['app'], function (app) {
	app.controller('HomeViewController', ['$rootScope', '$scope', '$location', '$timeout', 'storage', 'CommonCallServer', 'AppAlert', function ($rootScope, $scope, $location, $timeout, storage, CommonCallServer, AppAlert) {
		// TODO 如何过场？
		// 1.检测是否已注册（未注册->2;未登录->3;）
		// 2.跳转注册模块
		// 3.跳转登录模块
		// TODO 获取店铺信息
		
		IX.ns("Hualala.Common");
        var HC = Hualala.Common;
        // HC.TopTip.reset($rootScope);
        // $scope.closeTopTip = function (index) {
        //     HC.TopTip.closeTopTip($rootScope, index);
        // };

		var jumpPath = function (path) {
			var p = $timeout(function() {
				var screen2AdImageLst = _.result(storage.get('SHOPINFO'), 'screen2AdImageLst', ['http://images7.alphacoders.com/555/555837.jpg', 'http://ec4.images-amazon.com/images/I/918Th61HzWL._SL1500_.jpg', 'http://fc08.deviantart.net/fs70/f/2014/319/2/b/iron_baymax_by_harousel-d86isrh.jpg']);
                Hualala.SecondScreen.publishPostMsg('AD', {screen2AdImageLst : screen2AdImageLst});
				$location.path(path).replace();
			}, 5000);
		};
		
		
		$scope.getShopInfo = function () {
			CommonCallServer.getShopInfo({}).success(function (data, status) {
				$('.section-welcome').addClass('loaded');
				if (data.code == 'CS001') {
					// 未注册，跳转注册页面
					jumpPath('/signup');
				} else if (data.code == '000') {
					// 已注册，跳转登录页面
					// storage.set('SHOPINFO', data.data.records[0]);
					storage.set('SHOPINFO', _.result(data, 'data', {}));
					
					jumpPath('/signin');
				}
			}).error(function (data, status) {
				// HC.TopTip.addTopTips($rootScope, {
				// 	msg : Hualala.TypeDef.CommonErrorMsgs.connect_faild
				// });
				AppAlert.add('danger', Hualala.TypeDef.CommonErrorMsgs.connect_faild);
			});
		};

		
		

		$scope.getShopInfo();
		
		
	}]);
});