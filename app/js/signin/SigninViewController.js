define(['app'], function (app) {
    app.controller('SigninViewController', ['$scope', '$location', 'CommonCallServer', function ($scope, $location, CommonCallServer) {
        IX.ns("Hualala.Common");
        var HC = Hualala.Common;
        // $scope.toptips = [];

        // $scope.addTopTips = function (data) {
        //     $scope.toptips.push({
        //         code : $XP(data, 'code', null),
        //         type : ($XP(data, 'code', null) == '000' ? 'success' : 'danger'),
        //         msg : $XP(data, 'msg', "")
        //     });
        // };

        // $scope.closeTopTip = function (index) {
        //     $scope.toptips.splice(index || 0, 1);
        // };
        
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
        
        $scope.reset = function () {
            $scope.login = {
                shopName : "哗啦啦体验店",
                deviceKey : "0002",
                empCode : "",
                empPWD : ""
            };
        };

        $scope.reset();

        
        // CommonCallServer.empLogin({
        //     userName : 'huhao', 
        //     empCode : '123',
        //     password : '123455'
        // }).success(function(data, status) {
        //     $scope.data = data;
        //     $scope.status = status;
        // }).error(function (data, status) {
        //     $scope.data = data || "Request failed";
        //     $scope.status = status;
        // });
    }]);
});