define(['app'], function(app)
{
	app.controller('HuiYuanViewController',
    [
        '$scope','CommonCallServer', 'AppAlert', 'HuiYuanTabsService',

        function($scope, CommonCallServer, AppAlert, HuiYuanTabsService)
        {
            $scope.CCS = CommonCallServer;
            $scope.AA = AppAlert;

            $scope.tabs =
            [
                {class: 'active', active: true, label: '入会办卡', tabname: 'join'},
                {class: '', active: true, label: '储值', tabname: 'recharge'},
                {class: '', active: true, label: '消费刷卡', tabname: 'consume'},
                {class: '', active: true, label: '卡操作', tabname: 'cardhandle'},
                {class: '', active: true, label: '报表', tabname: 'report'}
            ];

            $scope.rechargeplans = [];

            $scope.panel_userinfo = {
                show: function() {
                    $('.userinfo').show();
                    $('.panel-vouchers').show();
                },
                hide: function() {
                    $('.userinfo').hide();
                    $('.panel-vouchers').hide();
                }
            };

            //点击查询按钮时打开会员信息面板
            $('.section-huiyuan').on('click', '.btn-query', function() {
                if($scope.cardnumber) {
                    CommonCallServer.getVIPCardInfo({
                        cardNoOrMobile: $scope.cardnumber
                    }).success(function(data) {
                        if(data.code == '000') {
                            var d = data.data;

                            $scope.setUserInfo(d);

                            $scope.vouchers = [];
                            for(var i = 0; i < data.data.cashVoucherLst.length; i ++) {
                                var v = data.data.cashVoucherLst[i];
                                v.type = 1;
                                $scope.vouchers.push(v);
                            };
                            for(var i = 0; i < data.data.exchangeVoucherLst.length; i ++) {
                                var v = data.data.exchangeVoucherLst[i];
                                v.type = 2;
                                $scope.vouchers.push(v);
                            };
                        }
                    });
                }
            });
            $('.section-huiyuan').on('keydown', '.cardnumber', function(e) {
                if(e.type == 'keydown' && e.keyCode == 13) {
                    $('.btn-query').click();
                }
            });

            $scope.$watch('user', function(n, o, scope) {
                $('.btn-submit').each(function() {
                    if(!$(this).hasClass('btn-submit-join')) {
                        if(n) {
                            $(this).removeClass('btn-disable');
                        }else {
                            $(this).addClass('btn-disable');
                        }
                    }
                });
            });

            $scope.setUserInfo = function(d) {
                $scope.user = {
                    level: d.cardTypeName,
                    status: d.cardIsCanUsing == '1' ? '正常' : d.cardNotCanUsingNotes,
                    cardnumber: d.cardNo,
                    phone: d.userMobile,
                    name: d.userName,
                    birthday: d.customerBirthday,
                    joindate: '2015-01-01 18:11:11',
                    cashaccount: d.cardCashBalance,
                    pointaccount: d.cardPointBalance,
                    pointrate: d.pointRate,
                    joinplace: '哗啦啦体验店铺（中关村店）'
                };

                $scope.panel_userinfo.show();
            };
        }
    ]);

    //会员导航栏
    app.directive('huiyuantabs', [
        "HuiYuanTabsService",
        function (HuiYuanTabsService) {
            return {
                restrict : 'E',
                template : [
                    '<ul class="nav nav-tabs">',
                        '<li role="presentation" ng-repeat="el in tabs" ng-disabled="!tab.active" class="{{el.class}}" name="{{el.tabname}}"><a>{{el.label}}</a></li>',
                    '</ul>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.on('click', 'li', function(e) {
                        el.find('.active').removeClass('active');
                        $(this).addClass('active');

                        HuiYuanTabsService.changeTab($(this).attr('name'));

                        //scope.panel_userinfo.hide();
                    });
                }
            };
        }
    ]);

    //会员页导航栏服务
    app.service('HuiYuanTabsService', [
        function () {
            var self = this;

            //切换tab时展示对应tab内容区域
            self.changeTab = function(tabname) {
                $('.tab').hide();

                var node = $('.tab-' + tabname);
                node.show();
            };
        }
    ]);

    //会员导航栏入会办卡
    app.directive('jointab', [
        function () {
            return {
                restrict : 'E',
                template : [
                    '<div class="tab tab-join form-inline">',
                        '<div style="display:block;">',
                            '<div class="form-group">',
                                '<label>实体卡卡号</label>',
                                '<input style="width: 187px;" type="number" class="form-control realcardnumber" ng-model="realcardnumber">',
                            '</div>',
                            '<button type="button" class="btn btn-default btn-viplevel">{{level.cardLevelName}}</button>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>实体卡密码</label>',
                                '<input style="width: 187px;" type="text" class="form-control cardpassword" value="888888" ng-model="cardpassword">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>手机号码</label>',
                                '<input style="width:187px;" type="text" class="form-control phonenumber" ng-model="phonenumber">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>姓名</label>',
                                '<input style="width:106px;" type="text" class="form-control username" ng-model="username">',
                                '<input type="radio" name="sex" checked value="0" ng-model="sex">女士',
                                '<input type="radio" name="sex" value="1" ng-model="sex">先生',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>生日</label>',
                                '<input style="width:187px;" type="text" class="form-control birthday form_datetime"  ng-model="birthday">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>工本费</label>',
                                '<input type="radio" name="cardfee" checked value="0" ng-model="cardfee">免收',
                                '<input type="radio" name="cardfee" value="10" ng-model="cardfee">10元',
                                '<input type="radio" name="cardfee" value="15" ng-model="cardfee">15元',
                                '<input type="radio" name="cardfee" value="20" ng-model="cardfee">20元',
                            '</div>',
                        '</div>',
                        '<div style="display:none;" class="panel-oldcard">',
                            '<div style="display:block;margin-top:10px;">换系统原卡资金及积分转入</div>',
                            '<div style="display:block;margin-top:10px;">',
                                '<div class="form-group">',
                                    '<label>原系统卡号</label>',
                                    '<input style="width:187px;" type="text" class="form-control oldcardnumber" ng-model="oldcardnumber">',
                                '</div>',
                            '</div>',
                            '<div style="display:block;margin-top:10px;">',
                                '<div class="form-group">',
                                    '<label>储值余额</label>',
                                    '<input style="width: 58px;" type="number" class="form-control oldrechargeamount" ng-model="oldrechargeamount">',
                                    '<label style="width:60px;margin-left:1px;">积分余额</label>',
                                    '<input style="width: 58px;" type="number" class="form-control oldpointamount" ng-model="oldpointamount">',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div class="panel-viplevel" style="display:none;">',
                            '<div class="header">会员等级</div>',
                            '<ul class="table-viplevel">',
                                '<li role="presentation" ng-repeat="el in viplevels" name="{{el.cardLevelName}}" levelid="{{el.cardLevelID}}" class="{{el.def}}">',
                                    '<div class="name">{{el.cardLevelName}} {{el.isDefaultLevel? "（默认）" : ""}}</div>',
                                    '<div class="account">会员价 部分{{el.discountRate * 10}}折</div>',
                                    '<div class="point">消费100元积{{el.pointRate * 100}}分</div>',
                                '</li>',
                            '</ul>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<button type="button" class="btn btn-default btn-submit btn-submit-join">提交入会办卡</button>',
                            '</div>',
                        '</div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.find('.panel-viplevel ul').css('height', $(window).height() - 41);

                    //初始值设定
                    var init = function() {
                        scope.sex = 0;
                        scope.cardfee = 0;
                        scope.birthday = '1980-01-01';
                        scope.cardpassword = '888888';
                    };
                    init();

                    //获取集团会员参数
                    scope.CCS.getShopVipInfo({}).success(function(data) {
                        if(data.code == '000') {
                            scope.AA.add('success', '载入数据成功');

                            scope.vipinfo = data.data;

                            scope.viplevels = data.data.cardLevelList;

                            var index = viplevel.defLevel(scope.viplevels);
                            scope.level = scope.viplevels[index];

                            scope.rechargeplans = data.data.saveMoneySet;

                            if(data.data.isSysSwitchActive == '1') {
                                el.find('.panel-oldcard').show();
                            }

                            scope.$apply();
                        }else {
                            scope.AA.add('danger', data.msg);
                        }
                    });

                    var viplevel = {
                        defLevel: function(levels) {
                            for(var i = 0; i < levels.length; i ++) {
                                if(levels[i].isDefaultLevel == '1') {
                                    levels[i].def = true;
                                    scope.cardlevelid = levels[i].cardLevelID;
                                    return  i;
                                }
                            }
                        },
                        changeLevel: function(index) {
                            scope.level = scope.viplevels[index];
                            scope.$apply();
                        }
                    };

                    //点击会员等级标签时
                    el.on('click', '.panel-viplevel li', function() {
                        viplevel.changeLevel($(this).index());
                        el.find('.panel-viplevel').find('.true').removeClass('true');
                        $(this).addClass('true');
                        scope.cardlevelid = $(this).attr('levelid');
                        el.find('.panel-viplevel').hide();
                    });

                    //点击会员等级按钮时
                    el.on('click', '.btn-viplevel', function() {
                        el.find('.panel-viplevel').show();
                    });

                    //点击提交按钮时
                    el.on('click', '.btn-submit-join', function() {
                        scope.CCS.createVIPCard({
                            shopName: null,
                            cardNO: scope.realcardnumber,
                            cardLevelID: scope.cardlevelid,
                            cardFee: scope.cardfee,
                            cardPWD: scope.cardpassword,
                            customerName: scope.username,
                            customerSex: scope.sex,
                            customerMobile: scope.phonenumber,
                            isMobileChecked: '0',
                            customerBirthday: scope.birthday,
                            birthdayType: '0',
                            oldSystemcardNO: scope.oldcardnumber,
                            oldCardMoneyBalnace: scope.oldrechargeamount,
                            oldCardPointBalnace: scope.oldpointamount
                        }).success(function(data) {
                            if(data.code == '000') {
                                scope.AA.add('success', '办卡成功！');
                                scope.panel_userinfo.hide();
                                init();
                            }else{
                                scope.AA.add('danger', data.msg);
                            }
                        });
                    });
                }
            };
        }
    ]);

    //会员导航栏储值
    app.directive('rechargetab', [
        function () {
            return {
                restrict : 'E',
                template : [
                    '<div class="tab tab-recharge form-inline" style="display:none;">',
                        '<div style="display:block;">',
                            '<div class="form-group">',
                                '<label>卡号/手机号</label>',
                                '<input style="width: 187px;" type="number" ng-model="cardnumber" class="form-control cardnumber">',
                                '<button type="button" class="btn btn-default btn-query">查询</button>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:20px;">',
                            '<div class="form-group">',
                                '<label>储值金额方式</label>',
                                '<input type="radio" name="rechargeway" ng-model="rechargeway" value="0">任意金额',
                                '<input type="radio" name="rechargeway" ng-model="rechargeway" value="1">储值套餐',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;width:351px;">',
                            '<div class="panel panel-default">',
                                '<div class="panel-heading">本次储值信息</div>',
                                '<div class="panel-body" rechargeway="0">',
                                    '<div style="display:block;">',
                                        '<div class="form-group">',
                                            '<label>储值金额</label>',
                                            '<input style="width: 187px;" type="number" class="form-control rechargeamount" ng-model="rechargeamount">',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<label>储值返金额</label>',
                                            '<input style="width: 187px;" type="number" class="form-control rechargereturnamount" ng-model="rechargereturnamount">',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<label>储值返积分额</label>',
                                            '<input style="width: 187px;" type="number" class="form-control rechargereturnpoint" ng-model="rechargereturnpoint">',
                                        '</div>',
                                    '</div>',
                                '</div>',
                                '<div class="panel-body" rechargeway="1" style="display:none;">',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>付款方式</label>',
                                '<input type="radio" name="payway" ng-model="payway" value="1">现金',
                                '<input type="radio" name="payway" ng-model="payway" value="2">银行卡',
                                '<input type="radio" name="payway" ng-model="payway" value="3">支票',
                                '<input type="radio" name="payway" ng-model="payway" value="4">其他',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>备注</label>',
                                '<input style="width: 187px;" type="text" class="form-control remark" ng-model="remark">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<button type="button" class="btn btn-default btn-submit btn-submit-recharge btn-disable">提交储值</button>',
                            '</div>',
                        '</div>',
                        '<div class="panel-rechargeplan" style="display:none;">',
                            '<div class="header">储值套餐</div>',
                            '<ul class="table-rechargeplan">',
                                '<li role="presentation" ng-repeat="el in rechargeplans" setid="{{el.saveMoneySetID}}">',
                                    '<div class="name">{{el.setName}}</div>',
                                    '<div class="savemoney">*储值金额：{{el.setSaveMoney}}元</div>',
                                    '<div class="returnmoney">*送返金额：{{el.returnMoney}}元</div>',
                                '</li>',
                            '</ul>',
                        '</div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.find('.panel-rechargeplan ul').css('height', $(window).height() - 41);

                    var init = function() {
                        scope.rechargeway = 0;
                        scope.rechargeamount = 0;
                        scope.rechargereturnamount = 0;
                        scope.rechargereturnpoint = 0;
                        scope.payway = 1;
                        scope.remark = '';

                        scope.panel_userinfo.hide();
                    };
                    init();

                    scope.$watch('rechargeway', function(newValue, oldValue, scope) {
                        el.find('.panel-body[rechargeway="' + oldValue + '"]').hide();
                        el.find('.panel-body[rechargeway="' + newValue + '"]').show();

                        if(1 == newValue) {
                            $('.panel-rechargeplan').show();
                        }else {
                            $('.panel-rechargeplan').hide();
                        }
                    });

                    var rechargeplans = {
                        changePlan: function(index) {
                            scope.rechargeplan = scope.rechargeplans[index];
                            scope.$apply();
                        }
                    };

                    //点击储值套餐标签时
                    el.on('click', '.panel-rechargeplan li', function() {
                        rechargeplans.changePlan($(this).index());
                        el.find('.panel-rechargeplan').find('.active').removeClass('active');
                        $(this).addClass('active');
                        el.find('.panel-body[rechargeway="1"]').html($(this).html());;
                    });

                    //点击提交按钮时
                    el.on('click', '.btn-submit-recharge', function() {
                        if(!$(this).hasClass('disable')) {
                            scope.CCS.saveMoney({
                                cardID: scope.user.cardnumber || scope.user.phone,
                                payWayName: scope.payway,
                                saveMoneySetID: scope.rechargeway == 0 ? '' : scope.rechargeplan.saveMoneySetID,
                                transAmount: scope.rechargeway == 0 ? scope.rechargeamount : scope.rechargeplan.setSaveMoney,
                                transRemark: scope.remark,
                                transReturnMoneyAmount: scope.rechargeway == 0 ? scope.rechargereturnamount : scope.rechargeplan.returnMoney,
                                transReturnPointAmount: scope.rechargeway == 0 ? scope.rechargereturnpoint : scope.rechargeplan.returnPoint
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.AA.add('success', '储值成功！');
                                    scope.panel_userinfo.hide();
                                    init();
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }
                    });
                }
            };
        }
    ]);

    //会员导航栏消费刷卡
    app.directive('consumetab', [
        function () {
            return {
                restrict : 'E',
                template : [
                    '<div class="tab tab-consume form-inline" style="display:none;">',
                        '<div style="display:block;">',
                            '<div class="form-group">',
                                '<label>卡号/手机号</label>',
                                '<input style="width: 187px;" type="number" ng-model="cardnumber" class="form-control cardnumber">',
                                '<button type="button" class="btn btn-default btn-query">查询</button>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>本次消费金额</label>',
                                '<input style="width: 100px;" type="number" class="form-control consumeamount" ng-model="consumeamount">',
                                '<label style="width:30px;margin-left:1px;">单号</label>',
                                '<input style="width: 100px;" type="text" class="form-control ordernumber" ng-model="ordernumber">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>代金券抵扣金额</label>',
                                '<input style="width: 70px;" type="number" disabled class="form-control voucheramount" ng-model="usevoucheramount">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>积分抵扣金额</label>',
                                '<input style="width: 70px;" type="number" class="form-control pointamount" ng-model="pointamount">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>储值余额付款</label>',
                                '<input style="width: 70px;" type="number" class="form-control balanceamount" ng-model="balanceamount">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                            '<label>消费可积分金额</label>',
                            '<input style="width: 70px;" type="number" class="form-control pointgetamount">',
                            '<span><-现金支付那部分金额</span>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>备注</label>',
                                '<input style="width: 187px;" type="text" class="form-control remark">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<span>会员消费积分＝可积分金额*等级积分系数</span>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<button type="button" class="btn btn-default btn-submit btn-submit-consume btn-disable">提交储值</button>',
                            '</div>',
                        '</div>',
                        '<div class="panel-vouchers" style="display:none;">',
                            '<div class="header">会员代金券和兑换券 {{vouchers.length}}张</div>',
                            '<ul class="table-vouchers">',
                                '<li role="presentation" ng-repeat="el in vouchers" voucherid="{{el.voucherID}}">',
                                    '<div class="left">',
                                        '<div>{{el.type == 1 ? "代金券" : "兑换券"}}</div><div>￥{{el.voucherValue}}</div>',
                                    '</div>',
                                    '<div class="right">',
                                        '<div>{{el.voucherName}}</div>',
                                        '<div>截止日期：{{el.voucherValidDate}}</div>',
                                    '</div>',
                                '</li>',
                            '</ul>',
                        '</div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.find('.panel-vouchers ul').css('height', $(window).height() - 41);

                    var init = function() {
                        scope.consumeamount = 0;
                        scope.usevoucher = [];
                        scope.usevoucheramount = 0;
                        scope.pointamount = 0;
                        scope.balanceamount = 0;
                    };
                    init();

                    scope.$watch('usevoucher', function(newValue, oldValue, scope) {
                        if(newValue.length > 0) {
                            var sum = 0;

                            for(var i = 0; i < newValue.length; i ++) {
                                if(newValue[i].type == 1) {
                                    sum += 0 + newValue[i].voucherValue;
                                }
                            }

                            scope.usevoucheramount = sum;

                            scope.$apply();
                        }
                    });

                    //价格变动时的一些联动

                    //点击储值套餐标签时
                    el.on('click', '.panel-vouchers li', function() {
                        if($(this).hasClass('active')) {
                            $(this).removeClass('active');
                        }else {
                            $(this).addClass('active');
                        }

                        $('.panel-vouchers').find('.active').each(function() {
                            scope.usevoucher.push(scope.vouchers[$(this).index()]);
                        });

                        scope.$apply();
                    });

                    //点击提交按钮时
                    el.on('click', '.btn-submit-consume', function() {
                        if(!$(this).hasClass('disable')) {
                            scope.CCS.deductMoney({
                                cardKey: scope.user.cardnumber || scope.user.phone,
                                payWayName: scope.payway,
                                saveMoneySetID: scope.rechargeway == 0 ? '' : scope.rechargeplan.saveMoneySetID,
                                transAmount: scope.rechargeway == 0 ? scope.rechargeamount : scope.rechargeplan.setSaveMoney,
                                transRemark: scope.remark,
                                transReturnMoneyAmount: scope.rechargeway == 0 ? scope.rechargereturnamount : scope.rechargeplan.returnMoney,
                                transReturnPointAmount: scope.rechargeway == 0 ? scope.rechargereturnpoint : scope.rechargeplan.returnPoint
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.AA.add('success', '消费成功！');
                                    scope.panel_userinfo.hide();
                                    init();
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }
                    });
                }
            };
        }
    ]);

    //会员导航栏卡操作
    app.directive('cardhandletab', [
        function () {
            return {
                restrict : 'E',
                template : [
                    '<div class="tab tab-cardhandle form-inline" style="display:none;">',
                        '<div style="display:block;">',
                            '<div class="form-group">',
                                '<label>卡号/手机号</label>',
                                '<input style="width: 187px;" type="number" ng-model="cardnumber" class="form-control cardnumber">',
                                '<button type="button" class="btn btn-default btn-query">查询</button>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;width:640px;">',
                            '<div class="panel panel-default">',
                                '<div class="panel-heading">选择卡操作类型</div>',
                                '<div class="panel-body">',
                                    '<div style="display:block;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="绑定手机号" ng-model="handler" text="bind" >绑定手机号',
                                            '<span>（为持实体卡的会员绑定手机号，以便报手机号即可使用，也可以用来更改绑定的手机号）</span>',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="补办实体卡" ng-model="handler" text="transactrealcard" >补办实体卡',
                                            '<span>（顾客通过网上加入会员，可在店内补办实体卡）</span>',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="挂失" ng-model="handler" text="lost" >挂失',
                                            '<span>（卡遗失客户申请挂失，挂失后卡不能使用）</span>',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="解除挂失" ng-model="handler" text="cancellost" >解除挂失',
                                            '<span>（顾客挂失后又找到卡，则可解除挂失，解除挂失后卡正常使用）</span>',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="卡遗损补办" ng-model="handler" text="transactlostcard" >卡遗损补办',
                                            '<span>（原卡损坏或遗失到店补办信啊，换卡后原来的卡将不能使用，积分及资金转入新卡）</span>',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="冻结" ng-model="handler" text="freeze" >冻结',
                                            '<span>（卡金额出现异常时可冻结，冻结后卡不能使用）</span>',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="解冻" ng-model="handler" text="unfreeze" >解冻',
                                            '<span>（卡被冻结后经排除问题并解决后可用解冻来恢复卡的正常使用）</span>',
                                        '</div>',
                                    '</div>',
                                    '<div style="display:block;margin-top:10px;">',
                                        '<div class="form-group">',
                                            '<input type="radio" name="handler" value="注销" ng-model="handler" text="logout" >注销',
                                            '<span>（卡永久失效时，可用注销将其作废，注销后卡不能再使用，也不能再恢复）</span>',
                                        '</div>',
                                    '</div>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div class="bonus-panel" style="display:block;margin-top:10px;" for="绑定手机号">',
                            '<div class="form-group">',
                                '<span>手机号</span>',
                                '<input style="width: 187px;" type="number" ng-model="phonenumber" class="form-control phonenumber">',
                                '<span>短信验证码</span>',
                                '<input style="width: 100px;" type="number" ng-model="msgcode" class="form-control msgcode">',
                                '<button type="button" class="btn btn-default btn-getmsgcode">获取手机验证码</button>',
                            '</div>',
                        '</div>',
                        '<div class="bonus-panel" style="display:none;margin-top:10px;" for="补办实体卡">',
                            '<div class="form-group">',
                                '<span>卡号</span>',
                                '<input style="width: 187px;" type="number" ng-model="getrealcard" class="form-control getrealcard">',
                            '</div>',
                        '</div>',
                        '<div class="bonus-panel" style="display:none;margin-top:10px;" for="卡遗损补办">',
                            '<div class="form-group">',
                                '<span>新卡号</span>',
                                '<input style="width: 187px;" type="number" ng-model="getlostcard" class="form-control getlostcard">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<button type="button" class="btn btn-default btn-submit btn-submit-handle btn-disable">提交{{handler}}操作</button>',
                            '</div>',
                        '</div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    scope.handler = '绑定手机号';

                    scope.$watch('handler', function(newValue, oldValue, scope) {
                        $('.bonus-panel').hide();

                        $('.bonus-panel[for="' + newValue + '"]').show();
                    });

                    //获取验证码按钮
                    var ti;
                    el.on('click', '.btn-getmsgcode', function() {
                        var time = 60;
                        var self = $(this);

                        if(!self.hasClass('btn-disable')) {
                            self.html('60秒后重新发送').addClass('btn-disable');

                            ti = setInterval(function() {
                                if(time > 0) {
                                    time --;
                                    self.html(time + '秒后重新发送')
                                }else{
                                    clearInterval(ti);
                                    self.html('获取验证码').removeClass('btn-disable');
                                }
                            }, 1000);
                        }
                    });
                }
            };
        }
    ]);
});