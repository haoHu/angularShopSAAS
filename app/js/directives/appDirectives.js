define(['app'], function (app) {

    // app.directive("supertextvalidate", function () {
    //     return {
    //         scope : {},
    //         restrict : 'A',
    //         // transclude : true,
    //         // template : '<div ng-transclude></div>',
    //         controller : function ($scope) {
    //             $scope = {};
    //             this.notEmpty = function (val) {
    //                 $scope['notEmpty'] = !(val.length == 0);
    //                 return $scope;
    //             };
    //             this.textRange = function (val, min, max) {
    //                 var l = val.toString().length;
    //                 min = parseInt(min) || 0;
    //                 max = parseInt(max) || null;
                    
    //                 if (max === null) {
    //                     $scope['textRange'] = l > min;
    //                 } else if (max == min) {
    //                     $scope['textRange'] = l == min;
    //                 } else if (max < min) {
    //                     $scope['textRange'] = true;
    //                 } else {
    //                     $scope['textRange'] = (l < max && l > min);
    //                 }
    //                 return $scope;
    //             };
    //         },
    //         link : function (scope, element, attrs, superCtrl) {
    //             element.addClass('has-feedback');
    //             element.find(':text,:password').bind("blur", function (e) {
    //                 var vTypes = attrs.supertextvalidate.split(';');
    //                 var oValid = {};
    //                 var $this = $(this);
    //                 _.each(vTypes, function (vType) {
    //                     if (IX.isFn(superCtrl[vType])) {
    //                         switch(vType) {
    //                             case "notEmpty":
    //                                 oValid = superCtrl[vType]($this.val());
    //                                 break;
    //                             case "textRange":
    //                                 oValid = superCtrl[vType]($this.val(), attrs.min, attrs.max);
    //                                 break;
    //                         }

    //                     }
    //                 });
    //                 for (var k in oValid) {
    //                     if (!oValid[k]) {
    //                         element.removeClass('has-success').addClass('has-error');
    //                         break;
    //                     }
    //                     element.removeClass('has-error').addClass('has-success');
    //                 }
    //             });
    //         }
    //     };
    // });

    // app.directive("helpblock", function () {
    //     return {
    //         require : '^supertextvalidate',
    //         scope : {},
    //         restrict : 'E',
    //         transclude : true,
    //         template : '<div ng-transclude></div>',
    //         link : function (scope, element, attrs, superCtrl) {
    //             element.find('.help-block').hide();
    //             var $el = element.parent().find(":text,:password");
    //             var vTypes = attrs.validators.split(';');
    //             console.info(arguments)
    //             $el.bind('blur', function () {
    //                 var $this = $(this);
    //                 var oValid = {};
    //                 _.each(vTypes, function (vType) {
    //                     if (IX.isFn(superCtrl[vType])) {
    //                         switch(vType) {
    //                             case "notEmpty":
    //                                 oValid = superCtrl[vType]($this.val());
    //                                 break;
    //                             case "textRange":
    //                                 oValid = superCtrl[vType]($this.val(), attrs.min, attrs.max);
    //                                 break;
    //                         }

    //                     }
    //                 });
    //                 element.find('.help-block').hide();
    //                 for (var k in oValid) {
    //                     if (!oValid[k]) {
    //                         element.find('.help-block[bv-validator=' + k + ']').show();
    //                         break;
    //                     }
    //                 }
    //             });
    //         }

    //     };
    // });
    
    /**
     * 表单校验指令集bv-[指令名称]
     */
    app.directive('bvNotempty', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    var l = IX.isEmpty(viewValue) ? 0 : viewValue.length;
                    if (l == 0) {
                        ctrl.$setValidity('bvNotempty', false);
                        return undefined;
                    } else {
                        ctrl.$setValidity('bvNotempty', true);
                        return viewValue;
                    }
                });
            }
        };
    });

    app.directive('bvStrlength', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                var min = parseInt(attrs.min) || 0, max = parseInt(attrs.max) || null;
                ctrl.$parsers.unshift(function (viewValue) {

                    var l = IX.isEmpty(viewValue) ? 0 : viewValue.length;
                    var v = false;
                    if (max === null) {
                        v = l >= min;
                    } else if (max == min) {
                        v = l == min;
                    } else if (max < min) {
                        v = true;
                    } else {
                        v = l >= min && l <= max;
                    }
                    if (!v) {
                        ctrl.$setValidity('bvStrlength', false);
                        return undefined;
                    } else {
                        ctrl.$setValidity('bvStrlength', true);
                        return viewValue;
                    }
                });
            }
        };
    });

    /**
     * 表单提交指令fm-submit
     */
    app.directive('fmSubmit', function () {
        return {
            restrict: 'A',
            link : function (scope, element, attr) {
                element.on('click', function () {
                    scope.$apply(attr.fmSubmit);
                });
            }
        };
    });

    /**
     * 表单单头表单框
     */
    app.directive('orderheader', ["$modal", "$rootScope", function ($modal, $rootScope) {
            return {
                restrict : 'E',
                // template : '<div><div class="" ng-class="{\'col-xs-6\' : $index <= 4, \'col-xs-12\' : $index > 4}" ng-repeat="el in fmels" ><label for="" class="col-xs-4">{{el.label}}</label><span class="col-xs-8"><span class="btn btn-default btn-block">{{el.value}}</span></span></div></div>',
                template : [
                    '<div>',
                        '<div class="clearfix">',
                            '<div class="item col-xs-4"><label for="" class="col-xs-6">单号</label><span class="col-xs-6">{{fmels.saasOrderNo | getSaasOrderNo}}</span></div>',
                            '<div class="item col-xs-4"><label for="" class="col-xs-6">人数</label><span class="col-xs-6">{{fmels.person}}</span></div>',
                            '<div class="item col-xs-4"><label for="" class="col-xs-6">类型</label><span class="col-xs-6">{{fmels.orderSubType | getOrderSubTypeLabel}}</span></div>',
                        '</div>',
                        
                        '<div class="clearfix">',
                            '<div class="item col-xs-4"><label for="" class="col-xs-7">台/牌号</label><span class="col-xs-5">{{fmels.tableName}}</span></div>',
                            '<div class="item col-xs-8"><label for="" class="col-xs-3">渠道</label><span class="col-xs-9">{{fmels.channelKey | getOrderChannelLabel:channels}}</span></div>',
                        '</div>',
                        '<div class="item col-xs-12">',
                            '<label for="" class="col-xs-2">姓名</label>',
                            '<span class="col-xs-10">',
                                '<span class="btn btn-default btn-block">{{fmels.userName}}</span>',
                            '</span>',
                        '</div>',
                        '<div class="item col-xs-12">',
                            '<label for="" class="col-xs-2">电话</label>',
                            '<span class="col-xs-10">',
                                '<span class="btn btn-default btn-block">{{fmels.userMobile}}</span>',
                            '</span>',
                        '</div>',
                        '<div class="item col-xs-12">',
                            '<label for="" class="col-xs-2">地址</label>',
                            '<span class="col-xs-10">',
                                '<span class="btn btn-default btn-block">{{fmels.userAddress}}</span>',
                            '</span>',
                        '</div>',
                    '</div>'
                ].join(''),
                // transclude : true,
                replace : true,
                scope : {
                    'fmels' : '=fmels',
                    'channels' : '=channels'
                },
                link : function (scope, el, attrs) {
                    el.on('click', function (e) {
                        $modal.open({
                            size : 'lg',
                            controller : "OrderHeaderSetController",
                            templateUrl : "js/diandan/orderheaderset.html",
                            resolve : {
                                _scope : function () {
                                    return scope;
                                }
                            }
                        });
                    });
                    
                }
            }
    }]);

    /**
     * 订单类型选择器
     */
    app.directive('radiogroup', ["$rootScope", function ($rootScope) {
        return {
            restrict : 'E',
            template : [
                '<div>',
                    '<label for="" class="btn btn-default btn-radio" ng-repeat="el in groupOpts" ng-class="{active: curVal==el.value}">',
                        '<input type="radio" name="{{radioName}}" autocomplete="off" value="{{el.value}}" ng-checked="curVal == el.value" >{{el.label}}</input>',
                    '</label>',
                '</div>'
            ].join(''),
            replace : true,
            scope : {
                'curVal' : '@curVal',
                'groupOpts' : '=groupOpts',
                'radioName' : '@radioName',
                'onChange' : '&onChange'
            },
            link : function (scope, el, attrs) {
                el.on('change', ':radio', function (e) {
                    scope.curVal = $(e.target).val();
                    scope.onChange({val : scope.curVal});
                });
            }
        };
    }]);


    /**
     * 数字软键盘
     */
    app.directive('numkeyboard', function () {
        return {
            restrict : 'E',
            template : '<div class="site-numkeyboard"><table><tbody><tr><td><div class="btn btn-default btn-block btn-lg">7</div></td><td><div class="btn btn-default btn-block btn-lg">8</div></td><td><div class="btn btn-default btn-block btn-lg">9</div></td><td rowspan="2"><div class="btn btn-default btn-block btn-lg"><-</div></td></tr><tr><td><div class="btn btn-default btn-block btn-lg">4</div></td><td><div class="btn btn-default btn-block btn-lg">5</div></td><td><div class="btn btn-default btn-block btn-lg">6</div></td></tr><tr><td><div class="btn btn-default btn-block btn-lg">1</div></td><td><div class="btn btn-default btn-block btn-lg">2</div></td><td><div class="btn btn-default btn-block btn-lg">3</div></td><td rowspan="2"><div class="btn btn-default btn-block btn-lg">CE</div></td></tr><tr><td colspan="2"><div class="btn btn-default btn-block btn-lg">0</div></td><td><div class="btn btn-default btn-block btn-lg">.</div></td></tr></tbody></table></div>',
            replace : true,
            scope : {

            },
            link : function (scope, el, attrs) {
                
            }
        }
    });

    /**
     * 全键盘
     */
    // app.directive('fullkeyboard', function () {
    //     return {
    //         restrict : 'E',
    //         template : '',
    //         replace : true,
    //         scope : {},
    //         link : function (scope, el, attrs) {
                
    //         }
    //     };
    // });

    /**
     * 分页处理
     * 
     */
    app.directive('pagerList', ["$rootScope", function ($rootScope) {
        return {
            restrict : 'A',
            scope : {
                'pagerData' : '@pagerData',
                'pagerList' : '@pagerList',
                'pageSize' : '@pageSize',
                'itemSelector' : '@itemSelector',
                'btnSelector' : '@btnSelector',
                'pageNum' : '@pageNum'
            },
            link : function (scope, el, attrs) {
                var btnSelector = scope.btnSelector,
                    pagerType = scope.pagerList,
                    count = scope.pagerData.length,
                    pageSize = parseInt(scope.pageSize),
                    itemSelector = scope.itemSelector;
                
                scope.$watch('pagerData', function (newVal, oldVal) {
                    // newVal = _.isEmpty(newVal) ? newVal : JSON.parse(newVal);
                    // oldVal = _.isEmpty(oldVal) ? oldVal : JSON.parse(oldVal);
                    // if (_.isEqual(newVal, oldVal)) return;
                    newVal = _.isEmpty(newVal) ? 0 : parseInt(newVal);
                    oldVal = _.isEmpty(oldVal) ? 0 : parseInt(oldVal);
                    if (_.isEqual(newVal, oldVal)) return;
                    var pagerType = scope.pagerList,
                        count = newVal,
                        pageSize = parseInt(scope.pageSize),
                        noPager = pageSize >= count;
                    var items = el.find(itemSelector);
                    scope.pageNum = 0;
                    items.filter(function (i) {
                        return i >= pageSize;
                    }).addClass('hidden');
                    if (pagerType == 'common') {
                        if (noPager) {
                            el.find(btnSelector).addClass('disabled');
                        } else {
                            el.find(btnSelector).each(function (i, btn) {
                                var $btn = $(btn);
                                var step = parseInt($btn.attr('pager-direction'));
                                $btn[step < 0 ? 'addClass' : 'removeClass']('disabled');
                            });
                        }
                        
                    }
                });
                el.on('click', btnSelector, function (e) {
                    var btn = $(this),
                        step = parseInt(btn.attr('pager-direction')),
                        itemSelector = scope.itemSelector,
                        items = el.find(itemSelector);
                    var count = items.length,
                        pageNum = parseInt(scope.pageNum),
                        curPageNum = pageNum,
                        nextPageNum = curPageNum + step,
                        pageSize = parseInt(scope.pageSize),
                        // pagerType : loop | common
                        pagerType = scope.pagerList || 'common',
                        pageCount = Math.ceil(count / pageSize) - 1,
                        itemSelector = scope.itemSelector;
                    if (pagerType == 'loop') {
                        nextPageNum = nextPageNum > pageCount ? 0 : nextPageNum;
                    } else {
                        nextPageNum = nextPageNum > pageCount ? pageCount : (nextPageNum < 0 ? 0 : nextPageNum);
                    }
                    items.addClass('hidden');
                    items.filter(function (i) {
                        return  i >= nextPageNum * pageSize && i <= ((nextPageNum + 1) * pageSize - 1);
                    }).removeClass('hidden');
                    scope.pageNum = nextPageNum;
                    if (pagerType == 'common') {
                        el.find(btnSelector).each(function (i, btn) {
                            var $btn = $(btn);
                            var step = parseInt($btn.attr('pager-direction'));
                            if (step <= 0) {
                                $btn[scope.pageNum == 0 ? 'addClass' : 'removeClass']('disabled');
                            } else {
                                $btn[scope.pageNum == pageCount ? 'addClass' : 'removeClass']('disabled');
                            }
                        });
                    }

                });
            }
        };
    }]);
    

    app.directive('appColor', function () {
        // return function (scope, $element, attrs) {
        //     $element.css({'color' : attrs.appColor});
        // };
        return {
            restrict : 'A',
            scope : {},
            link : function (scope, $element, attrs) {
                $element.css({'color' : attrs.appColor});

            }
        };
    });



});
