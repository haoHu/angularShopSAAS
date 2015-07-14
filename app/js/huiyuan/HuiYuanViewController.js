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

            $scope.handletype = {
                '绑定手机号': 41,
                '补办实体卡': 42,
                '挂失': 10,
                '解除挂失': 11,
                '卡遗损补办': 40,
                '冻结': 20,
                '解冻': 21,
                '注销': 30
            };

            $scope.rechargeplans = [];

            $scope.vipinfo = null;

            $scope.panel_userinfo = {
                show: function() {
                    $('.userinfo').show();
                    $('.panel-vouchers').show();
                },
                hide: function() {
                    $('.userinfo').hide();
                    $('.panel-vouchers').hide();
                    $scope.user = null;
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
                            var count = 0;
                            for(var i = 0; i < data.data.cashVoucherLst.length; i ++) {
                                var v = data.data.cashVoucherLst[i];
                                v.type = 1;
                                v.index = count ++;
                                $scope.vouchers.push(v);
                            };
                            for(var i = 0; i < data.data.exchangeVoucherLst.length; i ++) {
                                var v = data.data.exchangeVoucherLst[i];
                                v.type = 2;
                                v.index = count ++;
                                $scope.vouchers.push(v);
                            };
                        }else {
                            AppAlert.add('danger', data.msg)
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
                            $scope.panel_userinfo.hide();
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
                    pointasmoneyrate: d.pointAsMoneyRate,
                    //joinplace: '哗啦啦体验店铺（中关村店）',
                    cardkey: d.cardKey
                };

                $scope.userorg = d;

                $scope.panel_userinfo.show();

                if(d.isMobileCard == 1 && d.transSafeLevel != '0') {
                    $scope.ispwd = 1;
                }

                $scope.$watch('ispwd', function(n, o) {
                    if(n == 1) {
                        $('.formpwd').show();
                    }
                });
            };

            $scope.prtvipinfo = function() {
                Hualala.DevCom.exeCmd('PrintOther', JSON.stringfy($scope.user));
            };

            //打开日历
            $scope.openDatePicker = function ($event, n) {
                $event.preventDefault();
                $event.stopPropagation();

                switch(n) {
                    case 1 : {
                        $scope.op1 = true;
                    }break;

                    case 2 : {
                        $scope.op2 = true;
                    }break;

                    case 3 : {
                        $scope.op3 = true;
                    }break;

                    case 4 : {
                        $scope.op4 = true;
                    }break;
                }
            };
            $scope.today = function () {
                return IX.Date.getDateByFormat(new Date(), 'yyyy-MM-dd');
                // return IX.Date.formatDate(new Date());
            };
            $scope.minday = function () {
                return $scope.listdatefrom;
                // return IX.Date.formatDate(new Date());
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

                        HuiYuanTabsService.changeTab($(this).attr('name'), scope);

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
            self.changeTab = function(tabname, scope) {
                $('.tab').hide();

                var node = $('.tab-' + tabname);
                node.show();

                if(tabname == 'join') {
                    scope.user = null;
                    scope.$apply();
                };
            };
        }
    ]);

    //会员导航栏入会办卡
    app.directive('jointab', [
        function () {
            return {
                restrict : 'E',
                template : [
                    '<form class="tab tab-join form-inline form-horizontal" name="join_form" role="form" novalidate="novalidate">',
                        '<div style="display:block;">',
                            '<div class="form-group has-feedback">',
                                '<label class="pull-left control-label">实体卡卡号</label>',
                                '<div class="pull-left" ng-class="{\'has-success\' : join_form.realcardnumber.$dirty && join_form.realcardnumber.$valid, \'has-error\' : join_form.realcardnumber.$invalid}">',
                                    '<div class="input-group">',
                                        '<input name="realcardnumber" style="width: 187px;" type="text" class="form-control realcardnumber" ng-model="realcardnumber" bv-isnum>',
                                        '<span class="input-group-btn"><button type="button" class="btn btn-default btn-viplevel">{{level.cardLevelName}}</button></span>',
                                    '</div>',
                                    '<small class="help-block" ng-show="join_form.realcardnumber.$dirty && join_form.realcardnumber.$error.bvIsnum">必须为数字</small>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group has-feedback">',
                                '<label class="pull-left control-label">实体卡密码</label>',
                                '<div class="pull-left" ng-class="{\'has-success\' : join_form.cardpassword.$dirty && join_form.cardpassword.$valid, \'has-error\' : join_form.cardpassword.$invalid}">',
                                    '<input name="cardpassword" style="width: 187px;" type="text" class="form-control cardpassword" value="888888" ng-model="cardpassword" bv-notempty bv-strlength min="6" max="32">',
                                    '<small class="help-block" ng-show="join_form.cardpassword.$dirty && join_form.cardpassword.$error.bvNotempty">不能为空</small>',
                                    '<small class="help-block" ng-show="join_form.cardpassword.$dirty && join_form.cardpassword.$error.bvStrlength">密码必须在6-32位之间</small>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group has-feedback">',
                                '<label class="pull-left control-label">手机号码</label>',
                                '<div class="pull-left"  ng-class="{\'has-success\' : join_form.phonenumber.$dirty && join_form.phonenumber.$valid, \'has-error\' : join_form.phonenumber.$invalid}">',
                                    '<input name="phonenumber" style="width:187px;" type="text" class="form-control phonenumber" ng-model="phonenumber" bv-notempty bv-mobile>',
                                    '<input type="checkbox" ng-model="checkmobile" value="1">验证手机号',
                                    '<small class="help-block" ng-show="join_form.phonenumber.$dirty && join_form.phonenumber.$error.bvNotempty">不能为空</small>',
                                    '<small class="help-block" ng-show="join_form.phonenumber.$dirty && join_form.phonenumber.$error.bvMobile">请输入正确手机号</small>',

                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:none;margin-top:10px;" class="formcode">',
                            '<div class="form-group has-feedback">',
                                '<label class="pull-left control-label">验证码</label>',
                                '<div class="pull-left" >',
                                    '<div class="input-group">',
                                        '<input style="width: 107px;" type="text" ng-model="checkcode" class="form-control checkcode">',
                                        '<span class="input-group-btn"><button type="button" class="btn btn-default btn-sendcheckcode">发送验证码</button></span>',
                                    '</div>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label class="pull-left control-label">姓名</label>',
                                '<div class="pull-left" ng-class="{\'has-success\' : join_form.username.$dirty && join_form.username.$valid, \'has-error\' : join_form.username.$invalid}">',
                                    '<input name="username" style="width:106px;" type="text" class="form-control username" ng-model="username" bv-notempty bv-strlength min="2" max="50">',
                                    '<input type="radio" name="sex" checked value="0" ng-model="sex">女士',
                                    '<input type="radio" name="sex" value="1" ng-model="sex">先生',
                                    '<small class="help-block" ng-show="join_form.username.$dirty && join_form.username.$error.bvNotempty">请输入姓名</small>',
                                    '<small class="help-block" ng-show="join_form.username.$dirty && join_form.username.$error.bvStrlength">姓名在2-32位字符之间</small>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>生日</label>',
                                '<div class="input-group">',
                                    '<input style="width:187px;" type="text" class="form-control birthday form_datetime"  ng-model="birthday" readonly datepicker-popup="yyyy-MM-dd" placeholder="日期" is-open="op4" max-date="today()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keyup="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 4)">',
                                    '<span class="input-group-btn"><button class="btn btn-default" type="button" ng-click="openDatePicker($event, 4)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                                '</div>',
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
                                    '<div class="name">{{el.cardLevelName}} {{el.isDefaultLevel == "1" ? "（默认）" : ""}}</div>',
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
                    '</form>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.find('.panel-viplevel ul').css('height', $(window).height() - 41);

                    //初始值设定
                    var init = function() {
                        scope.sex = 0;
                        scope.cardfee = 0;
                        scope.birthday = null;
                        scope.cardpassword = '888888';
                        scope.checkmobile = '0';
                    };
                    init();

                    //获取集团会员参数
                    scope.CCS.getShopVipInfo({}).success(function(data) {
                        if(data.code == '000') {
                            scope.AA.add('success', '获取集团会员参数成功');

                            scope.vipinfo = data.data;

                            scope.viplevels = data.data.cardLevelList;

                            var index = viplevel.defLevel(scope.viplevels);
                            scope.level = scope.viplevels[index];

                            scope.rechargeplans = data.data.saveMoneySet;

                            if(data.data.isSysSwitchActive == '1') {
                                el.find('.panel-oldcard').show();
                            }
                        }else {
                            scope.AA.add('danger', data.msg);
                        }
                    });

                    scope.$watch('checkmobile',function(n, o) {
                        if(n == 1) {
                            el.find('.formcode').show();
                        }else {
                            el.find('.formcode').hide();
                        }
                    });

                    //获取验证码按钮

                    var createCode = function() {
                        var str = '0123456789';

                        var code = '';

                        for(var i = 0; i < 5; i ++) {
                            code += str.charAt(Math.floor(Math.random() * 6));
                        }

                        return code;
                    };

                    var ti, checkcode;
                    el.on('click', '.btn-sendcheckcode', function() {
                        if(scope.phonenumber) {
                            var time = 60;
                            var self = $(this);

                            if(!self.hasClass('btn-disable')) {
                                checkcode = createCode();

                                scope.CCS.sendCode({
                                    customerMobile: scope.phonenumber,
                                    SMSVerCode: checkcode
                                }).success(function(data) {
                                    if(data.code == '000') {
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
                                    }else{
                                        scope.AA.add('danger', data.msg);
                                    }
                                });
                            }
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
                        if(checkcode == scope.checkcode) {
                            scope.CCS.createVIPCard({
                                shopName: null,
                                cardNO: scope.realcardnumber,
                                cardLevelID: scope.cardlevelid,
                                cardFee: scope.cardfee,
                                cardPWD: scope.cardpassword,
                                customerName: scope.username,
                                customerSex: scope.sex,
                                customerMobile: scope.phonenumber,
                                isMobileChecked: scope.checkmobile,
                                customerBirthday: IX.Date.getDateByFormat(scope.birthday, 'yyyy-MM-dd'),
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
                        }else {
                            scope.AA.add('danger', '验证码错误！');
                        }
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
                                '<div class="input-group">',
                                    '<input style="width: 187px;" type="text" ng-model="cardnumber" class="form-control cardnumber">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                                '</div>',
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
                                    '<div class="returnmoney" return="{{el.returnMoney}}">*送返金额：{{el.returnMoney}}元</div>',
                                    '<div class="returnpoint" return="{{el.returnPoint}}">*送返积分：{{el.returnPoint}}元</div>',
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
                        scope.rechargeamount = null;
                        scope.rechargereturnamount = null;
                        scope.rechargereturnpoint = null;
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

                            el.find('div[return="0.00"]').hide();
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
                                cardID: scope.user.cardkey,
                                payWayName: scope.payway,
                                saveMoneySetID: scope.rechargeway == 0 ? '' : scope.rechargeplan.saveMoneySetID,
                                transAmount: scope.rechargeway == 0 ? scope.rechargeamount : scope.rechargeplan.setSaveMoney,
                                transRemark: scope.remark,
                                transReturnMoneyAmount: scope.rechargeway == 0 ? scope.rechargereturnamount : scope.rechargeplan.returnMoney,
                                transReturnPointAmount: scope.rechargeway == 0 ? scope.rechargereturnpoint : scope.rechargeplan.returnPoint
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.AA.add('success', '储值成功！');

                                    Hualala.DevCom.exeCmd('PrintCRMTransBill', data.transReceiptsTxt);
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
                                '<div class="input-group">',
                                    '<input style="width: 187px;" type="text" ng-model="cardnumber" class="form-control cardnumber">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>本次消费金额</label>',
                                '<input style="width: 100px;" type="number" class="form-control group" ng-model="group.consumeamount" ng-change="calculate(\'consumeamount\')">',
                                '<label style="width:30px;margin-left:1px;">单号</label>',
                                '<input style="width: 100px;" type="number" class="form-control ordernumber" ng-model="ordernumber">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>代金券抵扣金额</label>',
                                '<input style="width: 100px;" type="number" disabled class="form-control group usevoucheramount" ng-model="group.usevoucheramount" ng-change="calculate(\'usevoucheramount\')">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>积分抵扣金额</label>',
                                '<input style="width: 100px;" type="number" class="form-control group" ng-model="group.pointamount" ng-change="calculate(\'pointamount\')">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                                '<label>储值余额付款</label>',
                                '<input style="width: 100px;" type="number" class="form-control group" ng-model="group.balanceamount" ng-change="calculate(\'balanceamount\')">',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;">',
                            '<div class="form-group">',
                            '<label>消费可积分金额</label>',
                            '<input style="width: 100px;" type="number" class="form-control group" ng-model="group.pointgetamount" ng-change="calculate(\'pointgetamount\')">',
                            '<span><-现金支付那部分金额</span>',
                            '</div>',
                        '</div>',
                        '<div style="display:none;margin-top:10px;" class="formpwd">',
                            '<div class="form-group">',
                                '<label>动态交易密码</label>',
                                '<div class="input-group">',
                                    '<input style="width: 107px;" type="text" ng-model="transpwd" class="form-control transpwd">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-sendtranspwd">发送动态交易密码</button></span>',
                                '</div>',
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
                                '<li role="presentation" ng-repeat="el in vouchers" voucherid="{{el.voucherID}}" ng-click="changeVoucher($index)" index="{{el.index}}">',
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
                        scope.group = {
                            consumeamount: 0,
                            usevoucheramount: 0,
                            pointamount: 0,
                            balanceamount: 0,
                            pointgetamount: 0,
                            vl: '',
                            el: ''
                        }
                        scope.usevoucher = [];
                        scope.ispwd = 0;
                    };
                    init();


                    //获取验证码按钮

                    var ti;
                    el.on('click', '.btn-sendtranspwd', function() {
                        var time = 60;
                        var self = $(this);

                        if(!self.hasClass('btn-disable')) {
                            scope.CCS.sendTransPWD({
                                cardID: scope.userorg.cardKey
                            }).success(function(data) {
                                if(data.code == '000') {
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
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }
                    });

                    scope.$watch('usevoucher', function(newValue, oldValue) {
                        var sum = 0;
                        var vl = [];
                        var el = [];

                        if(newValue.length > 0) {
                            for(var i = 0; i < newValue.length; i ++) {
                                if(newValue[i].type == 1) {
                                    sum += parseFloat(newValue[i].voucherValue);
                                    vl.push(newValue[i].voucherID);
                                }else{
                                    el.push(newValue[i].voucherID);
                                }
                            }

                            scope.group.usevoucheramount = sum;

                            if(sum >= scope.group.consumeamount) {
                                $('.panel-vouchers').addClass('full');
                            }else {
                                $('.panel-vouchers').removeClass('full');
                            }
                        }else{
                            scope.group.usevoucheramount = 0;
                            $('.panel-vouchers').find('.active').removeClass('active');
                            $('.panel-vouchers').removeClass('full');
                        }

                        scope.group.vl = vl.join();
                        scope.group.el = el.join();
                        scope.calculate('usevoucheramount')
                    });

                    //价格变动时的一些联动
                    scope.calculate = function(name) {

                        if(scope.user) {
                            var ca, uva, pa, ba, pga;

                            switch (name) {
                                case 'consumeamount' : {
                                    scope.usevoucher = [];
                                    pa = ba = uva = 0;
                                    ca = scope.group['consumeamount'];
                                    pga = scope.group['consumeamount'];
                                }break;

                                case 'usevoucheramount' : {
                                    pa = ba = 0;
                                    uva = scope.group['usevoucheramount'];
                                    ca = scope.group['consumeamount'];
                                    pga = parseFloat(ca) - parseFloat(uva);
                                    if(!pga) pga = 0;
                                }break;

                                case 'pointamount' : {
                                    ba = 0;
                                    pa = scope.group['pointamount'];
                                    uva = scope.group['usevoucheramount'];
                                    ca = scope.group['consumeamount'];
                                    if(pa > ca - uva) {
                                        pa = ca - uva;
                                    }
                                    if(pa > parseFloat(scope.user.pointaccount) * parseFloat(scope.user.pointasmoneyrate)) {
                                        pa = parseFloat(scope.user.pointaccount) * parseFloat(scope.user.pointasmoneyrate);
                                    }
                                    pga = ca - uva - pa;
                                    if(!pga) pga = 0;
                                }break;

                                case 'balanceamount' : {
                                    ba = scope.group['balanceamount'];
                                    pa = scope.group['pointamount'];
                                    uva = scope.group['usevoucheramount'];
                                    ca = scope.group['consumeamount'];
                                    if(ba > ca - uva - pa) {
                                        ba = ca - uva - pa;
                                    }
                                    if(ba > scope.user.cashaccount) {
                                        ba = parseFloat(scope.user.cashaccount);
                                    }
                                    pga = ca - uva - pa - ba;
                                    if(!pga) pga = 0;
                                }break;

                            }

                            scope.group.pointamount = pa;
                            scope.group.balanceamount = ba;
                            scope.group.pointgetamount = pga;
                        }
                    }

                    //点击储值套餐标签时
                    scope.changeVoucher =  function(index) {
                        var self = $('.panel-vouchers li').eq(index);

                        if(self.hasClass('active')) {
                            self.removeClass('active');
                        }else {
                            if(!$('.panel-vouchers').hasClass('full')) {
                                scope.usevoucher.push(index);
                                self.addClass('active');
                            }
                        }

                        var arr = [];

                        $('.panel-vouchers').find('.active').each(function() {
                            arr.push(scope.vouchers[$(this).attr('index')]);
                        });

                        scope.usevoucher = arr;
                    };

                    //点击提交按钮时
                    el.on('click', '.btn-submit-consume', function() {
                        if(!$(this).hasClass('disable')) {
                            scope.CCS.deductMoney({
                                cardKey: scope.user.cardkey,
                                cardTransPWD: scope.transpwd,
                                isMobileCard: scope.userorg.isMobileCard,
                                consumptionAmount: scope.group.consumeamount,
                                consumptionPointAmount: scope.group.pointgetamount,
                                deductGiftAmount: scope.group.usevoucheramount,
                                deductMoneyAmount: scope.group.balanceamount,
                                deductPointAmount: scope.group.pointamount,
                                discountAmount: 0,
                                posOrderNo: scope.ordernumber,
                                remark: scope.remark,
                                EGiftItemIDList: scope.group.vl,
                                exchangeItemIDList: scope.group.el
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.AA.add('success', '消费成功！');
                                    scope.panel_userinfo.hide();

                                    Hualala.DevCom.exeCmd('PrintCRMTransBill', data.transReceiptsTxt);
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
                                '<div class="input-group">',
                                    '<input style="width: 187px;" type="text" ng-model="cardnumber" class="form-control cardnumber">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                                '</div>',
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
                                '<input style="width: 187px;" type="number" ng-model="sendcodephone" class="form-control phonenumber">',
                                '<span>短信验证码</span>',
                                '<div class="input-group">',
                                    '<input style="width: 100px;" type="number" ng-model="msgcode" class="form-control msgcode">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-getmsgcode">获取手机验证码</button></span>',
                                '</div>',
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
                                '<input style="width: 187px;" type="number" ng-model="getnewcard" class="form-control getnewcard">',
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

                    var init = function() {
                        scope.handler = '绑定手机号';
                        scope.sendcodephone = '';
                        scope.msgcode = '';
                        scope.getrealcard = '';
                        scope.getnewcard = '';
                    };
                    init();

                    scope.$watch('handler', function(newValue, oldValue, scope) {
                        $('.bonus-panel').hide();

                        $('.bonus-panel[for="' + newValue + '"]').show();
                    });

                    //获取验证码按钮
                    var ti,msgcode;
                    el.on('click', '.btn-getmsgcode', function() {
                        if(scope.sendcodephone) {
                            var time = 60;
                            var self = $(this);

                            if(!self.hasClass('btn-disable')) {
                                msgcode = createCode();
                                scope.CCS.sendCode({
                                    customerMobile: scope.sendcodephone,
                                    SMSVerCode: msgcode
                                }).success(function(data) {
                                    if(data.code == '000') {
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
                                    }else{
                                        scope.AA.add('danger', data.msg);
                                    }
                                });
                            }
                        }
                    });

                    var getval = function(type) {
                        switch(scope.handletype[type]) {
                            case 42 : {
                                return scope.getrealcard;
                            }break;

                            case 41 : {
                                return scope.sendcodephone;
                            }break;

                            case 40 : {
                                return scope.getnewcard;
                            }break;

                            default : {
                                return null;
                            }
                        }
                    };

                    var createCode = function() {
                        var str = '0123456789';

                        var code = '';

                        for(var i = 0; i < 5; i ++) {
                            code += str.charAt(Math.floor(Math.random() * 6));
                        }

                        return code;
                    };

                    //点击提交按钮时
                    el.on('click', '.btn-submit-handle', function() {
                        if(!$(this).hasClass('disable')) {
                            if(scope.handler == '绑定手机号' && msgcode != scope.msgcode) {
                                scope.AA.add('danger', '验证码错误！');
                            }else {
                                scope.CCS.cardOption({
                                    cardID: scope.user.cardkey,
                                    optionType: scope.handletype[scope.handler],
                                    remark: scope.remark,
                                    newCardNoOrMobile: getval(scope.handler),
                                    oldCardNoOrMobile: getval(scope.handler)
                                }).success(function(data) {
                                    if(data.code == '000') {
                                        scope.AA.add('success', '操作成功！');
                                        scope.panel_userinfo.hide();
                                        init();
                                    }else{
                                        scope.AA.add('danger', data.msg);
                                    }
                                });
                            }
                        }
                    });
                }
            };
        }
    ]);

    //会员导航栏报表
    app.directive('reporttab', [
        function () {
            return {
                restrict : 'E',
                template : [
                    '<div class="tab tab-report" style="display:none;">',
                        '<div class="form-inline">',
                            '<div class="form-group">',
                                '<input type="radio" value="1" name="reporttype" class="viporderdetail" ng-model="reporttype">会员交易明细',
                                '<input type="radio" value="2" name="reporttype" class="viporderlist" ng-model="reporttype">会员交易汇总',
                                '<div class="input-group date-detail" style="display:none;">',
                                    '<input style="width:120px;" type="text" class="form-control detaildate form_datetime"  ng-model="detaildate" readonly datepicker-popup="yyyy-MM-dd" placeholder="日期" is-open="op1" max-date="today()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keyup="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 1)">',
                                    '<span class="input-group-btn"><button class="btn btn-default" type="button" ng-click="openDatePicker($event, 1)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                                '</div>',
                                '<div class="input-group date-list" style="display:none;">',
                                    '<input style="width:120px;" type="text" class="form-control listdatefrom form_datetime"  ng-model="listdatefrom" readonly datepicker-popup="yyyy-MM-dd" placeholder="起始日期" is-open="op2" max-date="today()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keyup="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 2)">',
                                    '<span class="input-group-btn"><button class="btn btn-default" type="button" ng-click="openDatePicker($event, 2)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                                '</div>',
                                '<div class="input-group date-list" style="display:none;">',
                                    '<input style="width:120px;" type="text" class="form-control listdateto form_datetime"  ng-model="listdateto" readonly datepicker-popup="yyyy-MM-dd" placeholder="截止日期" is-open="op3" max-date="today()" min-date="minday()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keyup="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 3)">',
                                    '<span class="input-group-btn"><button class="btn btn-default" type="button" ng-click="openDatePicker($event, 3)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                                '</div>',
                                '<button type="button" class="btn btn-default btn-query-report">查询</button>',
                            '</div>',
                        '</div>',
                        '<div>',
                            '<div class="panel-report-detail" style="display:none;overflow-x:auto;">',
                                '<table class="table" style="width:1500px;">',
                                    '<thead><th>序</th><th>卡号</th><th>姓名</th><th>手机号</th><th>交易类型</th><th>交易时间</th><th>消费金额</th><th>储值变动</th><th>积分</th></thead>',
                                    '<tr role="presentation" ng-repeat="el in reportlist"><td>{{el.transIDFormat}}</td><td>{{el.cardNo}}</td><td>{{el.customerName}}</td><td>{{el.customerMobile}}</td><td>{{handletype[el.transType]}}</td><td>{{el.transTimeFormat}}</td><td>{{el.cunsumptionAmount}}</td><td>{{el.pointChange}}</td></tr>',
                                '</table>',
                            '</div>',
                            '<textarea class="panel-report-list" style="display:none;width:564px;height:480px;">{{reportprnstr}}',
                            '</textarea>',
                        '</div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {

                    //初始值设定
                    var init = function() {
                        scope.reporttype = 1;
                        scope.reportlist = [];
                    };
                    init();

                    //报表类型变化时切换面板
                    scope.$watch('reporttype', function(n, o, s) {
                        el.find('.input-group').hide();
                        if(n == 1) {
                            el.find('.date-detail').show();
                            el.find('.panel-report-detail').show();
                            el.find('.panel-report-list').hide();
                        }else {
                            el.find('.date-list').show();
                            el.find('.panel-report-detail').hide();
                            el.find('.panel-report-list').show();
                        }
                    });

                    scope.$watch('listdatefrom', function(n, o, s) {
                        scope.listdateto = null;
                    });

                    el.on('click', '.btn-query-report', function() {
                        if(scope.reporttype == 1) {
                            scope.reportprnstr = '';

                            scope.CCS.reportDetail({
                                queryDate: IX.Date.getDateByFormat(scope.detaildate, 'yyyyMMdd')
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.reportlist = data.data;
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }else{
                            scope.reportlist = [];

                            scope.CCS.reportTotal({
                                startDate: IX.Date.getDateByFormat(scope.listdatefrom, 'yyyyMMdd'),
                                endDate: IX.Date.getDateByFormat(scope.listdateto, 'yyyyMMdd')
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.reportprnstr = data.data.reportPrnStr;
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
});