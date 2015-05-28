(function () {
	var PipeClz = PushStream;
	var ifWebSocketOnly = false;
	var host = window.location.hostname;
	var port = window.location.port;
	var protocol = window.location.protocol;
	var urlPrefix = null;

	var setConnectTimeout = function (s) {
		if (s.connectTimeout) {
			return;
		}
		s.connectTimeout = window.setTimeout(function () {
			s.connectTimeout = null;
			var ps = s.pipe;
			if (ps.channelsCount > 0) {
				ps.connect();
			} else {
				ps.disconnect();
			}
		}, 0);
	};

	var sendMsg = function (channelNames, msgStr, onOk, onFail) {
		IX.iterate(channelNames, function (channelName) {
			PipeClz.sendMessage(urlPrefix + channelName, msgStr, onOk, onFail);
		});
	};

	var initPipe = function (sockUrl) {
		if (!host && !port) {
			host = Hualala.Global.HOST;
			protocol = Hualala.Global.HOME.split("//")[0];
			port = Hualala.Global.PORT || ((protocol == "https:") ? 443 : 80);
		}
		urlPrefix = [protocol, "//", host, (port!=80 && port!=443) ?( ":" + port):"", sockUrl || "/pub","?id="].join("");
		return new PipeClz({
			host : host,
			port : port,
			modes : ifWebSecketOnly || Hualala.isClient ? "websocket" : "websocket|eventsource|stream",
			useSSL : (protocol == 'https:')
		});
	};

	/**
	 * 通道封装
	 * 
	 * @param {[type]} s   Socket实例
	 * @param {[type]} cfg 
	 *        cfg : {
	 *        	name : 
	 *        }
	 */
	var Channel = function (s, cfg) {
		var name = $XP(cfg, 'name', 'sys');
		var msgCallback = $XF(cfg, "msgCallback");

		var msgEncoder = $XP(cfg, "msgEncoder");
		if (!IX.isFn(msgEncoder)) {
			msgDecoder = function (str) {return JSON.parse(str);};
		}
		return {
			recv : function (msgStr, id) {
				msgCallback(msgDecoder(msgStr), id);
			},
			send : function (obj, onOk, onFail) {
				sendMsg([name], msgEncoder(obj), onOk, onFail);
			},
			close : function () {
				s.close(name);
			}
		};
	};

	/**
	 * Socket封装
	 * @param {[type]} sockUrl [description]
	 */
	var Socket = function (sockUrl) {
		var channels = {}, self = null, pipe = initPipe(sockUrl);
		var _recv = function (msgText, id, channelName) {
			var ch = channels[channelName];
			ch && ch.recv(msgText, id);
		};
		pipe.onmessage = _recv;
		self = {
			pipe : pipe,
			connectTimeout : null,
			close : function (name) {
				var ch = channels[name];
				if (!ch) return;
				pipe.removeChannel(name);
				delete channels[name];
				setConnectTimeout(self);
			}
		};
		return {
			send : function (chs, obj, onOk, onFail) {
				sendMsg(chs, JSON.stringify(obj), onOk, onFail);
			},
			openChannel : function (options) {
				pipe.disconnect();
				var name = options.name;
				pipe.addChannel(name);
				var ch = new Channel(self, options);
				channels[name] = ch;
				setConnectTimeout(self);
				return ch;
			},
			getChannel : function (name) {
				return channels[name] || null;
			},
			getAllChannelKeys : function () {
				var keys = [];
				for (var k in channels) {
					keys.push(k);
				}
				return keys;
			},
			closeChannel : self.close,
			closeAllChannels : function () {
				pipe.removeAllChannels();
				channels = {};
				setConnectTimeout(self);
			}
		};
	};


	IX.ns("Hualala.Socket");
	var sock = null;
	/**
	 * 初始化Socket封装
	 * @param  {String} mode "mobile"(移动设备)|"client"(客户端)
	 * @param  {[type]} url  [description]
	 * @return {[type]}      [description]
	 */
	Hualala.Socket.init = function (mode, url) {
		if (mode == "mobile") {
			PipeClz = null;
			ifWebSocketOnly = true;
			if ("WebSocket" in window) {
				PipeClz = PushStream;
			} else {
				return;
			}
		} else if (mode == 'client') {
			host = null;
			port = null;
		}

		sock = new Socket(url);
		Hualala.Socket.listen = sock.openChannel;
		Hualala.Socket.unlisten = sock.closeChannel;
		Hualala.Socket.close = sock.closeAllChannels;
		Hualala.Socket.getChannel = sock.getChannel;
		Hualala.Socket.sendOnChnnel = sock.send;
		Hualala.Socket.getAllChannelKeys = sock.getAllChannelKeys;
		
	};
})();