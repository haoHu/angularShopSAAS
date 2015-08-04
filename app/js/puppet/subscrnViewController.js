define(['app'], function (app) {
	app.controller('SubscrnViewController',[
		'$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer', 'AppAlert', 'OrderService',
		function ($scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer, AppAlert, OrderService) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			$scope.curOrderItems = null;
			$scope.curQRCode = null;
			$scope.adSrc = "";
			$scope.isNoOrder = function () {
				return _.isEmpty($scope.curOrderItems);
			};
			$scope.hasQRCode = function () {
				return !_.isEmpty($scope.curQRCode);
			};
			// 初始化订单数据
			var initOrder = function (data) {
				// 订单数据模型初始化
				OrderService.clear();
				OrderService.initOrderFoodDB(data);
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
				$scope.$apply();
			};

			// 初始化支付二维码
			// data = {saasOrderKey, QRCodeType: HLL|ALIPAY|WECHAT|BAIDU}
			var initPayQRCode = function (data) {
				var saasOrderKey = _.result(data, 'saasOrderKey', null),
					QRCodeType = _.result(data, 'QRCodeType', null),
					callServer = null;
				var genQRCode = function (data) {
					$scope.curQRCode = _.result(data, 'QRCodeTxt', null);
					$scope.curQRCodeOpt = {
						render : 'image',
						size : 400,
						fill : '#000',
						background : '#fff',
						label : $scope.curQRCode
					};
					// $scope.$apply();

				};
				if (!saasOrderKey || !QRCodeType) {
					$scope.curQRCode = null;
					$scope.$apply();
					return;
				}
				callServer = CommonCallServer.getOrderCheckoutQRCode({
					saasOrderKey : saasOrderKey,
					QRCodeType : QRCodeType
				}).success(function (data) {
					var code = _.result(data, 'code');
					if (code == "000") {
						genQRCode(_.result(data, 'data'));
					} else {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add('danger', "通信失败");
				});
			};

			// 初始化广告
			var initAD = function (data) {
				$scope.adSrc = _.result(data, 'adSrc', '');
				var img = new Image(),
					$adBox = $('.ad-box');
				img.src = $scope.adSrc;
				$(img).on('load', function (e) {
					var w = img.naturalWidth, 
						h = img.naturalHeight,
						bw = $adBox.width(),
						bh = $adBox.height(),
						whp = parseFloat(w, h);
					bh = bw / whp;
					$scope.adWidth = bw;
					$scope.adHeight = bh;
					$scope.$apply();
				});
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

			$(window).on('message', function (evt) {
				var absUrl = $location.absUrl();
				if (absUrl.indexOf(evt.originalEvent.origin) == -1) {
					return;
				}
				var msgStr = evt.originalEvent.data,
					data = JSON.parse(msgStr);
				var topic = _.result(data, 'topic'),
					postData = _.result(data, 'post');
				switch (topic) {
					case "OrderDetail":
						initOrder(postData);
						break;
					case "PayQRCode":
						initPayQRCode(postData);
						break;
					case "AD":
						initAD(postData);
						break;
				}

			});
			
		}
	]);
});