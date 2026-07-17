/**
 * inapp-redirect.js
 * Detects Instagram / Facebook in-app browser and moves the visitor
 * into the device's normal browser (Chrome / Safari).
 *
 * DESIGN: instead of a modal popup, this shows the #hero section
 * fully and normally, then gates everything AFTER it behind an
 * inline "O'qishda davom etish ->" button (matches the page's own
 * copy: "...o'qishda davom eting"). Nothing below the hero is
 * rendered until the visitor taps that button, so it still works
 * as a real gate - it just never looks like a system dialog or a
 * popup, which matters a lot for a cautious, non-technical audience.
 *
 * On Android, Instagram shows its OWN native "You're leaving our
 * app" confirmation after any intent:// launch - that's Meta's
 * gate, built into the Instagram app, and no script can suppress
 * it. This version tells the visitor about that step in advance
 * (small note under the button) so it reads as an expected next
 * step rather than a surprise.
 *
 * USAGE: Paste as the FIRST <script> in <head>, before any pixel/
 * analytics/video scripts. Requires a <section id="hero"> as used
 * in the Faberlic template - if no #hero element is found, it
 * falls back to a plain bottom-sheet card so the script never
 * breaks other pages.
 */
(function () {
	'use strict';

	var ua = navigator.userAgent || navigator.vendor || window.opera || '';

	var isFacebook = /FBAN|FBAV/i.test(ua);
	var isInstagram = /Instagram/i.test(ua);
	var isInApp = isFacebook || isInstagram;

	  if (!isInApp) return;
	  if (sessionStorage.getItem('iar_redirected') === '1') return;

	var isIOS = /iPhone|iPad|iPod/i.test(ua);
	var isAndroid = /Android/i.test(ua);

	var currentUrl = window.location.href + '#video';
	var urlNoProtocol = currentUrl.replace(/^https?:\/\//, '');

	function markRedirected() {
		try {
			sessionStorage.setItem('iar_redirected', '1');
		} catch (e) {}
	}

	function doRedirect() {
		markRedirected();
		if (isIOS) {
			window.location.href = 'x-safari-' + currentUrl;
		} else if (isAndroid) {
			window.location.href =
				'intent://' + urlNoProtocol +
				'#Intent;scheme=https;' +
				'S.browser_fallback_url=' + encodeURIComponent(currentUrl) +
				';end';
		} else {
			window.open(currentUrl, '_blank');
		}
	}

	// Robust "wait until document.body exists" helper.
	function whenBodyReady(callback) {
		if (document.body) {
			callback();
			return;
		}
		document.addEventListener('DOMContentLoaded', function () {
			if (document.body) {
				callback();
			} else {
				var attempts = 0;
				var poll = setInterval(function () {
					attempts++;
					if (document.body) {
						clearInterval(poll);
						callback();
					} else if (attempts > 40) {
						clearInterval(poll);
					}
				}, 50);
			}
		});
	}

	var androidHintHTML = isAndroid ?
		'<div style="font-size:12.5px;color:#8b6f5c;margin-top:12px;' +
		'background:#f5e6d0;border-radius:12px;padding:9px 14px;line-height:1.5;' +
		'max-width:340px;margin-left:auto;margin-right:auto;">' +
		'\u2139\uFE0F Bosgandan keyin yana bitta oyna chiqishi mumkin \u2014 ' +
		'u yerda <strong>"Continue"</strong> tugmasini bosing.' +
		'</div>' :
		'';

	// ── Preferred path: inline gate right after #hero ──
	function buildInlineGate() {
		//  var hero = document.getElementById('hero');
		var hero = document.querySelector('#hero');
		var heroContainer = document.querySelector('#hero .container');
		if (!hero) return false;

		// Hide everything after the hero section until the button is tapped
		var hiddenNodes = [];
		var node = hero.nextElementSibling;
		while (node) {
			hiddenNodes.push({
				el: node,
				display: node.style.display
			});
			node.style.display = 'none';
			node = node.nextElementSibling;
		}

		hero.style.cssText += 'height: 100vh;';

		var gate = document.createElement('div');
		gate.id = 'iar-gate';
		gate.style.cssText =
			'max-width:520px;margin:0 auto;padding:35px 20px 35px;' +
			'font-family:Nunito,-apple-system,Roboto,Arial,sans-serif;' +
			'animation:iarFadeIn .4s ease both;';

		gate.innerHTML =
			'<button id="iar-btn" style="' +
			'display:inline-flex;align-items:center;gap:8px;' +
			'background:#c0623a;color:#fff;border:none;' +
			'padding:16px 30px;border-radius:50px;font-size:16px;font-weight:700;' +
			'font-family:Nunito,sans-serif;cursor:pointer;' +
			'box-shadow:0 6px 20px rgba(192,98,58,.32);' +
			'animation:iarPulse 2.2s ease-in-out infinite;">' +
			'🎥 Videoni ko\u2018rish → ' +
			'</button>' +
			androidHintHTML;

		heroContainer.insertAdjacentElement('afterend', gate);

		document.getElementById('iar-btn').addEventListener('click', function () {
			// Reveal the rest of the page regardless of what happens next -
			// never leave the visitor stuck with no way forward.
			hiddenNodes.forEach(function (item) {
				item.el.style.display = item.display || '';
			});
			gate.style.display = 'none';
			doRedirect();
		});

		return true;
	}

	// ── Fallback path: no #hero found on this page, use a small
	//    bottom-sheet card instead so the script still works elsewhere ──
	function buildFallbackCard() {
		injectKeyframes();

		var overlay = document.createElement('div');
		overlay.id = 'iar-overlay';
		overlay.style.cssText =
			'position:fixed;inset:0;z-index:999999;background:rgba(45,31,23,0.5);' +
			'display:flex;align-items:flex-end;justify-content:center;' +
			'font-family:Nunito,-apple-system,Roboto,Arial,sans-serif;';

		overlay.innerHTML =
			'<div style="width:100%;max-width:480px;background:#fdf6ee;' +
			'border-radius:24px 24px 0 0;padding:24px 22px 28px;' +
			'box-shadow:0 -8px 40px rgba(139,58,30,.25);' +
			'animation:iarFadeIn .35s ease both;text-align:center;">' +
			'<div style="font-size:15px;color:#2d1f17;font-weight:700;margin-bottom:16px;">' +
			'Sahifani to\u2018liq ko\u2018rish uchun bosing' +
			'</div>' +
			'<button id="iar-btn" style="width:100%;background:#c0623a;color:#fff;' +
			'border:none;padding:15px 24px;border-radius:50px;font-size:15px;' +
			'font-weight:700;font-family:Nunito,sans-serif;cursor:pointer;">' +
			'Davom etish \u2192' +
			'</button>' +
			androidHintHTML +
			'</div>';

		document.body.appendChild(overlay);
		document.getElementById('iar-btn').addEventListener('click', function () {
			overlay.remove();
			doRedirect();
		});
	}

	function showGate() {
		var built = buildInlineGate();
		if (!built) buildFallbackCard();
	}

	if (isIOS) {
		// iOS has no native second gate, so try the silent method first.
		// Most visitors never see any UI at all.
		doRedirect();
		setTimeout(function () {
			if (document.visibilityState === 'visible') {
				whenBodyReady(showGate);
			}
		}, 800);
	} else if (isAndroid) {
		// Android always shows Instagram's own gate after the intent
		// fires, so there's no benefit to a silent attempt - lead with
		// the inline gate immediately.
		whenBodyReady(showGate);
	}
})();