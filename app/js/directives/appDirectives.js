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
                var min = parseInt(attrs.min) || 0, max = parseInt(attrs.max) || null,
                    isCanBeEmpty = attrs.bvStrlength == "true" ? false : true;
                ctrl.$parsers.unshift(function (viewValue) {
                    var l = IX.isEmpty(viewValue) ? 0 : viewValue.length;
                    var v = false;
                    if (_.isEmpty(viewValue) && isCanBeEmpty) {
                        ctrl.$setValidity('bvStrlength', true);
                        return viewValue;
                    }
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

    app.directive('bvPhone', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    var mobileReg = /^1[345789]\d{9}$/,
                        phoneReg = /(^400\-{0,1}\d+\-{0,1}\d+$)|^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$/;
                    var va = viewValue.length == 0 ? true : (mobileReg.test(viewValue) || phoneReg.test(viewValue));
                    ctrl.$setValidity('bvPhone', va);
                    return va ? viewValue : undefined;
                });
            }
        }
    });

    app.directive('bvMobile', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    var mobileReg = /^1[345789]\d{9}$/;
                    var va = viewValue.length == 0 ? true : mobileReg.test(viewValue);
                    ctrl.$setValidity('bvMobile', va);
                    return va ? viewValue : undefined;
                });
            }
        };
    });

    app.directive('bvGreaterthan', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                var min = parseFloat(attrs.min) || 0, inclusive = attrs.bvGreaterthan == "true";
                ctrl.$parsers.unshift(function (viewValue) {
                    if ((inclusive && parseFloat(viewValue) >= min) || (!inclusive && parseFloat(viewValue) > min)) {
                        ctrl.$setValidity('bvGreaterthan', true);
                        return viewValue;
                    } else {
                        ctrl.$setValidity('bvGreaterthan', false);
                        return undefined;
                    }
                });
            }
        };
    });

    app.directive('bvBetween', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                var min = parseFloat(attrs.min) || null, inclusive = attrs.bvBetween == "true",
                    max = parseFloat(attrs.max) || null;
                ctrl.$parsers.unshift(function (viewValue) {
                    var v = parseFloat(viewValue), va = false;
                    if (!min && max) {
                        va = inclusive ? (v <= max) : (v < max);
                    } else if (min && !max) {
                        va = inclusive ? (v >= min) : (v > min);
                    } else if (!min && !max) {
                        va = true;
                    } else {
                        va = inclusive ? (v <= max && v >= min) : (v < max && v > min);
                    }
                    ctrl.$setValidity('bvBetween', va);
                    return va ? viewValue : undefined;
                });

            }
        };
    });

    app.directive('bvIsint', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    var isInt = viewValue === '' ? true : /^(?:-?(?:0|[1-9][0-9]*))$/.test(viewValue);
                    ctrl.$setValidity('bvIsint', isInt);
                    return isInt ? viewValue : undefined;
                });
            }
        };
    });

    app.directive('bvFloatprecision', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                var precision = parseInt(attrs.bvFloatprecision) || 2;
                ctrl.$parsers.unshift(function (viewValue) {
                    if (_.isUndefined(viewValue)) {
                        return viewValue;
                    }
                    var v = viewValue.toString(), 
                        pIdx = v.indexOf('.'),
                        dec = v.slice(pIdx + 1);
                        va = false;
                    if (_.isNumber(parseFloat(viewValue))) {
                        va = pIdx >= 0 && dec.length > precision ? false : true;
                    } else {
                        va = true;
                    }
                    ctrl.$setValidity('bvFloatprecision', va);
                    return va ? viewValue : undefined;
                });
            }
        }
    });

    app.directive('bvIssame', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                var tarName = attrs.bvIssame;
                ctrl.$parsers.unshift(function (viewValue) {
                    var tarEl = $('input[name=' + tarName + ']'),
                        v = tarEl.val();
                    ctrl.$setValidity('bvIssame', v == viewValue);
                    return v == viewValue ? viewValue : undefined;
                });
            }
        }
    });

    app.directive('bvIsnum', function () {
        return {
            require : 'ngModel',
            link : function (scope, el, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    var isNum = _.isEmpty(viewValue) ? true : !isNaN(viewValue);
                    ctrl.$setValidity('bvIsnum', isNum);
                    return isNum ? viewValue : undefined;
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
    app.directive('orderheader', ["$modal", "$rootScope", "storage", function ($modal, $rootScope, storage) {
            return {
                restrict : 'E',
                // template : '<div><div class="" ng-class="{\'col-xs-6\' : $index <= 4, \'col-xs-12\' : $index > 4}" ng-repeat="el in fmels" ><label for="" class="col-xs-4">{{el.label}}</label><span class="col-xs-8"><span class="btn btn-default btn-block">{{el.value}}</span></span></div></div>',
                template : [
                    '<div id="order_header_handle">',
                        '<span class="more glyphicon glyphicon-chevron-right"></span>',
                        '<div class="clearfix">',
                            '<div class="item col-xs-4"><label for="" class="col-xs-6">单号</label><span class="col-xs-6">{{fmels.saasOrderNo | getSaasOrderNo}}</span></div>',
                            '<div class="item col-xs-4"><label for="" class="col-xs-6">人数</label><span class="col-xs-6">{{fmels.person}}</span></div>',
                            '<div class="item col-xs-4"><label for="" class="col-xs-6">类型</label><span class="col-xs-6">{{fmels.orderSubType | getOrderSubTypeLabel}}</span></div>',
                        '</div>',
                        
                        '<div class="clearfix">',
                            '<div class="item col-xs-6"><label for="" class="col-xs-5">台/牌号</label><span class="col-xs-7">{{fmels.tableName}}</span></div>',
                            '<div class="item col-xs-6"><label for="" class="col-xs-4">渠道</label><span class="col-xs-8">{{fmels.channelKey | getOrderChannelLabel:channels}}</span></div>',
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
                    el.on('click', function (e, act) {
                        var shopInfo = storage.get('SHOPINFO'),
                            webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
                        if (el.hasClass('disabled')) return;
                        // $modal.open({
                        //     size : 'lg',
                        //     controller : "OrderHeaderSetController",
                        //     templateUrl : "js/diandan/orderheaderset.html",
                        //     resolve : {
                        //         _scope : function () {
                        //             return scope;
                        //         }
                        //     }
                        // });
                        Hualala.ModalCom.openModal($rootScope, $modal, {
                            windowClass : webAppPageAnimationIsActive,
                            size : 'lg',
                            controller : "OrderHeaderSetController",
                            templateUrl : "js/diandan/orderheaderset.html",
                            resolve : {
                                _scope : function () {
                                    return _.extend(scope, {act : act});
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
                scope.isChecked = function (val) {
                    var item = _.find(scope.curVal, function (el) {
                        return el == val;
                    });
                    // console.info(scope.curVal);
                    // console.info(val);
                    return _.isEmpty(item) ? false : true;
                };


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
                    e.stopPropagation();
                    scope.$apply();

                });
                el.on('click', ':checkbox', function (e) {
                    e.stopPropagation();
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
            template : '<div class="site-numkeyboard"><table><tbody><tr><td><div class="btn btn-default btn-block btn-lg" value="7">7</div></td><td><div class="btn btn-default btn-block btn-lg" value="8">8</div></td><td><div class="btn btn-default btn-block btn-lg" value="9">9</div></td><td rowspan="2"><div class="btn btn-default btn-block btn-lg" value="backdrop"><-</div></td></tr><tr><td><div class="btn btn-default btn-block btn-lg" value="4">4</div></td><td><div class="btn btn-default btn-block btn-lg" value="5">5</div></td><td><div class="btn btn-default btn-block btn-lg" value="6">6</div></td></tr><tr><td><div class="btn btn-default btn-block btn-lg" value="1">1</div></td><td><div class="btn btn-default btn-block btn-lg" value="2">2</div></td><td><div class="btn btn-default btn-block btn-lg" value="3">3</div></td><td rowspan="2"><div class="btn btn-default btn-block btn-lg" value="clear">CE</div></td></tr><tr><td colspan="2"><div class="btn btn-default btn-block btn-lg" value="0">0</div></td><td><div class="btn btn-default btn-block btn-lg" value=".">.</div></td></tr></tbody></table></div>',
            replace : true,
            scope : {
                curTarget : '=curTarget'
            },
            link : function (scope, el, attrs) {
                // 获取选择区域位置，如果未选择便是光标位置
                function getSelection(domEl) {
                    return (
                        ('selectionStart' in domEl && function () {
                            var l = domEl.selectionEnd - domEl.selectionStart;
                            return {
                                start : domEl.selectionStart,
                                end : domEl.selectionEnd,
                                length : l,
                                text : domEl.value.substr(domEl.selectionStart, l)
                            };
                        }) ||
                        (document.selection && function () {
                            domEl.focus();
                            var r = document.selection.createRange();
                            if (r === null) {
                                return {
                                    start : 0,
                                    end : domEl.value.length,
                                    length : 0
                                };
                            }
                            var re = domEl.createTextRange();
                            var rc = re.duplicate();
                            re.moveToBookmark(r.getBookmark());
                            rc.setEndPoint('EndToStart', re);
                            return {
                                start : rc.text.length,
                                end : rc.text.length + r.text.length,
                                length : r.text.length,
                                text : r.text
                            };
                        }) || 
                        function () {
                            return null;
                        }
                    )();
                }
                // 替换选择
                function replaceSelection(domEl) {
                    var text = arguments[0] || '';
                    return (
                        // mozilla / dom 3.0
                        ('selectionStart' in domEl && function () {
                            domEl.value = domEl.value.substr(0, domEl.selectionStart) + text + domEl.value.substr(domEl.selectionEnd, domEl.value.length);
                            return this;
                        }) ||
                        // exploder
                        (document.selection && function () {
                            domEl.focus();
                            document.selection.createRange().text = text;
                            return this;
                        }) ||
                        // browser not supported
                        function () {
                            domEl.value += text;
                            return $(domEl)
                        }
                    )();
                }
                // 设置光标位置
                function setCaretPosition(domEl, pos) {
                    if (domEl.setSelectionRange) {
                        domEl.focus();
                        domEl.setSelectionRange(pos.start, pos.end);
                    } else if (domEl.createTextRange) {
                        var range = domEl.createTextRange();
                        range.collapse(true);
                        range.moveEnd('character', pos.start);
                        range.moveStart('charracter', pos.end);
                        range.select();
                    }
                }
                el.on('click', '.btn', function (e) {
                    var v = $(this).attr('value');
                    var tarEl = scope.curTarget;
                    if (!tarEl) return;
                    var val = tarEl.val() + '';
                    var pos = getSelection(tarEl[0]);
                    var _pos = {start : 0, end : 0};
                    switch(v) {
                        case 'backdrop':
                            if (pos.length > 0) {
                                val = val.slice(0, pos.start).concat(val.slice(pos.end));
                                _pos = {
                                    start : pos.start,
                                    end : pos.start
                                };
                            } else if (pos.start == 0) {
                                val = val;
                                _pos = pos;
                            } else {
                                val = val.slice(0, pos.start - 1).concat(val.slice(pos.end));
                                _pos = {
                                    start : pos.start - 1,
                                    end : pos.start - 1
                                };
                            }
                            break;
                        case 'clear':
                            val = '';
                            break;
                        default :
                            // tarEl.val(val.toString() + v.toString());
                            if (pos.length > 0) {
                                val = val.slice(0, pos.start).concat(v).concat(val.slice(pos.end));
                                
                            } else if (pos.start == 0) {
                                val = v.concat(val);
                                
                            } else {
                                val = val.slice(0, pos.start).concat(v).concat(val.slice(pos.end));
                                
                            }
                            _pos = {
                                start : pos.start + v.length,
                                end : pos.start + v.length
                            };
                            break;
                    }
                    tarEl.val(val);
                    setCaretPosition(tarEl[0], _pos);
                    tarEl.trigger('change');
                });
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
        "$modal", "$rootScope", "$filter", "$sce", "storage", "OrderService", "OrderPayService", "AppAlert",
        function ($modal, $rootScope, $filter, $sce, storage, OrderService, OrderPayService, AppAlert) {
            return {
                restrict : 'E',
                template : [
                    '<div class="order-btngrp">',
                        '<button class="btn btn-default btn-block {{btn.clz}}" type="button" ng-disabled="!btn.active" ng-repeat="btn in OrderItemHandle" name="{{btn.name}}" ng-bind-html="parseSnippet(btn.label)">',
                            '{{btn.label}}',
                        '</button>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    // html解析
                    scope.parseSnippet = function (str) {
                        return $sce.trustAsHtml(str); 
                    };
                    el.on('click', '.btn-block', function () {
                        var shopInfo = storage.get('SHOPINFO'),
                            webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
                        var btn = $(this), act = btn.attr('name');
                        var modalSize = "lg",
                            controller = "",
                            templateUrl = "",
                            windowClass = webAppPageAnimationIsActive,
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
                            case "unionOrder":
                                // 账单联台
                            case "mergeOrder":
                                // 账单并台
                                controller = "ChangeTableController";
                                templateUrl = "js/diandan/changeTable.html";
                                windowClass += " table-modal ";
                                backdrop = "static";
                                resolve = {
                                    _scope : function () {
                                        return _.extend(scope, {
                                            curOrderAction : act
                                        });
                                    }
                                };
                                break;
                            case "cashPayOrder":
                            case "payOrder":
                                controller = "PayOrderController";
                                templateUrl = "js/diandan/payOrder.html";
                                backdrop = "static";
                                resolve = {
                                    _scope : function () {
                                        scope.act = act;
                                        return scope;
                                    }
                                };
                                break;
                            default:
                                break;


                        }
                        var openOrderPayModal = function () {
                            var needConfirmFoodNumberItems = OrderService.getNeedConfirmFoodNumberItems();
                            if (needConfirmFoodNumberItems.length > 0) {
                                AppAlert.add('danger', '有菜品未确认数量,请先对菜品确认数量!');
                                scope.$apply();
                            } else {
                                OrderPayService.initOrderPay(function () {
                                    Hualala.ModalCom.openModal($rootScope, $modal, {
                                        size : modalSize,
                                        windowClass : windowClass + ' pay-modal ',
                                        controller : controller,
                                        templateUrl : templateUrl,
                                        resolve : resolve,
                                        backdrop : backdrop
                                    });
                                });
                            }
                        };
                        var modalAction = _.indexOf('delete,addOne,subOne,waiting,urgent,addFood,urgeFood,splitFood'.split(','), act);
                        if (modalAction == -1) {
                            //  $modal.open({
                            //     size : modalSize,
                            //     windowClass : windowClass,
                            //     controller : controller,
                            //     templateUrl : templateUrl,
                            //     resolve : resolve,
                            //     backdrop : backdrop
                            // });
                            if (act != "cashPayOrder" && act != "payOrder") {
                                Hualala.ModalCom.openModal($rootScope, $modal, {
                                    size : modalSize,
                                    windowClass : windowClass,
                                    controller : controller,
                                    templateUrl : templateUrl,
                                    resolve : resolve,
                                    backdrop : backdrop
                                });
                            } else {
                                openOrderPayModal();
                            }
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
                            '<span class="col-xs-3 grid-cell price">{{calcFoodAmount(el) | prettyNum}}</span>',
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
                    scope.$on('orderlst.active', function (d, itemKey) {
                        el.find('.food-item[item-key=' + itemKey + ']').addClass('active');
                        if (attr.type != 'multiple') {
                            el.find('.food-item, .food-child-item').removeClass('active');
                        }
                    });
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
                        // if (!_.isEmpty(nextItem)) {
                        //     nextItem = OrderService.getRootParentItem(_.result(nextItem, 'itemKey'));
                        // }
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
                        // if (!_.isEmpty(nextItem)) {
                        //     nextItem = OrderService.getRootParentItem(_.result(nextItem, 'itemKey'));
                        // }
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

    // 桌台选择菜单
    app.directive('tablemenu', [
        "$rootScope", "$filter", "OrderService",
        function ($rootScope, $filter, OrderService) {
            return {
                restrict : 'E',
                // templateUrl : 'js/diandan/tablemenu.html',
                template : [
                    '<div class="menu-plain">',
                        '<div class="cates">',
                            '<div class="row filter-bar">',
                                '<div class="col-xs-4">',
                                    '<div class="input-group">',
                                        '<input type="text" class="form-control input-lg" placeholder="桌台名称" ng-model="qTblName" ng-keypress="quickSelectTable($event, qTblName)">',
                                        '<span class="input-group-btn">',
                                            '<button class="btn btn-default btn-lg" type="button" ng-click="quickSelectTable($event, qTblName)">进入桌台</button>',
                                        '</span>',
                                    '</div>',
                                '</div>',
                                '<div class="col-xs-2">',
                                    '<button class="btn btn-info btn-block btn-lg" ng-click="refreshTable($event)" id="refresh_table" data-loading-text="刷新">刷新(F3)</button>',
                                '</div>',
                                '<div class="col-xs-6">',
                                    '<div class="btn-group center-block clearfix">',
                                        '<label class="btn btn-default btn-lg col-xs-4" ng-model="qTblStatus" btn-radio=\"\'-1\'\" ng-click="queryTablesByStatus(-1)">全部</label>',
                                        '<label class="btn btn-default btn-lg col-xs-4" ng-model="qTblStatus" btn-radio=\"\'0\'\" ng-click="queryTablesByStatus(0)">空闲</label>',
                                        '<label class="btn btn-default btn-lg col-xs-4" ng-model="qTblStatus" btn-radio=\"\'1\'\" ng-click="queryTablesByStatus(1)">占用<span class="badge" ng-if="getTablesCountByStatus(1) > 0" ng-bind="getTablesCountByStatus(1)"></span></label>',
                                    '</div>',
                                '</div>',
                            '</div>',
                            '<div class="area-bar row" pager-list="loop" pager-data="{{TableAreas}}" page-size="4" item-selector=".btn-area[area-name]" btn-selector=".btn-pager" page-num="0">',
                                '<div class="col-xs-2 cell-btn btn btn-all" ng-class="{active: curAreaName == \'\'}" ng-click="selectTableArea(\'\')" area-name="" ><p>全部</p></div>',
                                '<div class="col-xs-2 btn cell-btn btn-area" ng-repeat="area in TableAreas" ng-class="{active : curAreaName == area.value}" ng-click="selectTableArea(area.areaName)" area-name="{{area.areaName}}">',
                                    '<p>{{area.label}}</p>',
                                '</div>',

                                '<div class="col-xs-2 cell-btn btn btn-pager" pager-direction="+1"><span>翻页</span></div>',
                            '</div>',
                        '</div>',
                        '<div class="table-menu" pager-list="common" pager-data="{{curTables}}" page-size="34" item-selector=".cell-btn[id]" btn-selector=".btn-prev,.btn-next" page-num="0">',
                            '<div class="col-xs-2 btn cell-btn" id="{{table.tableCode}}" ng-repeat="table in curTables" ng-class="{disabled : table.tableStatus == 4, idle : table.tableStatus == 0, occupy : table.tableStatus == 1, active : table.tableName == curTableName}" table-status="{{table.tableStatus}}" book-order-no="{{table.bookOrderNo}}" ng-click="selectTableName($event, table)" ng-dblclick="selectTableName($event, table)">',
                                '<span class="table-lock" ng-if="tableIsLocked(table.lockedBy)"></span>',
                                '<span class="table-union" ng-if="tableIsUnion(table.unionTableGroupName)">{{table.unionTableGroupName || 1}}</span>',
                                '<span class="table-book" ng-if="tableIsBooked(table.bookOrderNo)"></span>',

                                '<p class="name">{{table.tableName}}</p>',
                                '<!--<p class="time" ng-if="table.tableStatus == 1">{{table.orderCreateTime | formatDateTimeStr:"HH:mm"}}</p>-->',
                                '<p class="time" ng-if="table.tableStatus == 1">{{table.orderCreateTime | formatTimeInterval}}</p>',
                                '<p class="amount" ng-if="table.tableStatus == 1">{{table.orderTotalAmount | mycurrency:"￥"}}</p>',
                            '</div>',
                            '<div class="col-xs-2 btn cell-btn btn-prev" pager-direction="-1"><p class="name">上页</p></div>',
                            '<div class="col-xs-2 btn cell-btn btn-next" pager-direction="+1"><p class="name">下页</p></div>',
                        '</div>',

                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    
                }
            }
        }
    ]);

    // 菜单菜品分类
    app.directive('foodcategory', [
        "$rootScope", "$filter", "FoodMenuService",
        function ($rootScope, $filter, FoodMenuService) {
            return {
                restrict : 'E',
                template : [
                    '<div id="food_category" class="tab cates"  pager-list="loop" pager-data="{{FoodCategories.length}}" page-size="10" item-selector=".cell-btn[food-category]" btn-selector=".btn-pager" page-num="0">',
                        '<div class="col-xs-2 btn cell-btn" ng-repeat="cate in FoodCategories" ng-class="{active : curFoodCategory == cate.foodCategoryKey}" food-category="{{cate.foodCategoryKey}}" ng-click="changeFoodCategory(cate.foodCategoryKey)">',
                            '<p>{{cate.foodCategoryName}}</p>',
                        '</div>',
                        '<div class="col-xs-2 cell-btn btn btn-search" food-search="{{curFoodCategory}}" ng-click="openSearch()"><span>搜索</span></div>',
                        '<div class="col-xs-2 cell-btn btn btn-pager" pager-direction="+1"><span>翻页</span></div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    
                }
            };
        }
    ]);

    // 菜单菜品选择部分
    app.directive('foodmenu', [
        "$rootScope", "$filter", "FoodMenuService", 
        function ($rootScope, $filter, FoodMenuService) {
            return {
                restrict : 'E',
                template : [
                    '<div id="food_menu" class="foods" pager-list="common" pager-data="{{curFoods.length}}" page-size="34" item-selector=".cell-btn[unit-key]" btn-selector=".btn-prev,.btn-next" page-num="0">',
                        '<div class="col-xs-2 btn cell-btn" ng-class="{\'soldouted\' : food.__soldout && food.__soldout.qty == 0, \'soldout-food\' : food.__soldout && food.__soldout.qty != 0}" unit-key="{{food.__foodUnit.unitKey}}" ng-repeat="food in curFoods" ng-click="insertFoodItem(food.__foodUnit.unitKey)">',
                            '<span ng-if="food.ZXJ.length > 0" class="food-tag {{getFoodTag(food)}}"></span>',
                            '<span ng-if="food.isTempFood == 1" class="tmpfood-tag"></span>',
                            '<p food-key="{{food.foodKey}}" unit-key="{{food.__foodUnit.unitKey}}">{{food.foodName}}</p>',
                            '<p class="unit">',
                                // '{{food.__foodUnit.price | currency : "￥" }}/{{food.__foodUnit.unit}}',
                                '{{food.__foodUnit.price | prettyNum}}/{{food.__foodUnit.unit}}',
                            '</p>',
                        '</div>',
                        '<div class="col-xs-2 btn cell-btn btn-prev" pager-direction="-1"><span>上页</span></div>',
                        '<div class="col-xs-2 btn cell-btn btn-next" pager-direction="+1"><span>下页</span></div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    
                }
            };
        }
    ]);

    // 沽清菜品列表
    // 订单列表
    app.directive('soldoutlist', [
        "$rootScope", "$filter", "SoldoutService", 
        function ($rootScope, $filter, SoldoutService) {
            return {
                restrict : 'E',
                template : [
                    '<ul class="list-unstyled grid-body" >',
                        '<li class="row grid-row food-item" ng-repeat="el in curSoldoutItems" item-key="{{el.unitKey}}" ng-click="selectSoldoutItem(el.unitKey)">',
                            '<span class="col-xs-4 grid-cell txt">{{el.foodName}}</span>',
                            '<span class="col-xs-2 grid-cell txt">{{el.unit}}</span>',
                            '<span class="col-xs-3 grid-cell num">{{el.qty}}</span>',
                            '<span class="col-xs-3 grid-cell num">{{el.defaultQty}}</span>',
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

    // 自动聚焦元素
    app.directive('autofocus', [
        "$timeout",
        function ($timeout) {
            return {
                restrict : 'A',
                link : function (scope, el, attr) {
                    $timeout(function () {
                        el[0].focus();
                        el[0].select();
                    })
                }
            };
        }
    ]);

    // 二维码
    app.directive('qrcode', [
        "$timeout",
        function ($timeout) {
            return {
                restrict : "A",
                scope : {
                    text : "=",
                    options : "="
                },
                link : function (scope, el, attr) {
                    var $el, options = {};
                    $el = $(el);
                    // options = {
                    //     size : $el.width()
                    // };
                    
                    scope.$watch('text', function (newText) {
                        options = _.extend(options, scope.options);
                        if (newText) {
                            options.text = newText;
                            console.info("qrcode text is :" + newText);
                            $el.empty().qrcode(options);
                        }
                    });
                }
            }
        }
    ]);

    // 热键操作
    app.directive('hotkey', [
        "$rootScope", "$timeout", "$location",
        function ($rootScope, $timeout, $location) {
            return {
                restrict : "A",
                link : function (scope, el, attr) {
                    $('body').on('keydown.hotkey', function ($event) {
                        var $tar = $($event.target);
                        // if ($tar.is("input, textarea")) return false;
                        var path = $location.path(),
                            search = $location.search(),
                            keyCode = $event.keyCode || $event.which;
                        var moudleName = path.slice(1).split('/')[0];
                        var HotKeys = Hualala.TypeDef.HotKeys;
                        IX.Debug.info("path is " + path);
                        IX.Debug.info("search is ");
                        IX.Debug.info(search);
                        IX.Debug.info("keyCode is " + $event.keyCode);
                        IX.Debug.info("charCode is " + $event.charCode);
                        IX.Debug.info("which is " + $event.which);
                        var dinnerHotKeysHandle = function (moudleName, keyCode) {
                            var $btnPlain = $('.btns-plain');
                            switch(keyCode) {
                                case HotKeys['F2']:
                                // 更改单头
                                    if ($('.modal').filter('[id!=search_food]').length == 0) {
                                        $('#order_header_handle').trigger('click');
                                    }
                                    break;
                                case HotKeys['F3']:
                                // 落单
                                    if (moudleName == 'snack') return;
                                    if ($('.modal').filter('[id!=search_food]').length == 0) {
                                        $btnPlain.find('.btn[name="submitOrder"]').trigger('click');
                                    }
                                    break;
                                case HotKeys['F6']:
                                // 结账
                                    if ($('.modal').filter('[id!=search_food]').length == 0) {
                                        $btnPlain.find('.btn[name="cashPayOrder"]').trigger('click');
                                    }
                                    break;
                                case HotKeys['F7']:
                                // 扫码结账
                                    if ($('.modal').filter('[id!=search_food]').length == 0) {
                                        $btnPlain.find('.btn[name="payOrder"]').trigger('click');
                                    }
                                    break;
                                case HotKeys['F8']:
                                // 打开钱箱
                                    if ($('.modal').filter('[id!=search_food]').length == 0) {
                                        $btnPlain.find('.btn[name="openCashBox"]').trigger('click');
                                    }
                                    break;
                                case HotKeys['F9']:
                                    if (moudleName != 'snack' && $('.modal').filter('[id!=search_food]').length == 0) {
                                        $btnPlain.find('.btn[name="return"]').trigger('click');
                                    }
                                    break;
                            }
                        };
                        var tableHotKeysHandle = function (moudleName, keyCode) {
                            if (keyCode == HotKeys['F3']) {
                                $timeout(function () {
                                    $('#refresh_table').trigger('click');
                                }, 200);
                            }
                        };
                        switch(moudleName) {
                            case "snack":
                            case "dinner":
                                IX.Debug.info("dinner|snack moudle");
                                if (moudleName == 'snack' || path.slice(1).split('/')[1] != 'table') {
                                    // 点菜页面
                                    dinnerHotKeysHandle(moudleName, keyCode);
                                }
                                if (path.slice(1).split('/')[1] == 'table') {
                                    tableHotKeysHandle(moudleName, keyCode);
                                }
                                break;
                            case "dingdan":
                                IX.Debug.info("dingdan moudle");
                                break;

                        }

                    });
                }
            }
        }
    ]);
});
