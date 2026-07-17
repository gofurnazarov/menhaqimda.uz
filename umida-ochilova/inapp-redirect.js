/**
 * inapp-redirect.js
 * Detects Instagram / Facebook in-app browser and moves the visitor
 * into the device's normal browser (Chrome / Safari).
 *
 * The fallback UI is designed to look like a natural part of the page —
 * warm colors, a friendly explanation, no browser jargon, no dark
 * "warning" overlay — since scary/technical-looking popups make a
 * non-tech audience close the tab instead of tapping.
 *
 * USAGE: Paste as the FIRST <script> in <head>, before any pixel/
 * analytics/video scripts. If a page-level `CONSULTANT` object with
 * a `name` field already exists (as in the Faberlic template), the
 * overlay will personalize itself automatically.
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

	var currentUrl = window.location.href;
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
				'#Intent;scheme=https;package=com.android.chrome;' +
				'S.browser_fallback_url=' + encodeURIComponent(currentUrl) +
				';end';
		} else {
			window.open(currentUrl, '_blank');
		}
	}

	function tryAutoRedirect() {
		if (isIOS || isAndroid) doRedirect();
	}

	function showFallbackCard() {
		// Personalize with the consultant's name if the page defines one
		var name = (typeof window.CONSULTANT !== 'undefined' && window.CONSULTANT.name) ?
			window.CONSULTANT.name.split(' ')[0] :
			null;

		var subline = name ?
			name + ' bilan bog\u2018lanish uchun sahifani to\u2018liq oching' :
			'Sahifani to\u2018liq ko\u2018rish uchun bosing';

		var style = document.createElement('style');
		style.textContent =
			'@keyframes iarFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' +
			'@keyframes iarPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}' +
			'#iar-card *{box-sizing:border-box;}';
		document.head.appendChild(style);

		var overlay = document.createElement('div');
		overlay.id = 'iar-overlay';
		overlay.style.cssText =
			'position:fixed;inset:0;z-index:999999;' +
			'background:rgba(45,31,23,0.55);' + /* warm dark tint, page still visible behind */
			'display:flex;align-items:flex-end;justify-content:center;' +
			'padding:0;font-family:Nunito,-apple-system,Roboto,Arial,sans-serif;';

		overlay.innerHTML =
			'<div id="iar-card" style="' +
			'width:100%;max-width:480px;background:#fdf6ee;' +
			'border-radius:24px 24px 0 0;padding:26px 24px 30px;' +
			'box-shadow:0 -8px 40px rgba(139,58,30,0.25);' +
			'animation:iarFadeIn .35s ease both;' +
			'text-align:center;">' +

			'<div style="width:56px;height:56px;border-radius:50%;background:#f5e6d0;' +
			'display:flex;align-items:center;justify-content:center;margin:0 auto 14px;' +
			'animation:iarPulse 1.8s ease-in-out infinite;">' +
			'<span style="font-size:26px;">\u{1F449}</span>' +
			'</div>' +

			'<div style="font-family:\'Playfair Display\',serif;font-size:19px;' +
			'color:#2d1f17;font-weight:700;margin-bottom:8px;line-height:1.35;">' +
			subline +
			'</div>' +

			'<div style="font-size:14px;color:#7a6255;margin-bottom:22px;line-height:1.6;">' +
			'"Davom etish" ni bosing \u2014 sahifa xuddi shu ko\u2018rinishda davom etadi.' +
			'</div>' +

			'<button id="iar-btn" style="' +
			'width:100%;background:#c0623a;color:#fff;border:none;' +
			'padding:16px 24px;border-radius:50px;font-size:16px;font-weight:700;' +
			'font-family:Nunito,sans-serif;cursor:pointer;' +
			'box-shadow:0 6px 20px rgba(192,98,58,0.35);">' +
			'Davom etish \u2192' +
			'</button>' +

			'</div>';

		document.body.appendChild(overlay);

		document.getElementById('iar-btn').addEventListener('click', function () {
			overlay.style.transition = 'opacity .2s ease';
			overlay.style.opacity = '0';
			doRedirect();
		});
	}

	// 1) Try the silent redirect first
	tryAutoRedirect();

	// 2) If still here after a beat, the silent method was blocked by the
	//    OS/browser — show the warm fallback card instead of doing nothing
	setTimeout(function () {
		if (document.visibilityState === 'visible') {
			showFallbackCard();
		}
	}, 800);
})();