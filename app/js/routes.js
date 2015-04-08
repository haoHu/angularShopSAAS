define([], function () {
	return {
		defaultRoutePaths : '/',
		routes : {
			'/' : {
				templateUrl : 'js/home/home.html',
				dependencies : [
					'home/HomeViewController'
				]
			},
			'/jiedan' : {
				templateUrl : 'js/jiedan/jiedan.html',
				dependencies : [
					'jiedan/JieDanViewController',
					'directives/app-color'
				]
			},
			'/diandan' : {
				templateUrl : 'js/diandan/diandan.html',
				dependencies : [
					'diandan/DianDanViewController',
					'directives/app-color'
				]
			},
			'/dingdan' : {
				templateUrl : 'js/dingdan/dingdan.html',
				dependencies : [
					'dingdan/DingDanViewController',
					'directives/app-color'
				]
			},
			'/huiyuan' : {
				templateUrl : 'js/huiyuan/huiyuan.html',
				dependencies : [
					'huiyuan/HuiYuanViewController',
					'directives/app-color'
				]
			},
			'/baobiao' : {
				templateUrl : 'js/baobiao/baobiao.html',
				dependencies : [
					'baobiao/BaoBiaoViewController',
					'directives/app-color'
				]
			},
			'/signin' : {
				templateUrl : 'js/signin/signin.html',
				dependencies : [
					'signin/SigninViewController',
					'directives/app-color'
				]
			},
			'/signup' : {
				templateUrl : 'js/signup/signup.html',
				dependencies : [
					'signup/SignupViewController',
					'directives/app-color'
				]
			}
		}
	};
});