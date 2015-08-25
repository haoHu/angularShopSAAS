// ;(function ($) {
// 	// 实现文字滚动显示效果
// 	$.fn.extend({
// 		marquee : function (options) {
// 			var defaults = {
// 				speed : 6,
// 				intervalTime : 20
// 			};
// 			var options = $.extend(defaults, options);
// 			var speed = (document.all) ? options.speed : Math.max(1, options.speed - 1);
// 			if ($(this) == null) return;
// 			var self = this,
// 				timer = null,
// 				$container = $(this),
// 				$content = $container.find('.marquee-cnt'),
// 				initLeft = $container.width();
// 			$content.css({
// 				left : parseInt(initLeft) + 'px'
// 			});
// 			// 定时器,定是移动位移
// 			timer = setInterval(function () {
// 				self.textroll($container, $content, speed);
// 			}, options.intervalTime);
// 			// 为容器绑定鼠标移动到容器上的处理事件，
// 			// 清除定时器，让滚动效果暂停;
// 			// 为容器绑定鼠标移出容器的处理事件；
// 			$container.bind("mouseover", function (e) {
// 				clearInterval(timer);
// 			}).bind("mouseout", function (e) {
// 				timer = setInterval(function () {
// 					self.textroll($container, $content, speed);
// 				}, options.intervalTime);
// 			});
// 			return this;
// 		},
// 		textroll : function ($container, $content, speed) {
// 			var containerWidth = $container.width(),
// 				contentWidth = $content.width();
// 			if (parseInt($content.css("left")) + contentWidth > 0) {
// 				$content.css({
// 					left : parseInt($content.css("left")) - speed + "px"
// 				});
// 			} else {
// 				$content.css({
// 					left : parseInt(containerWidth) + "px"
// 				});
// 			}
// 		}
// 	});
// })(jQuery);


;(function ($) {
	$.fn.extend({
		marquee : function (options) {
			var defaults = {
				speed : 60
			};
			var options = $.extend(defaults, options);
			var that = $(this), tt, child = that.children();
			var pw = that.width(), w = child.width();
			if (pw >= w) return that;
			child.css({left : pw});
			var t = (w + pw) / options.speed * 1000;
			function play(m) {
				if (pw >= w) return;
				var tm = m == undefined ? t : m;
				child.animate({left : -w}, tm, "linear", function () {
					$(this).css("left", pw);
					play();
				});
			}
			child.on({
				mouseenter : function () {
					var l = $(this).position().left;
					$(this).stop();
					tt = (-(-w - l)/options.speed) * 1000;
				},
				mouseleave : function () {
					play(tt);
					tt = undefined;
				}
			});
			play();
		}
	});
})(jQuery);


