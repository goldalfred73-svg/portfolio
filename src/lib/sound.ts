// ─────────────────────────────────────────────────────────────
// Procedural interface-sound engine (Web Audio, zero audio files).
// Doctrine: sound-design + sfx-pack — dry, close, real-world icons,
// high pitch = small/light, never alarm bands, always subtle.
// The context unlocks on the visitor's first gesture (browser policy).
// ─────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let lastTick = 0;
let lastWhoosh = 0;

function ensure(): boolean {
	if (muted || typeof window === 'undefined') return false;
	try {
		if (!ctx) {
			const AC = window.AudioContext;
			if (!AC) return false;
			ctx = new AC();
			master = ctx.createGain();
			master.gain.value = 0.16;
			master.connect(ctx.destination);
		}
		if (ctx.state === 'suspended') void ctx.resume();
		return true;
	} catch {
		return false;
	}
}

/** Call once from a first pointerdown/keydown listener. */
export function unlock(): void {
	ensure();
}

export function setMuted(value: boolean): void {
	muted = value;
	if (master && ctx) {
		master.gain.setTargetAtTime(value ? 0 : 0.16, ctx.currentTime, 0.02);
	}
}

export function isMuted(): boolean {
	return muted;
}

function env(gain: GainNode, t: number, peak: number, decay: number): void {
	gain.gain.setValueAtTime(0.0001, t);
	gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.008);
	gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
}

/** Hover tick — tiny dry glass-nozzle click. High = small/light. */
export function tick(): void {
	const now = performance.now();
	if (now - lastTick < 45) return;
	lastTick = now;
	if (!ensure() || !ctx || !master) return;
	const t = ctx.currentTime;
	const osc = ctx.createOscillator();
	const g = ctx.createGain();
	osc.type = 'triangle';
	osc.frequency.value = 1500 + Math.random() * 260;
	osc.connect(g);
	g.connect(master);
	env(g, t, 0.5, 0.05);
	osc.start(t);
	osc.stop(t + 0.07);
}

/** Press thock — small wooden knock, pitch falling with weight. */
export function thock(): void {
	if (!ensure() || !ctx || !master) return;
	const t = ctx.currentTime;
	const osc = ctx.createOscillator();
	const g = ctx.createGain();
	osc.type = 'sine';
	osc.frequency.setValueAtTime(340, t);
	osc.frequency.exponentialRampToValueAtTime(170, t + 0.09);
	osc.connect(g);
	g.connect(master);
	env(g, t, 0.7, 0.11);
	osc.start(t);
	osc.stop(t + 0.13);
}

/** Reveal whoosh — soft band-passed air rising with the scroll. */
export function whoosh(): void {
	const now = performance.now();
	if (now - lastWhoosh < 350) return;
	lastWhoosh = now;
	if (!ensure() || !ctx || !master) return;
	const t = ctx.currentTime;
	const dur = 0.4;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	const src = ctx.createBufferSource();
	src.buffer = buffer;
	const bp = ctx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.Q.value = 1.4;
	bp.frequency.setValueAtTime(420, t);
	bp.frequency.exponentialRampToValueAtTime(2600, t + dur);
	const g = ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.6);
	g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	src.connect(bp);
	bp.connect(g);
	g.connect(master);
	src.start(t);
}

/** Resolve chime — two soft sine voices landing the contact CTA. */
export function chime(): void {
	if (!ensure() || !ctx || !master) return;
	const t = ctx.currentTime;
	for (const [i, freq] of [660, 990].entries()) {
		const osc = ctx!.createOscillator();
		const g = ctx!.createGain();
		osc.type = 'sine';
		osc.frequency.value = freq;
		osc.connect(g);
		g.connect(master!);
		env(g, t + i * 0.09, 0.28, 0.55);
		osc.start(t + i * 0.09);
		osc.stop(t + i * 0.09 + 0.6);
	}
}
