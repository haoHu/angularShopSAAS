define(['app'], function (app) {
    app.controller('SignupViewController', [
        '$rootScope', '$scope', '$location', 'CommonCallServer', 'AppAlert', 'AppProgressbar',
        function ($rootScope, $scope, $location, CommonCallServer, AppAlert, AppProgressbar) {
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
                var progressbar = AppProgressbar.add('warning', '注册中，可能需要几分钟时间，请稍后...');
                CommonCallServer.shopRegister($scope.signup)
                    .success(function (data, status) {
                        var code = _.result(data, 'code');
                        AppProgressbar.close(progressbar);
                        AppAlert.add(code == '000' ? "success" : "danger", _.result(data, 'msg', ''));
                        code == '000' && $location.path('/').replace();
                        
                    })
                    .error(function (data, status) {
                        AppAlert.add("danger", '请求服务失败');
                        // HC.TopTip.addTopTips($rootScope, data);
                        AppProgressbar.close(progressbar);
                    });
            };

            $scope.inputKeypress = function ($event) {
                if ($event.keyCode != 13) return;
                var el = $($event.target);
                var tabIdx = parseInt(el.attr('tabIndex'));
                var nextEl = $('[tabIndex=' + (tabIdx + 1) + ']');
                
                el.blur();
                (nextEl.length > 0 && !nextEl.is('.btn')) ? nextEl.focus() : $scope.submitForm();
                
            };
            // 退出程序
            $scope.appExit = function (e) {
                Hualala.DevCom.exeCmd('AppExit');
            };
            // 输入框聚焦事件
            // 告诉软键盘当前操作控件
            $scope.inputFocus = function ($event) {
                console.info($event);
                console.info(arguments);
                var curEl = $($event.target);
                if (!curEl.attr('readonly')) {
                    $scope.focusInputEl = curEl;
                } else {
                    $scope.focusInputEl = null;
                }
                return;

            };
        }
    ]);
});