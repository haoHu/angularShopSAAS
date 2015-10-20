(function () {
	IX.ns("Hualala.Constants");
	
	IX.extend(Hualala.Constants, {
		NameOfDay : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
		SecondsOfHour : 3600,
		SecondsOfDay : 24 * 3600,
		SecondsOfWeek : 7 * 24 * 3600,
		NumberKeys : [1,2,3,4,5,6,7,8,9,0],
		Alphabet : 'abcdefghijklmnopqrstuvwxyz'.split(''),
		PersonUnit : "人",
		CashUnit : "元",
		OrderUnit : "单"
	});
})();
(function () {
	IX.ns("Hualala.TypeDef");

	/**
	 * 性别数据类型
	 * @type {Array}
	 */
	Hualala.TypeDef.GENDER = [
		{value : '0', valueStr : 'female', label : '女士'},
		{value : '1', valueStr : 'male', label : '先生'},
		{value : '2', valueStr : 'unkonwn', label : '未知'}
	];

	Hualala.TypeDef.OrderTypes = [
		{value : '0', name : "all", label : "全部", icon : ""},
		{value : '10', name : "dingzuo", label : "订座点菜", icon : "icon-dingzuo"},
		{value : '11', name : "shanchi", label : "闪吃", icon : "icon-shanchi"},
		{value : '20', name : "waimai", label : "外卖", icon : "icon-waimai"},
		{value : '21', name : "ziti", label : "自提", icon : "icon-ziti"},
		{value : '41', name : "zizhu", label : "店内自助", icon : "icon-zizhu"}
	];

	Hualala.TypeDef.HotKeys = {
		"F1" : 112,
		"F2" : 113,
		"F3" : 114,
		"F4" : 115,
		"F5" : 116,
		"F6" : 117,
		"F7" : 118,
		"F8" : 119,
		"F9" : 120,
		"F10" : 121,
		"F11" : 122,
		"F12" : 123,
		"Esc" : 27,
		"Backspace" : 8
	};

	Hualala.TypeDef.ResponseCodes = {
		"000" : '服务成功',
		"404" : '没有找到文件或目录',
		"500" : "内部服务器错误",
		"SY001" : "无法连接云端服务器",
		"SY002" : "云端服务器返回错误",
		"SY003" : "请求云端服务器超时",
		"CS001" : "门店服务器未注册",
		"CS002" : "未登录，不能访问当前页面",
		"CS003" : "登录失败",
		"CS004" : "无权访问"
	};
	Hualala.TypeDef.CommonErrorMsgs = {
		"connect_faild" : "通信失败，请稍后再试"
	};

	// 与硬件交互通用指令集
	// 需要向剪切板中写入特定标签的数据
	Hualala.TypeDef.DeviceComCmds = {
		// 打印账单消费明细
		"PrintOrderDetailBill" : {
			tagName : "HLL_SAAS_PRINT_ORDER_DETAIL_BILL_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : false
		},
		// 打印预结账账单
		"PrintCheckoutPreBill" : {
			tagName : "HLL_SAAS_PRINT_CHECKOUT_PRE_BILL_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : false
		},
		// 打印结账清单
		"PrintCheckoutBill" : {
			tagName : "HLL_SAAS_PRINT_CHECKOUT_BILL_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : false
		},
		// 账单模块打印结账清单
		"PrintCheckoutBillHis" : {
			tagName : "HLL_SAAS_PRINT_CHECKOUT_BILL_HIS_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : false
		},
		// 打印会员卡交易凭证 
		"PrintCRMTransBill" : {
			tagName : "HLL_SAAS_PRINT_CRM_TRANS_BILL_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : false
		},
		// 打印其他小票内容
		"PrintOther" : {
			tagName : "HLL_SAAS_PRINT_OTHER_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : false
		},
		// 打开钱箱
		"OpenCashbox" : {
			tagName : "HLL_SAAS_OPEN_CASHBOX_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : true
		},
		// 接口调试
		"AppDebug" : {
			tagName : "HLL_SAAS_APP_DEBUG_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : true
		},
		// 站点设置
		"AppSiteSet" : {
			tagName : "HLL_SAAS_APP_SITESET_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : true
		},
		// 退出程序
		"AppExit" : {
			tagName : "HLL_SAAS_EXIT_APP_96A447B7_E982_465E_8AD6_7B94D5F097CD", isEmptyTag : true
		}

	};

	// 营业模式
	Hualala.TypeDef.ShopOperationMode = [
		{value : 0, name : 'dinner', label : '正餐'},
		{value : 1, name : 'snack', label : '快餐'},
		{value : 2, name : 'stall', label : '美食广场'}
	];

	/**
	 * 订单类型
	 * 0 : 堂食；20：外卖；21： 自提
	 */
	Hualala.TypeDef.OrderSubTypes = {
		"0" : {value : 0,  label : '堂食', name : "INNER"},
		"20" : {value : 20, label : '外卖', name : "TAKEOUT"},
		"21" : {value : 21, label : '自提', name : "PICKUP"}
	};

	/**
	 * 菜品制作状态
	 * @type {Array} {value, name, label}
	 */
	Hualala.TypeDef.FoodMakeStatus = [
		{value : 0, label : '等', name : 'wait'},
		{value : 1, label : '即', name : 'immediate'},
		{value : 2, label : '急', name : 'urgent'},
		{value : 3, label : '上', name : 'up'}
	];

	/**
	 * 点菜订单菜品条目记录类型
	 * 0:点菜；1：退餐；2：赠菜
	 */
	Hualala.TypeDef.OrderFoodItemType = {
		ORDER : 0,
		CANCEL : 1,
		SEND : 2
	};

	/**
	 * 订单字典类型
	 * @type {Array}
	 */
	Hualala.TypeDef.OrderNoteTypes = [
		{name : "orderRemark", value : "10", label : "点单备注"},
		{name : "foodMethod", value : "20", label : "作法"},
		{name : "foodRemark", value : "30", label : "口味"},
		{name : "foodCancel", value : "40", label : "退菜原因"},
		{name : "foodSend", value : "50", label : "赠菜原因"},
		{name : "foodPrice", value : "60", label : "改价原因"},
		{name : "orderChange", value : "70", label : "改单原因"},
		{name : "orderCancel", value : "80", label : "预订退订原因"},
		{name : "takeoutCancel", value : "90", label : "外卖退单原因"},
		{name : "orderRefund", value : "100", label : "退款原因"},
		{name : "abolishOrders", value : "110", label : "账单作废原因"}
	];

	/**
	 * 订单支付科目组
	 * @type {Array}
	 */
	Hualala.TypeDef.OrderPaySubjectGroups = [
		{name : "sendFoodPromotionPay", value : "51010501", isPrefix : "0", label : "账单赠送"},
		{name : "vipPricePromotionPay", value : "51010502", isPrefix : "0", label : "会员价优惠"},
		{name : "discountPay", value : "51010503", isPrefix : "0", label : "账单折扣"},
		{name : "wipeZeroPay", value : "51010504", isPrefix : "0", label : "账单元整"},
		{name : "remissionPay", value : "51010505", isPrefix : "0", label : "账单减免"},
		{name : "freePay", value : "51010508", isPrefix : "0", label : "免单"},
		{name : "cashPay", value : "10010", isPrefix : "1", label : "现金"},
		{name : "vipCardPay", value : "510106", isPrefix : "1", label : "会员卡"},
		{name : "bankCardPay", value : "10020", isPrefix : "1", label : "银行存款"},
		{name : "hualalaPay", value : "11311000", isPrefix : "0", label : "哗啦啦"},
		{name : "groupBuyPay", value : "11310", isPrefix : "1", label : "团购"},
		{name : "voucherPay", value : "51010507", isPrefix : "0", label : "代金券"},
		{name : "hangingPay", value : "11312", isPrefix : "1", label : "挂账"}
	];
	/**
	 * 会员卡状态
	 * @type {Array}
	 */
	Hualala.TypeDef.VIPCardStatus = [
		{value : 10, label : "正常"},
		{value : 20, label : "挂失中"},
		{value : 30, label : "冻结"},
		{value : 40, label : "注销"}
	];

	/**
	 * 店铺开通业务
	 * @type {Array}
	 */
	Hualala.TypeDef.ShopServiceFeatures = [
		{value : 'commonreserve_order', label : '预定'},
		{value : 'justeat_order', label : '闪吃'},
		{value : 'takeaway_order', label : '外卖'},
		{value : 'takeout_order', label : '自提'},
		{value : 'crm', label : '会员'},
		{value : 'bi', label : '老板通'},
		{value : 'spot_pay', label : '店内自助结账'},
		{value : 'spot_order', label : '店内自助点菜'}
	];

	/**
	 * 账单元整方式类型
	 * @type {Array}
	 */
	Hualala.TypeDef.MoneyWipeZeroTypes = [
		{value : '0', label : '不抹零'},
		{value : '1', label : '四舍五入到角'},
		{value : '2', label : '向上抹零到角'},
		{value : '3', label : '向下抹零到角'},
		{value : '4', label : '四舍五入到元'},
		{value : '5', label : '向上抹零到元'},
		{value : '6', label : '向下抹零到元'}
	];

	Hualala.TypeDef.NetOrderTypeCode = {
		"WS_YD" : "网上预订",
		"WS_SC" : "网上闪吃",
		"WS_WM" : "网上外卖",
		"WS_ZT" : "网上自提",
		"WS_DN" : "网上自助"
	};

	Hualala.TypeDef.CompBizQueryRangeLst = [
		{value : 'ZH', label : '综合'},
		// 新增报表项目
		{value : 'HYHZ', label : '会员交易汇总'},
		{value : 'HYMX', label : '会员交易明细'},
		{value : 'RHBK', label : '会员入会办卡'},

		{value : 'QD', label : '渠道占比'},
		{value : 'YYSD', label : '营业时段'},
		{value : 'ZTQY', label : '桌台区域'},
		{value : 'ZDXQ', label : '账单详情'},

		// 新增报表项目
		{value : 'ZFZD', label : '作废账单'},	
		{value : 'KPZD', label : '开票账单'},	

		{value : 'SYRY', label : '收银人员'},
		{value : 'DCRY', label : '点菜人员'},
		{value : 'ZZRY', label : '制作人员'},
		{value : 'TC', label : '退菜'},
		{value : 'ZC', label : '赠菜'},
		{value : 'GJ', label : '改价'},
		{value : 'LSC', label : '临时菜'},
		{value : 'CPFL', label : '菜品分类'},
		{value : 'CPKM', label : '菜品科目'},
		{value : 'XSPH', label : '销售排行'}
	];

	// 推送消息类型
	Hualala.TypeDef.PushMsgTypes = {
		// 叫号取餐消息
		"HLL_SAAS_MSG_CALL_TAKE_FOOD" : {
			subName : 'CallNum'
		},
		// 收到新的订单消息
		"HLL_SAAS_MSG_REV_NEW_ORDER" : {
			subName : 'NewOrder'
		},
		// 收到新的消息
		"HLL_SAAS_MSG_NEW_INFO_MSG" : {
			subName : "NewMsg"
		},
		// 订单自助支付成功
		"HLL_SAAS_MSG_SELF_ORDER_PAID" : {
			subName : "SelfPay"
		},
		// 基本信息更新
		"HLL_SAAS_MSG_BASE_UPDATE" : {
			subName : "BaseUpdate"
		},
		// 菜品制作完成消息
		"HLL_SAAS_MSG_BASE_UPDATE" : {
			subName : "FoodMaked"
		},
		// 打印机消息推送
		"HLL_SAAS_MSG_NEW_INFO_MSG" : {
			subName : "PrinterMsg"
		}
	};
})();