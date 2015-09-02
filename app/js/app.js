define(['routes','services/dependencyResolverFor'], function(config, dependencyResolverFor)
{
    angular.module("ngLocale", [], ["$provide", function($provide) {
        var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
        $provide.value("$locale", {
            "DATETIME_FORMATS":{
                "MONTH":["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
                "SHORTMONTH":["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
                "DAY":["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
                "SHORTDAY":["周日","周一","周二","周三","周四","周五","周六"],
                "AMPMS":["上午","下午"],
                "medium":"yyyy-M-d ah:mm:ss",
                "short":"yy-M-d ah:mm",
                "fullDate":"y年M月d日EEEE",
                "longDate":"y年M月d日",
                "mediumDate":"yyyy-M-d",
                "shortDate":"yy-M-d",
                "mediumTime":"ah:mm:ss",
                "shortTime":"ah:mm"},
                "NUMBER_FORMATS":{
                    "DECIMAL_SEP":".",
                    "GROUP_SEP":",",
                    "PATTERNS":[{"minInt":1,"minFrac":0,"macFrac":0,"posPre":"","posSuf":"","negPre":"-","negSuf":"","gSize":3,"lgSize":3,"maxFrac":3},{"minInt":1,"minFrac":2,"macFrac":0,"posPre":"\u00A4","posSuf":"","negPre":"\u00A4-","negSuf":"","gSize":3,"lgSize":3,"maxFrac":2}],
                    "CURRENCY_SYM":"¥"
                },
                "pluralCat":function (n) {  return PLURAL_CATEGORY.OTHER;},
                "id":"zh"
            });
    }]);
    angular.module("ui.bootstrap.tpls", ["template/accordion/accordion-group.html","template/accordion/accordion.html","template/alert/alert.html","template/carousel/carousel.html","template/carousel/slide.html","template/datepicker/datepicker.html","template/datepicker/day.html","template/datepicker/month.html","template/datepicker/popup.html","template/datepicker/year.html","template/modal/backdrop.html","template/modal/window.html","template/pagination/pager.html","template/pagination/pagination.html","template/tooltip/tooltip-html-unsafe-popup.html","template/tooltip/tooltip-popup.html","template/popover/popover.html","template/progressbar/bar.html","template/progressbar/progress.html","template/progressbar/progressbar.html","template/rating/rating.html","template/tabs/tab.html","template/tabs/tabset.html","template/timepicker/timepicker.html","template/typeahead/typeahead-match.html","template/typeahead/typeahead-popup.html", "js/template/modal.html"]);
    angular.module("js/template/modal.html", []).run(["$templateCache", function($templateCache) {
      $templateCache.put("js/template/modal.html",
        "<div tabindex=\"-1\" role=\"dialog\" class=\"modal \" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10, display: 'block'}\" ng-click=\"close($event)\">\n" +
        "    <div class=\"modal-dialog\" ng-class=\"{'modal-sm': size == 'sm', 'modal-lg': size == 'lg'}\"><div class=\"modal-content\" modal-transclude></div></div>\n" +
        "</div>");
    }]);
    var app = angular.module('app', ['ngRoute', 'ngResource', 'ui.bootstrap', 'angularLocalStorage', 'ngSanitize']);

    app.config(
    [
        '$routeProvider',
        '$locationProvider',
        '$controllerProvider',
        '$compileProvider',
        '$filterProvider',
        '$provide',

        function($routeProvider, $locationProvider, $controllerProvider, $compileProvider, $filterProvider, $provide)
        {
	        app.controller = $controllerProvider.register;
	        app.directive  = $compileProvider.directive;
	        app.filter     = $filterProvider.register;
	        app.factory    = $provide.factory;
	        app.service    = $provide.service;

            // $locationProvider.html5Mode(true);
            // $locationProvider.html5Mode(true).hashPrefix('!');

            if(config.routes !== undefined)
            {
                angular.forEach(config.routes, function(route, path)
                {
                    $routeProvider.when(path, {templateUrl:route.templateUrl, resolve:dependencyResolverFor(route.dependencies)});
                });
            }

            if(config.defaultRoutePaths !== undefined)
            {
                $routeProvider.otherwise({redirectTo:config.defaultRoutePaths});
            }
        }
    ]);

    app.controller('AppController', ['$scope', '$rootScope', '$location', 'storage', function ($scope, $rootScope, $location, storage) {
        IX.ns("Hualala");
        var $navEl = $('#site_header .nav');
        $scope.curNav = $location.path();
        $scope.isWelcomPage = false;
        $scope.isSignPage = false;
        $scope.isPuppet = false;
        $scope.isFoodMakeStatusActive = _.result(storage.get('SHOPINFO'), 'isFoodMakeStatusActive', 0);
        $scope.ShopOperationMode = null;
        $scope.shopLogo = '';
        $scope.empName = '';
        if (!$rootScope.ModalLst) {
            $rootScope.ModalLst = [];
        }
        $rootScope.$on('$routeChangeSuccess', function (event) {
            var shopInfo = storage.get('SHOPINFO'),
                empInfo = storage.get('EMPINFO');
            // IX.Debug.info("Run Count: ");
            // IX.Debug.info(window.count++);
            if ($rootScope.ModalLst && _.isArray($rootScope.ModalLst)) {
                _.each($rootScope.ModalLst, function (modalinstance) {
                    modalinstance && modalinstance.close();
                });
                _.reject($rootScope.ModalLst, function (modalinstance) {
                    return _.isEmpty(modalinstance);
                });
            }
            $scope.curNav = $location.path();
            $scope.empName = _.result(empInfo, 'empName', '');
            $scope.ShopOperationMode = $XP(shopInfo, 'operationMode');
            $scope.isSignPage = $scope.curNav == '/signin' || $scope.curNav == '/signup' ? true : false;
            $scope.isPuppet = $scope.curNav == '/puppet' ? true : false;
            $scope.isWelcomPage = $scope.curNav == '/' ? true : false;
            $scope.shopLogo = _.result(storage.get('SHOPINFO'), 'logoUrl', '');
            $scope.isFoodMakeStatusActive = _.result(storage.get('SHOPINFO'), 'isFoodMakeStatusActive', 0);
            if (!_.isEmpty($scope.shopLogo)) {
                $scope.shopLogo = Hualala.Global.AJAX_DOMAIN + '/' + $scope.shopLogo;
            } else {
                // $scope.shopLogo = './img/blank.png';
            }
            var urlParams = $location.search(),
                deviceCode = _.result(urlParams, 'deviceCode', null),
                deviceKey = _.result(urlParams, 'deviceKey', null),
                deviceName = _.result(urlParams, 'deviceName', null);
            var screen2Exists = _.result(urlParams, 'Screen2Exists', 0),
                screen2Left = _.result(urlParams, 'Screen2Left', 0),
                screen2Top = _.result(urlParams, 'Screen2Top', 0),
                screen2Width = _.result(urlParams, 'Screen2Width', 0),
                screen2Height = _.result(urlParams, 'Screen2Height', 0);
            if (deviceKey && deviceName) {
                storage.set('deviceCode', deviceCode);
                storage.set('deviceKey', deviceKey);
                storage.set('deviceName', deviceName);
            }
            
            if (screen2Exists == 1) {
                storage.set('screen2Exists', screen2Exists);
                storage.set('screen2Left', screen2Left);
                storage.set('screen2Top', screen2Top);
                storage.set('screen2Width', screen2Width);
                storage.set('screen2Height', screen2Height);
            }
            
            if ($scope.isWelcomPage) {
                $scope.openSecondScreen();
            }
            $scope.initSocket();
        });
        $scope.checkNavBtnActive = function (_curNav, _href) {
            var reg = new RegExp('^' + _href);
            return reg.test(_curNav);
        };
        $scope.navBtnClick = function (evt) {
            var curTar = $(evt.currentTarget),
                p = curTar.attr('href').slice('1');
            $navEl.find('a[href="#' + p + '"] .badge-notify').removeClass('in');
            if (p == $scope.curNav && $scope.curNav == '/jiedan') {
                $scope.$broadcast('newOrder');
            }
        };

        /**
         * 打开子屏幕页面
         * 1. 生成子屏幕页面链接
         * 2. 打开子窗口，加载子屏幕页面
         * 3. 订阅子屏幕页面需要的消息
         * @return {[type]} [description]
         */
        $scope.openSecondScreen = function () {
            var HSS = Hualala.SecondScreen,
                subWin = HSS.getSubWin();
            if (storage.get('screen2Exists') != 1 || !_.isEmpty(_.result(subWin, 'window', null))) return;
            subWin = Hualala.SecondScreen.open();
            // 订阅订单条目postMsg
            Hualala.SecondScreen.subcribePostMsg('OrderDetail');
            // 订阅订单付款二维码postMsg
            Hualala.SecondScreen.subcribePostMsg('PayQRCode');
            // 订阅广告postMsg
            Hualala.SecondScreen.subcribePostMsg('AD');
        };

        /**
         * 建立Socket通信，并订阅消息
         * @return {[type]} [description]
         */
        $scope.initSocket = function () {
            if (Hualala.PushMsg.hasSocket()) return;
            Hualala.PushMsg.initWebSocketConnect();
            // 订阅新订单消息
            Hualala.PushMsg.subcribeMsg('NewOrder', function (topic, args) {
                var msgData = _.result(args, 'msgData');
                var newOrderCount = _.result(msgData, 'newOrderCount');
                var $siteHeader = $('#site_header'),
                    $navBtn = $siteHeader.find('a[name=jiedan] .badge-notify');
                $navBtn.removeClass('in');
                if (newOrderCount > 0) {
                    $navBtn.addClass('in');
                }
            });
            // 订阅新消息
            Hualala.PushMsg.subcribeMsg('NewMsg', function (topic, args) {

            });
            // 订阅自助支付消息
            Hualala.PushMsg.subcribeMsg('SelfPay', function (topic, args) {

            });
            // 订阅基本信息更新消息
            Hualala.PushMsg.subcribeMsg('BaseUpdate', function (topic, args) {

            });
        };
        
        
        
        // var HC = Hualala.Common;
        // HC.TopTip.reset($rootScope);
        // $scope.closeTopTip = function (index) {
        //     HC.TopTip.closeTopTip($rootScope, index);
        // };
    }]);


   return app;
});