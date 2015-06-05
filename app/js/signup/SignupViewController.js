define(['app'], function (app) {
    app.controller('SignupViewController', ['$rootScope', '$scope', '$location', 'CommonCallServer', function ($rootScope, $scope, $location, CommonCallServer) {
        $scope.reset = function () {
            $scope.signup = {
                shopID : '',
                shopSecret : ''
            };
        };
        $scope.reset();

        IX.ns("Hualala.Common");
        var HC = Hualala.Common;
        HC.TopTip.reset($rootScope);
        $scope.closeTopTip = function (index) {
            HC.TopTip.closeTopTip($rootScope, index);
        };

        $scope.submitForm = function () {
            CommonCallServer.shopRegister($scope.signup)
                .success(function (data, status) {
                    HC.TopTip.addTopTips($rootScope, data);
                    $location.path('/').replace();
                    
                })
                .error(function (data, status) {
                    HC.TopTip.addTopTips($rootScope, data);
                });
        };
    }]);
});