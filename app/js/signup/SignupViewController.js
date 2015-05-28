define(['app'], function (app) {
    app.controller('SignupViewController', ['$scope', '$location', 'CommonCallServer', function ($scope, $location, CommonCallServer) {
        $scope.reset = function () {
            $scope.signup = {
                shopID : '',
                shopSecret : ''
            };
        };
        $scope.reset();

        IX.ns("Hualala.Common");
        var HC = Hualala.Common;
        HC.TopTip.reset($scope);
        $scope.closeTopTip = function (index) {
            HC.TopTip.closeTopTip($scope, index);
        };

        $scope.submitForm = function () {
            CommonCallServer.shopRegister($scope.signup)
                .success(function (data, status) {
                    HC.TopTip.addTopTips($scope, data);
                    $location.path('/').replace();
                    
                })
                .error(function (data, status) {
                    HC.TopTip.addTopTips($scope, data);
                });
        };
    }]);
});