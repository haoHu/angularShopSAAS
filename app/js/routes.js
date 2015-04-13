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
					'directives/appDirectives'
				]
			},
			'/diandan' : {
				templateUrl : 'js/diandan/diandan.html',
				dependencies : [
					'diandan/DianDanViewController',
					'directives/appDirectives'
				]
			},
			'/dingdan' : {
				templateUrl : 'js/dingdan/dingdan.html',
				dependencies : [
					'dingdan/DingDanViewController',
					'directives/appDirectives'
				]
			},
			'/huiyuan' : {
				templateUrl : 'js/huiyuan/huiyuan.html',
				dependencies : [
					'huiyuan/HuiYuanViewController',
					'directives/appDirectives'
				]
			},
			'/baobiao' : {
				templateUrl : 'js/baobiao/baobiao.html',
				dependencies : [
					'baobiao/BaoBiaoViewController',
					'directives/appDirectives'
				]
			},
			'/signin' : {
				templateUrl : 'js/signin/signin.html',
				dependencies : [
					'signin/SigninViewController',
					'directives/appDirectives'
				]
			},
			'/signup' : {
				templateUrl : 'js/signup/signup.html',
				dependencies : [
					'signup/SignupViewController',
					'directives/appDirectives'
				]
			}
		}
	};
});