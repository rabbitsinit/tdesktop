var IV = {
	notify: function(message) {
		if (window.external && window.external.invoke) {
			window.external.invoke(JSON.stringify(message));
		}
	},
	frameClickHandler: function(e) {
		var target = e.target;
		var context = '';
		console.log('click', target);
		while (target) {
			if (target.tagName == 'AUDIO' || target.tagName == 'VIDEO') {
				return;
			}
			if (context === ''
				&& target.hasAttribute
				&& target.hasAttribute('data-context')) {
				context = String(target.getAttribute('data-context'));
			}
			if (target.tagName == 'A') {
				break;
			}
			target = target.parentNode;
		}
		if (!target || !target.hasAttribute('href')) {
			return;
		}
		var base_loc = document.createElement('A');
		base_loc.href = window.currentUrl;
		if (base_loc.origin != target.origin
			|| base_loc.pathname != target.pathname
			|| base_loc.search != target.search) {
			IV.notify({
				event: 'link_click',
				url: target.href,
				context: context,
			});
		}
		e.preventDefault();
	},
	frameKeyDown: function (e) {
		const keyW = (e.key === 'w')
			|| (e.code === 'KeyW')
			|| (e.keyCode === 87);
		const keyQ = (e.key === 'q')
			|| (e.code === 'KeyQ')
			|| (e.keyCode === 81);
		const keyM = (e.key === 'm')
			|| (e.code === 'KeyM')
			|| (e.keyCode === 77);
		if ((e.metaKey || e.ctrlKey) && (keyW || keyQ || keyM)) {
			e.preventDefault();
			IV.notify({
				event: 'keydown',
				modifier: e.ctrlKey ? 'ctrl' : 'cmd',
				key: keyW ? 'w' : keyQ ? 'q' : 'm',
			});
		} else if (e.key === 'Escape' || e.keyCode === 27) {
			e.preventDefault();
			IV.notify({
				event: 'keydown',
				key: 'escape',
			});
		}
	},
	frameMouseEnter: function (e) {
		IV.notify({ event: 'mouseenter' });
	},
	frameMouseUp: function (e) {
		IV.notify({ event: 'mouseup' });
	},
	lastScrollTop: 0,
	frameScrolled: function (e) {
		const now = document.documentElement.scrollTop;
		if (now < 100) {
			document.getElementById('bottom_up').classList.add('hidden');
		} else if (now > IV.lastScrollTop && now > 200) {
			document.getElementById('bottom_up').classList.remove('hidden');
		}
		IV.lastScrollTop = now;
	},
	updateStyles: function (styles) {
		if (IV.styles !== styles) {
			IV.styles = styles;
			document.getElementsByTagName('html')[0].style = styles;
		}
	},
	toggleChannelJoined: function (id, joined) {
		const channels = document.getElementsByClassName('channel');
		const full = 'channel' + id;
		for (var i = 0; i < channels.length; ++i) {
			const channel = channels[i];
			if (String(channel.getAttribute('data-context')) === full) {
				channel.classList.toggle('joined', joined);
			}
		}
	},
	slideshowSlide: function(el, next) {
		var dir = window.getComputedStyle(el, null).direction || 'ltr';
		var marginProp = dir == 'rtl' ? 'marginRight' : 'marginLeft';
		if (next) {
			var s = el.previousSibling.s;
			s.value = (+s.value + 1 == s.length) ? 0 : +s.value + 1;
			s.forEach(function(el){ el.checked && el.parentNode.scrollIntoView && el.parentNode.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'}); });
			el.firstChild.style[marginProp] = (-100 * s.value) + '%';
		} else {
			el.form.nextSibling.firstChild.style[marginProp] = (-100 * el.value) + '%';
		}
		return false;
	},
	initPreBlocks: function() {
		if (!hljs) {
			return;
		}
		var pres = document.getElementsByTagName('pre');
		for (var i = 0; i < pres.length; i++) {
			if (pres[i].hasAttribute('data-language')) {
				hljs.highlightBlock(pres[i]);
			}
		}
	},
	initEmbedBlocks: function() {
		var iframes = document.getElementsByTagName('iframe');
		for (var i = 0; i < iframes.length; i++) {
			(function(iframe) {
				window.addEventListener('message', function(event) {
					if (event.source !== iframe.contentWindow ||
							event.origin != window.origin) {
						return;
					}
					try {
						var data = JSON.parse(event.data);
					} catch(e) {
						var data = {};
					}
					if (data.eventType == 'resize_frame') {
						if (data.eventData.height) {
							iframe.style.height = data.eventData.height + 'px';
						}
					}
				}, false);
			})(iframes[i]);
		}
	},
	addRipple: function (button, x, y) {
		const ripple = document.createElement('span');
		ripple.classList.add('ripple');

		const inner = document.createElement('span');
		inner.classList.add('inner');
		x -= button.offsetLeft;
		y -= button.offsetTop;

		const mx = button.clientWidth - x;
		const my = button.clientHeight - y;
		const sq1 = x * x + y * y;
		const sq2 = mx * mx + y * y;
		const sq3 = x * x + my * my;
		const sq4 = mx * mx + my * my;
		const radius = Math.sqrt(Math.max(sq1, sq2, sq3, sq4));

		inner.style.width = inner.style.height = `${2 * radius}px`;
		inner.style.left = `${x - radius}px`;
		inner.style.top = `${y - radius}px`;
		inner.classList.add('inner');

		ripple.addEventListener('animationend', function (e) {
			if (e.animationName === 'fadeOut') {
				ripple.remove();
			}
		});

		ripple.appendChild(inner);
		button.appendChild(ripple);
	},
	stopRipples: function (button) {
		const ripples = button.getElementsByClassName('ripple');
		for (var i = 0; i < ripples.length; ++i) {
			const ripple = ripples[i];
			if (!ripple.classList.contains('hiding')) {
				ripple.classList.add('hiding');
			}
		}
	},
	init: function () {
		const buttons = document.getElementsByClassName('fixed_button');
		for (let i = 0; i < buttons.length; ++i) {
			const button = buttons[i];
			button.addEventListener('mousedown', function (e) {
				IV.addRipple(e.currentTarget, e.clientX, e.clientY);
			});
			button.addEventListener('mouseup', function (e) {
				IV.stopRipples(e.currentTarget);
			});
			button.addEventListener('mouseleave', function (e) {
				IV.stopRipples(e.currentTarget);
			});
		}
		IV.notify({ event: 'ready' });
	},
	showTooltip: function (text) {
		var toast = document.createElement('div');
		toast.classList.add('toast');
		toast.textContent = text;
		document.body.appendChild(toast);
		setTimeout(function () {
			toast.classList.add('hiding');
		}, 2000);
		setTimeout(function () {
			document.body.removeChild(toast);
		}, 3000);
	},
	toTop: function () {
		document.getElementById('bottom_up').classList.add('hidden');
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
};

document.onclick = IV.frameClickHandler;
document.onkeydown = IV.frameKeyDown;
document.onmouseenter = IV.frameMouseEnter;
document.onmouseup = IV.frameMouseUp;
document.onscroll = IV.frameScrolled;
window.onmessage = IV.postMessageHandler;