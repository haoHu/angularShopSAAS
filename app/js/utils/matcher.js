// Hualala.Matcher
(function(){
	IX.ns("Hualala");
	
	//支持的语言种类
	var langs = "zh-cn,zh-tw,en,";
	/*
		var matcher = new Matcher();
		matcher.match
			params : key  匹配条件
					 callback 回调 参数 infolist[{id,name,py}......]
					 lang 语言种类 但不会改变config.lang
		matcher.refresh	刷新匹配文件
	*/
	Hualala.Matcher = function(cfg){
		var config = $.extend(true, {
			lang : "zh-cn"
		}, cfg);

		var _matcher = new Pymatch([]);

		var _loadMatchConfig = function(lang, callback){
			//IX.Net.loadFile("../" + lang + ".json", function(rspTxt){});
			callback && callback();
		};

		var _match = function(key,data, callback){
			_matcher.setNames(data);
			callback.call(null,_matcher.match(key));	
		};
		_loadMatchConfig(config.lang);

		return {
			match: function(key, data, callback, lang){
				if(lang && langs.indexOf(lang + ",") > -1){
					_loadMatchConfig(lang, function(){
						_match(key,data, callback);
					});
				}else{
					_match(key, data, callback);
				}
			},
			refresh:function(lang){
				lang = lang && langs.indexOf(lang + ",") > -1 ? lang : config.lang;
				_loadMatchConfig(config.lang);
			}
		};
	};
})();
