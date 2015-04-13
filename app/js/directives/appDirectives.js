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
        }
    });
    

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
