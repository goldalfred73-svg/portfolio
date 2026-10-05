// ─────────────────────────────────────────────────────────────
// Motion system. One current: upward. Entries cascade like a
// waterfall (cut-the-curve §6); groups reposition on a slow-fast-
// slow nudge; the cursor leads and every click ignites (oversized-
// cursor, adapted for the web). No idle wobble anywhere.
// ─────────────────────────────────────────────────────────────

interface RevealOptions {
	/** stagger step in ms between cascade children */
	step?: number;
}

/**
 * Waterfall entry. Add data-cascade to children for the wave.
 * Fires a throttled 'atelier:reveal' event for the sound engine.
 */
export function reveal(node: HTMLElement, opts: RevealOptions = {}) {
	const step = opts.step ?? 70;
	const kids = node.querySelectorAll<HTMLElement>('[data-cascade]');
	kids.forEach((kid, i) => {
		kid.style.setProperty('--d', `${Math.min(i * step, 500)}ms`);
	});
	node.classList.add('rv');

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('is-in');
					window.dispatchEvent(new CustomEvent('atelier:reveal'));
					io.disconnect();
				}
			}
		},
		{ threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
	);
	io.observe(node);

	return {
		destroy() {
			io.disconnect();
		}
	};
}

/** Magnetic pull — interactive elements lean toward the pointer. */
export function magnetic(node: HTMLElement, strength = 0.28) {
	if (window.matchMedia('(hover: none)').matches) return {};
	let raf = 0;
	let tx = 0;
	let ty = 0;
	let cx = 0;
	let cy = 0;

	function loop() {
		cx += (tx - cx) * 0.18;
		cy += (ty - cy) * 0.18;
		node.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
		if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
			raf = requestAnimationFrame(loop);
		} else {
			raf = 0;
		}
	}

	function onMove(e: PointerEvent) {
		const r = node.getBoundingClientRect();
		tx = (e.clientX - (r.left + r.width / 2)) * strength;
		ty = (e.clientY - (r.top + r.height / 2)) * strength;
		if (!raf) raf = requestAnimationFrame(loop);
	}

	function onLeave() {
		tx = 0;
		ty = 0;
		if (!raf) raf = requestAnimationFrame(loop);
	}

	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerleave', onLeave);
	return {
		destroy() {
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', onLeave);
			if (raf) cancelAnimationFrame(raf);
		}
	};
}
