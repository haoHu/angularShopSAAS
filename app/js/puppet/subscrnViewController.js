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
				setTimeout(function () {
					var imgs = $('#ad_box').find('img');
					imgs.each(function () {
						calcImgSize(this);
					});
				}, 200);
			};

			// 初始化支付二维码
			// data = {saasOrderKey, QRCodeType: HLL|ALIPAY|WECHAT|BAIDU}
			var initPayQRCode = function (data) {
				
				var saasOrderKey = _.result(data, 'saasOrderKey', null),
					QRCodeType = _.result(data, 'QRCodeType', null),
					QRCodeSize = 250,
					callServer = null,
					defaultQRCodeLabels = {
						'HLL' : '请使用哗啦啦扫描二维码支付',
						'ALIPAY' : '请使用支付宝扫描二维码支付',
						'WECHAT' : '请使用微信扫描二维码支付',
						'BAIDU' : '请使用百度扫描二维码支付'
					};
				$scope.curQRCode = _.result(data, 'curQRCode', null);
				$scope.curQRCodeTitle = _.result(data, 'curQRCodeTitle', null);
				$scope.curQRCodeLabel = _.result(data, 'curQRCodeLabel', null);
				$scope.curPayType = _.result(data, 'curPayType', null);
				$scope.curQRCodeOpt = _.result(data, 'curQRCodeOpt', null);

				if (!saasOrderKey || !QRCodeType) {
					$scope.curQRCode = null;
					$scope.curQRCodeLabel = null;
					$scope.curQRCodeOpt = null;
					$scope.$apply();
					return;
				}
			};

			// 计算广告图片宽高
			var calcImgSize = function (img) {
				var $adBox = $('#ad_box'),
					w = img.naturalWidth, h = img.naturalHeight,
					bw = $adBox.width(), bh = $adBox.height(),
					whp = parseFloat(w / h),
					id = img.id;
				if (bw > bh) {
					bw = bh * whp;
				} else {
					bh = bw / whp;
				}
				$('#' + id, $adBox).width(bw).height(bh);
			};

			// 初始化广告
			var initAD = function (data) {
				var adLst = _.result(data, 'screen2AdImageLst', []),
					adInterval = _.result(data, 'screen2AdImageIntervalTime', 120) * 1000,
					len = adLst.length,
					count = 0,
					$adBox = $('#ad_box');
				// 格式化广告图片数据
				adLst = _.map(adLst, function (el, i) {
					var ad = {}, imgSrc = el,
						id = 'ad_' + i;
						img = new Image();
					// 预加载图片
					img.src = Hualala.Global.AJAX_DOMAIN + '/' + imgSrc;
					img.id = id;
					$(img).on('load', function (e) {
						// var w = this.naturalWidth, h = this.naturalHeight,
						// 	bw = $adBox.width(), bh = $adBox.height(),
						// 	whp = parseFloat(w / h),
						// 	id = this.id;
						// if (bw > bh) {
						// 	bw = bh * whp;
						// } else {
						// 	bh = bw / whp;
						// }
						
						// $('#' + id, $adBox).width(bw).height(bh);
						calcImgSize(this);
					});
					ad = _.extend(ad, {
						id : id,
						active : i == 0 ? true : false,
						imgSrc : imgSrc,
						title : '广告' + i,
						text : '广告' + i,
						imgObj : img
					});
					return ad;
				});
				$scope.ADLst = adLst;
				$scope.adNoWrapSlides = false;
				$scope.adInterval = adInterval;
				$scope.$apply();
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

			$scope.genImgSrc = function (imgSrc) {
				// return Hualala.Global.AJAX_DOMAIN + '/' + imgSrc;
				return imgSrc;
			};

			$scope.genPayTypeImg = function (type) {
				if (_.isEmpty(type)) return '';
				var imgPath = 'img/ic_' + type.toLowerCase() + '.png';
				return imgPath;
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