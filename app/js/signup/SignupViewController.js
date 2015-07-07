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

            $scope.inputKeyup = function ($event) {
                if ($event.keyCode != 13) return;
                var el = $($event.target);
                var tabIdx = parseInt(el.attr('tabIndex'));
                var nextEl = $('[tabIndex=' + (tabIdx + 1) + ']');
                
                el.blur();
                (nextEl.length > 0 && !nextEl.is('.btn')) ? nextEl.focus() : $scope.submitForm();
                
            };
        }
    ]);
});