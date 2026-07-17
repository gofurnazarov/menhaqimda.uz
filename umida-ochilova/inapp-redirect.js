/**
 * content-gate.js
 * No browser redirect anymore - this is now a pure engagement gate.
 *
 * Shows the #hero section normally, hides everything after it, and
 * places an "O'qishda davom etish ->" button right under the hero.
 * Tapping the button reveals the rest of the page and smooth-scrolls
 * down to #video-section.
 *
 * Only activates for visitors coming from the Instagram / Facebook
 * in-app browser (same audience this was originally built for). If
 * you want this to run for every visitor regardless of app, delete
 * the two lines under "SCOPE CHECK" below.
 *
 * USAGE: Paste as a <script> tag anywhere in <head>, after the
 * CONSULTANT config block. Requires <section id="hero"> and
 * <section id="video-section"> to exist on the page, matching the
 * Faberlic template.
 */
(function () {
	'use strict';

	// ── SCOPE CHECK — remove these two lines to show this to everyone ──
	var ua = navigator.userAgent || navigator.vendor || window.opera || '';
	var isInApp = /FBAN|FBAV/i.test(ua) || /Instagram/i.test(ua);
	//   if (!isInApp) return;
	// ─────────────────────────────────────────────────────────────────

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


	function buildGate() {
		var hero = document.getElementById('hero');
		var heroContainer = document.querySelector('#hero .container');
		if (!hero) return; // template mismatch - do nothing rather than break the page

		// Hide everything after the hero until the button is tapped
		hero.style.height = '100vh';
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

		var gate = document.createElement('div');
		gate.id = 'cg-gate';
		gate.style.cssText =
			'max-width:520px;margin:0 auto;padding:6px 20px 34px;' +
			'font-family:Nunito,-apple-system,Roboto,Arial,sans-serif;';

		gate.innerHTML =
			'<button id="cg-btn" style="' +
			'display:inline-flex;align-items:center;gap:8px;' +
			'background:#c0623a;color:#fff;border:none;' +
			'padding:16px 30px;border-radius:50px;font-size:16px;font-weight:700;' +
			'font-family:Nunito,sans-serif;cursor:pointer;' +
			'box-shadow:0 6px 20px rgba(192,98,58,.32);' +
			'animation:cgPulse 2.2s ease-in-out infinite;">' +
			'🎥 Videoni ko\u2018rish \u2192' +
			'</button>';

		heroContainer.insertAdjacentElement('afterend', gate);

		document.getElementById('cg-btn').addEventListener('click', function () {
			hiddenNodes.forEach(function (item) {
				item.el.style.display = item.display || '';
			});
			gate.style.display = 'none';
			hero.style.height = '';

			var video = document.getElementById('video');
			if (video) {
				video.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
		});
	}

	whenBodyReady(buildGate);
})();