define(['app'], function (app) {
    app.controller('SignupViewController', [
        '$rootScope', '$scope', '$location', 'CommonCallServer', 'AppAlert',
        function ($rootScope, $scope, $location, CommonCallServer, AppAlert) {
            $scope.reset = function () {
                $scope.signup = {
                    shopID : '',
                    shopSecret : ''
                };
            };
            $scope.reset();

            IX.ns("Hualala.Common");
            var HC = Hualala.Common;

            $scope.submitForm = function () {
                CommonCallServer.shopRegister($scope.signup)
                    .success(function (data, status) {
                        var code = _.result(data, 'code');
                        AppAlert.add(code == '000' ? "success" : "danger", _.result(data, 'msg', ''));
                        code == '000' && $location.path('/').replace();
                        
                    })
                    .error(function (data, status) {
                        AppAlert.add("danger", '请求服务失败');
                        // HC.TopTip.addTopTips($rootScope, data);
                    });
            };
        }
    ]);
});