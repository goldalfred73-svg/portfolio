<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { profile } from '$lib/content';
	import { unlock, tick, thock, whoosh, chime, setMuted, isMuted } from '$lib/sound';

	let { children } = $props();
	let soundOn = $state(true);
	let progress = $state(0);
	let dot: HTMLDivElement | null = $state(null);
	let ring: HTMLDivElement | null = $state(null);
	let ringHot = $state(false);
	let ringDown = $state(false);

	const fine = () =>
		typeof window !== 'undefined' &&
		window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	onMount(() => {
		setMuted(false);
		soundOn = !isMuted();

		const unlockOnce = () => unlock();
		window.addEventListener('pointerdown', unlockOnce, { once: true });
		window.addEventListener('keydown', unlockOnce, { once: true });

		const onOver = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			if (t.closest('a, button')) {
				tick();
				ringHot = true;
			}
		};
		const onOut = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			if (t.closest('a, button')) ringHot = false;
		};
		const onClick = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			if (t.closest('button, .btn')) thock();
		};
		const onChime = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			if (t.closest('[data-chime]')) chime();
		};
		const onReveal = () => whoosh();
		const onScroll = () => {
			const h = document.documentElement;
			const max = h.scrollHeight - h.clientHeight;
			progress = max > 0 ? h.scrollTop / max : 0;
		};

		document.addEventListener('mouseover', onOver);
		document.addEventListener('mouseout', onOut);
		document.addEventListener('click', onClick);
		document.addEventListener('mouseover', onChime);
		window.addEventListener('atelier:reveal', onReveal);
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		// cursor caravan: dot rides the pointer, ring trails it
		let raf = 0;
		let mx = -100;
		let my = -100;
		let rx = -100;
		let ry = -100;
		const track = (e: PointerEvent) => {
			mx = e.clientX;
			my = e.clientY;
			if (dot) dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
			if (!raf) raf = requestAnimationFrame(loop);
		};
		const loop = () => {
			rx += (mx - rx) * 0.16;
			ry += (my - ry) * 0.16;
			if (ring) {
				const s = ring.offsetWidth / 2;
				ring.style.transform = `translate(${rx - s}px, ${ry - s}px)`;
			}
			if (Math.abs(mx - rx) > 0.2 || Math.abs(my - ry) > 0.2) {
				raf = requestAnimationFrame(loop);
			} else raf = 0;
		};
		const down = () => (ringDown = true);
		const up = () => (ringDown = false);
		if (fine()) {
			document.addEventListener('pointermove', track);
			document.addEventListener('pointerdown', down);
			document.addEventListener('pointerup', up);
		}

		return () => {
			document.removeEventListener('mouseover', onOver);
			document.removeEventListener('mouseout', onOut);
			document.removeEventListener('click', onClick);
			document.removeEventListener('mouseover', onChime);
			window.removeEventListener('atelier:reveal', onReveal);
			window.removeEventListener('scroll', onScroll);
			document.removeEventListener('pointermove', track);
			document.removeEventListener('pointerdown', down);
			document.removeEventListener('pointerup', up);
			if (raf) cancelAnimationFrame(raf);
		};
	});

	function toggleSound() {
		soundOn = !soundOn;
		setMuted(!soundOn);
		if (soundOn) {
			unlock();
			chime();
		}
	}
</script>

<svelte:head>
	<title>{profile.name} — {profile.role}</title>
	<meta name="description" content={profile.lede} />
	<meta name="theme-color" content="#f5f0e4" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="progress" style={`transform: scaleX(${progress})`}></div>
<div class="grain" aria-hidden="true"></div>
<div
	bind:this={dot}
	class="cursor-dot"
	aria-hidden="true"
></div>
<div
	bind:this={ring}
	class="cursor-ring"
	class:is-hot={ringHot}
	class:is-down={ringDown}
	aria-hidden="true"
></div>

<header class="site-head">
	<div class="wrap">
		<a class="brand" href="#top" aria-label="Back to top">
			<span class="mono">{profile.monogram}</span>
			<span>{profile.name}</span>
		</a>
		<nav class="main" aria-label="Sections">
			<a href="#work">Work</a>
			<a href="#practice">Practice</a>
			<a href="#about">About</a>
			<a href="#contact">Contact</a>
		</nav>
		<button class="sound-btn" class:on={soundOn} onclick={toggleSound} aria-pressed={soundOn}>
			<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
			{soundOn ? 'Sound on' : 'Muted'}
		</button>
	</div>
</header>

<main id="top">
	{@render children()}
</main>
