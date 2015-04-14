define(['app'], function (app) {
    app.controller('SigninViewController', ['$scope', '$location', 'storage', 'CommonCallServer', function ($scope, $location, storage, CommonCallServer) {
        IX.ns("Hualala.Common");
        var HC = Hualala.Common;
        
        var shopInfo = storage.get('SHOPINFO');
        
        HC.TopTip.reset($scope);
        $scope.closeTopTip = function (index) {
            HC.TopTip.closeTopTip($scope, index);
        };

        $scope.submitForm = function () {
            CommonCallServer.empLogin($scope.login)
                .success(function (data, status) {
                    HC.TopTip.addTopTips($scope, data);
                    $location.path('/diandan').replace();
                })
                .error(function (data, status) {
                    HC.TopTip.addTopTips($scope, data);
                });
        };
        
        $scope.reset = function (shopInfo) {
            $scope.login = {
                shopName : $XP(shopInfo, 'shopName', ''),
                deviceCode : $XP(shopInfo, 'deviceCode', ''),
                empCode : "",
                empPWD : ""
            };
        };

        $scope.reset(shopInfo);
    }]);
});