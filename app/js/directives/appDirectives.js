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
                        '<div class="item col-xs-12" ng-class="{hidden : !fmels.userName || fmels.userName.length == 0}">',
                            '<label for="" class="col-xs-2">姓名</label>',
                            '<span class="col-xs-10">',
                                '<span class="btn btn-default btn-block">{{fmels.userName}}</span>',
                            '</span>',
                        '</div>',
                        '<div class="item col-xs-12" ng-class="{hidden : !fmels.userMobile || fmels.userMobile.length == 0}">',
                            '<label for="" class="col-xs-2">电话</label>',
                            '<span class="col-xs-10">',
                                '<span class="btn btn-default btn-block">{{fmels.userMobile}}</span>',
                            '</span>',
                        '</div>',
                        '<div class="item col-xs-12" ng-class="{hidden : !fmels.userAddress || fmels.userAddress.length == 0}">',
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
                        if (el.hasClass('disabled')) return;
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
     * 单选按钮组选择器
     */
    app.directive('radiogroup', ["$rootScope",  "$sce", function ($rootScope, $sce) {
        return {
            restrict : 'E',
            template : [
                '<div>',
                    '<label for="" class="btn btn-default btn-radio" ng-repeat="el in groupOpts" ng-class="{active: curVal==el.value}">',
                        '<input type="radio" name="{{checkboxName}}" autocomplete="off" value="{{el.value}}" ng-checked="curVal == el.value" >',
                            '<div ng-bind-html="parseSnippet(el.label)"></div>',
                        '</input>',
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
                scope.parseSnippet = function (v) {
                    return $sce.trustAsHtml(v);
                };
                el.on('change', ':radio', function (e) {
                    scope.curVal = $(e.target).val();
                    scope.onChange({val : scope.curVal});
                });
            }
        };
    }]);

    /**
     *  多选按钮组选择器
     */
    app.directive('checkboxgroup', ["$rootScope", "$sce", function ($rootScope, $sce) {
        return {
            restrict : 'E',
            template : [
                '<div>',
                    '<label for="" class="btn btn-default btn-checkbox" ng-repeat="el in groupOpts" ng-class="{active: isChecked(el.value)}">',
                        '<input type="checkbox" name="{{checkboxName}}" autocomplete="off" id="{{el.id}}" value="{{el.value}}" ng-checked="isChecked(el.value)" >',
                            '<div ng-bind-html="parseSnippet(el.label)"></div>',
                        '</input>',
                    '</label>',
                '</div>'
            ].join(''),
            replace : true,
            scope : {
                'curVal' : '=curVal',
                'groupOpts' : '=groupOpts',
                'checkboxName' : '@checkboxName',
                'onChange' : '&onChange'
            },
            link : function (scope, el, attrs) {
                scope.parseSnippet = function (v) {
                    return $sce.trustAsHtml(v);
                };
                // scope.isChecked = function (val) {
                //     var item = _.find(scope.curVal, function (el) {
                //         return el == val;
                //     });
                //     // console.info(scope.curVal);
                //     // console.info(val);
                //     return _.isEmpty(item) ? false : true;
                // };


                el.on('change', ':checkbox', function (e) {
                    console.info('change');
                    var checkbox = $(this),
                        val = checkbox.val(),
                        isChecked = checkbox.is(':checked');
                    if (!isChecked) {
                        scope.curVal = _.without(scope.curVal, val);
                    } else {
                        scope.curVal.push(val);
                    }
                    scope.onChange({
                        val : scope.curVal,
                        checkboxName : scope.checkboxName,
                        tarScope : scope,
                        curVal : val
                    });
                    scope.$apply();
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
                    // count = scope.pagerData.length,
                    pageSize = parseInt(scope.pageSize),
                    itemSelector = scope.itemSelector;

                scope.$watch('pagerData', function (newVal, oldVal) {
                    // newVal = _.isEmpty(newVal) ? newVal : JSON.parse(newVal);
                    // oldVal = _.isEmpty(oldVal) ? oldVal : JSON.parse(oldVal);
                    // if (_.isEqual(newVal, oldVal)) return;
                    newVal = _.isEmpty(newVal) ? 0 : parseInt(newVal);
                    oldVal = _.isEmpty(oldVal) ? 0 : parseInt(oldVal);
                    // if (_.isEqual(newVal, oldVal)) return;
                    var pagerType = scope.pagerList,
                        count = newVal,
                        pageSize = parseInt(scope.pageSize),
                        noPager = pageSize >= count;
                    var items = el.find(itemSelector);
                    scope.pageNum = 0;
                    items.removeClass('hidden');
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
    
    // 订单条目操作按钮组
    app.directive('orderitemhandle', [
        "$modal", "$rootScope", "$filter", "OrderService",
        function ($modal, $rootScope, $filter, OrderService) {
            return {
                restrict : 'E',
                template : [
                    '<div class="order-btngrp">',
                        '<button class="btn btn-default btn-block" type="button" ng-disabled="!btn.active" ng-repeat="btn in OrderItemHandle" name="{{btn.name}}">',
                            '{{btn.label}}',
                        '</button>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.on('click', '.btn-block', function () {
                        var btn = $(this), act = btn.attr('name');
                        var modalSize = "lg",
                            controller = "",
                            templateUrl = "",
                            windowClass = "",
                            backdrop = "",
                            resolve = {
                                _scope : function () {
                                    return scope;
                                }
                            };
                        switch(act) {
                            case "send":
                                controller = "OrderItemSendController";
                                templateUrl = "js/diandan/orderItemSend.html";
                                break;
                            case "cancel":
                                controller = "OrderItemCancelController";
                                templateUrl = "js/diandan/orderItemCancel.html";
                                break;
                            case "delete":
                                // TODO delete order item by itemtype
                                scope.$apply("deleteSelectedOrderItem()");
                                break;
                            case "addOne":
                                // TODO +1 handle
                                scope.$apply("addSelectedOrderItem()");
                                break;
                            case "subOne":
                                // TODO -1 handle
                                scope.$apply("subSelectedOrderItem()");
                                break;
                            case "count":
                                controller = "OrderItemModifyCountController";
                                templateUrl = "js/diandan/orderItemModifyCount.html";
                                break;
                            case "price":
                                controller = "OrderItemModifyPriceController";
                                templateUrl = "js/diandan/orderItemModifyPrice.html";
                                break;
                            case "method":
                                controller = "OrderItemModifyMethodController";
                                templateUrl = "js/diandan/orderItemModifyMethod.html";
                                break;
                            case "remark":
                                controller = "OrderItemModifyRemarkController";
                                templateUrl = "js/diandan/orderItemModifyRemark.html";
                                break;
                            case "waiting":
                                // 菜品等叫
                                scope.$apply("setFoodWaiting()");
                                break;
                            case "urgent":
                                // 菜品加急
                                scope.$apply("setFoodUrgent()");
                                break;
                            case "addFood" : 
                                // 跳转点菜页面
                                scope.$apply("jumpToDinnerPage()");
                                break;
                            case "urgeFood":
                                // 菜品催叫服务
                                scope.$apply("urgeFoodAction()");
                                break;
                            case "splitFood":
                                // 拆分菜品
                                break;
                            case "changeFood":
                                // 菜品换台
                            case "changeOrder":
                                // 账单换台
                            case "mergeOrder":
                                // 账单并台
                                controller = "ChangeTableController";
                                templateUrl = "js/diandan/changeTable.html";
                                windowClass = "table-modal";
                                backdrop = "static";
                                resolve = {
                                    _scope : function () {
                                        return _.extend(scope, {
                                            curOrderAction : act
                                        });
                                    }
                                };
                                break;


                        }
                        var modalAction = _.indexOf('delete,addOne,subOne,waiting,urgent,addFood,urgeFood,splitFood'.split(','), act);
                        if (modalAction == -1) {
                             $modal.open({
                                size : modalSize,
                                windowClass : windowClass,
                                controller : controller,
                                templateUrl : templateUrl,
                                resolve : resolve,
                                backdrop : backdrop
                            });
                        }
                    });
                }
            }
        }
    ]);

    // 订单列表
    app.directive('orderlist', [
        "$rootScope", "$filter", "OrderService", 
        function ($rootScope, $filter, OrderService) {
            return {
                restrict : 'E',
                template : [
                    '<ul class="list-unstyled grid-body" >',
                        '<li class="row grid-row" ng-repeat="el in curOrderItems" ng-class="{\'food-item\' : (el.__nodeType == 0), \'food-child-item\' : (el.__nodeType != 0), ordered : el.printStatus == 2, setfood : (el.isSetFood == 1 && el.isSFDetail == 0), \'check-count\' : (el.isNeedConfirmFoodNumber > 0), active : (curFocusOrderItemKey == el.itemKey)}" item-key="{{el.itemKey}}" ng-click="selectOrderItem(el.itemKey)" >',
                            '<span class="col-xs-1 grid-cell txt" ng-if="el.__nodeType == 0"><span class="make-status" title="{{el.makeStatus}}"></span></span>',
                            '<span class="col-xs-4 grid-cell txt" ng-class="{\'col-xs-offset-1\' : el.__nodeType != 0}">{{el.foodName}}</span>',
                            '<span class="col-xs-2 grid-cell num">{{el.foodNumber}}</span>',
                            '<span class="col-xs-2 grid-cell unit">{{el.unit}}</span>',
                            // '<span class="col-xs-3 grid-cell price">{{el.foodPayPrice}}</span>',
                            '<span class="col-xs-3 grid-cell price">{{calcFoodAmount(el)}}</span>',
                            '<div class="col-xs-12 grid-cell clearfix modifyprice" ng-class="{hidden : (!el.modifyReason || el.modifyReason.length == 0)}">',
                                '<span class="col-xs-offset-1 col-xs-11 grid-cell txt">{{el.modifyReason}}</span>',
                            '</div>',
                            '<div class="col-xs-12 grid-cell clearfix cancelreason" ng-class="{hidden : (!el.foodCancelNumber || el.foodCancelNumber == 0) }">',
                                '<span class="col-xs-offset-1 col-xs-4 grid-cell txt">{{el.cancelReason}}</span>',
                                '<span class="col-xs-2 grid-cell num">{{el.foodCancelNumber}}</span>',
                                '<span class="col-xs-3 grid-cell price"></span>',
                                '<span class="col-xs-2 grid-cell unit"></span>',
                            '</div>',
                            '<div class="col-xs-12 grid-cell clearfix sendreason" ng-class="{hidden : (!el.foodSendNumber || el.foodSendNumber == 0)}">',
                                '<span class="col-xs-offset-1 col-xs-4 grid-cell txt">{{el.sendReason}}</span>',
                                '<span class="col-xs-2 grid-cell num">{{el.foodSendNumber}}</span>',
                                '<span class="col-xs-3 grid-cell price"></span>',
                                '<span class="col-xs-2 grid-cell unit"></span>',
                            '</div>',
                            '<div class="col-xs-12 grid-cell clearfix foodremark" ng-class="{hidden : (!el.foodRemark || el.foodRemark.length == 0)}">',
                                '<span class="col-xs-offset-1 col-xs-11 grid-cell txt">{{el.foodRemark}}</span>',
                            '</div>',
                        '</li>',
                    '</ul>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.on('click', '.food-item, .food-child-item', function (e) {
                        var itemEl = $(this);
                        if (attr.type == 'multiple') {
                            itemEl[itemEl.hasClass('active') ? 'removeClass' : 'addClass']('active');
                        } else {
                            el.find('.food-item, .food-child-item').removeClass('active');
                            itemEl.addClass('active');   
                        }
                        
                    });
                }
            };

        }
    ]);

    // 订单菜品翻页
    app.directive('orderPager', [
        "$rootScope", "$filter", "OrderService",
        function ($rootScope, $filter, OrderService) {
            return {
                restrict : 'A',
                link : function (scope, el, attr) {
                    // 获取下一页开始条目
                    var getNextPageStartItem = function () {
                        var orderItems = OrderService.getOrderFoodItemsHT().getAll();
                        var jOrderList = $('.order-list'), jGridBody = $('.grid-body', jOrderList);
                        var orderListRect = jOrderList[0].getBoundingClientRect();
                        var nextItem = _.find(orderItems, function (item) {
                            var itemKey = _.result(item, 'itemKey'),
                                itemSelector = '.food-item[item-key=' + itemKey + '], .food-child-item[item-key=' + itemKey + ']',
                                jItem = $(itemSelector),
                                itemRect = jItem[0].getBoundingClientRect();
                            var ret = null;
                            if (orderListRect.bottom - parseFloat(jOrderList.css('paddingBottom')) - itemRect.top >= 0 
                                && orderListRect.bottom - parseFloat(jOrderList.css('paddingBottom')) - itemRect.bottom < 0) {
                                // 当前条目一部分在显示范围内，一部分在显示范围外
                                ret = jItem;
                            } else if (orderListRect.bottom - parseFloat(jOrderList.css('paddingBottom')) - itemRect.bottom < 0) {
                                // 当前条目在显示范围外
                                ret = jItem;
                            } 
                            return ret;
                        });
                        if (!_.isEmpty(nextItem)) {
                            nextItem = OrderService.getRootParentItem(_.result(nextItem, 'itemKey'));
                        }
                        return nextItem;
                    };
                    // 获取上一页开始条目
                    var getPrevPageStartItem = function () {
                        var orderItems = OrderService.getOrderFoodItemsHT().getAll();
                        var jOrderList = $('.order-list'), jGridBody = $('.grid-body', jOrderList);
                        var orderListRect = jOrderList[0].getBoundingClientRect();
                        var nextItem = _.find(_.clone(orderItems).reverse(), function (item) {
                            var itemKey = _.result(item, 'itemKey'),
                                itemSelector = '.food-item[item-key=' + itemKey + '], .food-child-item[item-key=' + itemKey + ']',
                                jItem = $(itemSelector),
                                itemRect = jItem[0].getBoundingClientRect();
                            var ret = null;
                            if (orderListRect.top - itemRect.top > orderListRect.height - parseFloat(jOrderList.css('paddingBottom'))) {
                                // 当前条目不全在可视区域内
                                ret = jItem;
                            }
                            return ret;
                        });
                        if (!_.isEmpty(nextItem)) {
                            nextItem = OrderService.getRootParentItem(_.result(nextItem, 'itemKey'));
                        }
                        if (!nextItem) {
                            nextItem = orderItems[0];
                        }
                        return nextItem;
                    };
                    el.on('click', '.btn-prev, .btn-next', function (e) {
                        IX.ns("Hualala.Common");
                        var jBtn = $(this),
                            HC = Hualala.Common;
                        var direct = jBtn.attr('pager-act');
                        var nextItem = null, jNextItem = null;
                        var jOrderList = $('.order-list');
                        if (direct == "next") {
                            nextItem = getNextPageStartItem();
                        } else {
                            nextItem = getPrevPageStartItem();
                        }

                        if (!nextItem) {
                            jBtn.attr('disabled', false);
                            return;
                        }
                        jNextItem = jOrderList.find('.food-item, .food-child-item').filter('[item-key=' + _.result(nextItem, 'itemKey') + ']');
                        
                        jOrderList.animate(
                            {scrollTop : jNextItem.offset().top - jOrderList.find('.grid-row:first').offset().top}, 
                            400, 'swing', 
                            function () {
                                jBtn.attr('disabled', false);

                            }
                        );


                        

                    });
                }
            };
        }
    ]);

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
