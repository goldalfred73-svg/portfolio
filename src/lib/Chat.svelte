<!-- ─────────────────────────────────────────────────────────────
     Floating atelier concierge.
     Design language follows the site: paper ground, gold hairline
     focal, serif display, uppercase micro-labels, procedural sound.
     Calls /api/chat (a Cloudflare Pages Function) — the Groq key
     never reaches the client, per the static-build constraint.
     ───────────────────────────────────────────────────────────── -->
<script lang="ts">
	import { tick, thock, chime } from '$lib/sound';
	import { profile, projects, services } from '$lib/content';

	type Role = 'user' | 'bot';
	interface Msg {
		role: Role;
		text: string;
	}

	let open = $state(false);
	let busy = $state(false);
	let draft = $state('');
	let messages = $state<Msg[]>([]);
	let scroller: HTMLDivElement | null = $state(null);
	let input: HTMLTextAreaElement | null = $state(null);
	let panel: HTMLDivElement | null = $state(null);
	let trigger: HTMLButtonElement | null = $state(null);
	// Mirrors the server's rate-limit budget (null = server didn't say).
	let rateRemaining = $state<number | null>(null);
	// Seconds until the server will accept questions again; drives the disabled state.
	let cooldown = $state(0);

	const GREETING =
		`Ask me about ${profile.name}'s work, the craft behind it, or how this site is built. I'm a small model behind this panel — I answer about the studio, not the world.`;

	// Grounded in content.ts so answers stay true to the site. Sent as a system
	// turn from the client, which is fine here: it's public site copy, not a secret.
	const SYSTEM = [
		`You are the concierge for ${profile.name}'s personal portfolio website.`,
		`Answer only from the FACTS block below. It is the complete source of truth.`,
		`If the answer is not in FACTS, reply exactly: "I don't have that detail — the contact links below reach ${profile.name} directly."`,
		`Never guess, never infer, never fill gaps with general knowledge.`,
		'',
		'=== FACTS ===',
		`Name: ${profile.name}`,
		`Role: ${profile.role}`,
		`Location: ${profile.location}`,
		`Bio: ${profile.lede}`,
		'',
		'Selected work:',
		...projects.map(
			(p) =>
				`- ${p.title} | ${p.kind} | ${p.year} | ${p.summary} | tech: ${p.tags.join(', ')}`
		),
		'',
		'Services:',
		...services.map((s) => `- ${s.title}: ${s.detail}`),
		'',
		'Contact: ' + profile.socials.map((s) => `${s.label}: ${s.href}`).join(' | '),
		'',
		`Site tech (true): this site is a SvelteKit 2 + Svelte 5 static build on Cloudflare Pages, styled with plain CSS, with motion and sound written by hand.`,
		'',
		'',
		'Writing: three essays on building with AI agents, keeping secrets off static sites, and SEO for AI answers:',
		'- /blog/building-a-website-with-ai-in-2026',
		'- /blog/static-sites-and-the-secret-that-wasnt',
		'- /blog/seo-in-the-age-of-ai-answers',
		'',
		`Point people to ${profile.name} for the full writing, the code behind this panel, or to hire them: ${profile.email}`,
		'',
		'=== END FACTS ===',
		'',
		`Style: 2-4 sentences, plain and warm, no lists unless asked. Refer to the owner as ${profile.name}.`,
	].join('\n');

	// Phrased so every one is answerable from the FACTS block above.
	const SUGGESTIONS = [
		'What is this site built with?',
		'What is Ojo Gold working on?',
		'How do I get in touch?',
	];

	const fine = () =>
		typeof window !== 'undefined' &&
		window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	async function scrollDown() {
		await tick();
		if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: fine() ? 'smooth' : 'auto' });
	}

	async function toggle() {
		open = !open;
		if (open) {
			thock();
			if (messages.length === 0) messages = [{ role: 'bot', text: GREETING }];
			await tick();
			input?.focus();
			await scrollDown();
		} else {
			tick();
			trigger?.focus();
		}
	}

	function close() {
		if (!open) return;
		open = false;
		tick();
		trigger?.focus();
	}

	/** Escape closes from anywhere in the panel; the caret stays inside on Tab. */
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			e.stopPropagation();
			close();
		}
	}

	/** Count a cooldown down once per second while one is active. */
	$effect(() => {
		if (cooldown <= 0) return;
		const id = setInterval(() => {
			cooldown -= 1;
		}, 1000);
		return () => clearInterval(id);
	});

	async function send(text?: string) {
		const content = (text ?? draft).trim();
		if (!content || busy || cooldown > 0) return;

		messages = [...messages, { role: 'user', text: content }];
		draft = '';
		busy = true;
		thock();
		await scrollDown();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					// system first, then the visible transcript
					messages: [
						{ role: 'system', content: SYSTEM },
						...messages.map((m) => ({ role: m.role, content: m.text }))
					],
					max_tokens: 400,
				}),
			});

			const data = await res.json().catch(() => ({}));

			// Track the server's budget so the panel can say something useful instead
			// of letting a visitor hit a wall of 429s.
			const remaining = Number(res.headers.get('X-RateLimit-Remaining'));
			if (Number.isFinite(remaining)) rateRemaining = remaining;
			if (res.status === 429) cooldown = Number(res.headers.get('Retry-After') ?? 60);

			if (!res.ok) {
				messages = [
					...messages,
					{
						role: 'bot',
						text:
							data?.error ??
							'The studio line is down right now. Please email ' + profile.email + ' instead.',
					},
				];
			} else {
				const text2 = (data?.content ?? '').trim();
				messages = [
					...messages,
					{
						role: 'bot',
						// Surface the reasoning-model empty-content case honestly.
						text: text2 || 'I did not get a usable answer back — try rephrasing that?',
					},
				];
				chime();
			}
		} catch {
			messages = [
				...messages,
				{
					role: 'bot',
					text: 'I could not reach the studio line. Please email ' + profile.email + '.',
				},
			];
		} finally {
			busy = false;
			await scrollDown();
		}
	}

	function onComposerKeydown(e: KeyboardEvent) {
		// Enter sends; Shift+Enter makes a newline. Match a chat, not a textarea.
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void send();
		}
	}

	function reset() {
		messages = [{ role: 'bot', text: GREETING }];
		draft = '';
	}
</script>

<svelte:window onkeydown={onKeydown} />

<!-- trigger -->
<button
	bind:this={trigger}
	class="chat-fab"
	class:is-open={open}
	onclick={toggle}
	aria-expanded={open}
	aria-controls="chat-panel"
>
	<span class="glyph" aria-hidden="true"></span>
	<span class="sr-label">{open ? 'Close the concierge' : 'Ask the studio concierge'}</span>
</button>

<!-- panel -->
{#if open}
	<div
		bind:this={panel}
		class="chat-panel"
		id="chat-panel"
		role="dialog"
		aria-modal="false"
		aria-label="Studio concierge"
	>
		<header class="chat-head">
			<div>
				<p class="kicker-mini">Concierge</p>
				<p class="who">
					Studio desk <span class="dot" aria-hidden="true"></span>
					<span class="status">{busy ? 'thinking' : 'online'}</span>
				</p>
			</div>
			<div class="head-actions">
				<button class="mini" onclick={reset} title="Start over">Reset</button>
				<button class="mini close" onclick={close} aria-label="Close the concierge">✕</button>
			</div>
		</header>

		<div class="chat-log" bind:this={scroller} role="log" aria-live="polite" aria-atomic="false">
			{#each messages as m, i (i)}
				<div class="msg {m.role}"><p>{m.text}</p></div>
			{/each}
			{#if busy}
				<div class="msg bot"><p class="typing" aria-label="Composing a reply"><i></i><i></i><i></i></p></div>
			{/if}
		</div>

		{#if messages.length <= 1}
			<div class="suggests">
				{#each SUGGESTIONS as s}
					<button class="chip" onclick={() => send(s)}>{s}</button>
				{/each}
			</div>
		{/if}

		<form
			class="composer"
			onsubmit={(e) => {
				e.preventDefault();
				void send();
			}}
		>
			<label class="sr-label" for="chat-input">Message the concierge</label>
			<textarea
				bind:this={input}
				bind:value={draft}
				id="chat-input"
				rows="1"
				placeholder={cooldown > 0 ? `Available again in ${cooldown}s…` : 'Ask about the work…'}
				disabled={busy || cooldown > 0}
				onkeydown={onComposerKeydown}
			></textarea>
			<button class="send" type="submit" disabled={busy || cooldown > 0 || !draft.trim()}>
				Send <span aria-hidden="true">→</span>
			</button>
		</form>

		{#if rateRemaining !== null && rateRemaining <= 3 && cooldown === 0}
			<p class="budget-note" role="status">
				{rateRemaining} question{rateRemaining === 1 ? '' : 's'} left this minute
			</p>
		{/if}
	</div>
{/if}

<style>
	.sr-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	/* ── trigger ── */
	.chat-fab {
		position: fixed;
		right: clamp(1rem, 3vw, 2rem);
		bottom: clamp(1rem, 3vw, 2rem);
		z-index: 75; /* under the cursor layer (80), above grain (60) */
		width: 3.4rem;
		height: 3.4rem;
		border-radius: 50%;
		border: 1px solid var(--ink);
		background: var(--ink);
		color: var(--gold-bright);
		cursor: pointer;
		display: grid;
		place-items: center;
		box-shadow: 0 18px 40px -18px color-mix(in srgb, var(--ink) 55%, transparent);
		transition:
			transform 0.4s var(--ease-out),
			background-color 0.3s,
			border-color 0.3s;
	}
	.chat-fab:hover {
		transform: translateY(-3px);
		border-color: var(--gold);
	}
	.chat-fab.is-open {
		background: var(--emerald);
		border-color: var(--emerald);
	}
	.chat-fab .glyph {
		position: relative;
		width: 1.05rem;
		height: 1.05rem;
		border: 1.5px solid currentColor;
		border-radius: 50%;
	}
	.chat-fab .glyph::after {
		content: '';
		position: absolute;
		inset: 0.22rem;
		border-radius: 50%;
		background: currentColor;
		transition: transform 0.4s var(--ease-out);
	}
	.chat-fab.is-open .glyph {
		border-radius: 3px;
		transform: rotate(45deg);
	}

	/* ── panel ── */
	.chat-panel {
		position: fixed;
		right: clamp(1rem, 3vw, 2rem);
		bottom: calc(clamp(1rem, 3vw, 2rem) + 4.4rem);
		z-index: 74;
		width: min(23rem, calc(100vw - 2rem));
		max-height: min(34rem, calc(100vh - 8rem));
		display: flex;
		flex-direction: column;
		background: color-mix(in srgb, #fffdf6 78%, var(--paper));
		backdrop-filter: blur(16px);
		border: 1px solid var(--hairline);
		border-radius: 1.1rem;
		overflow: hidden;
		box-shadow: 0 40px 90px -40px color-mix(in srgb, var(--ink) 60%, transparent);
		animation: rise 0.42s var(--ease-out);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.chat-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.1rem;
		border-bottom: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--paper-deep) 45%, transparent);
	}
	.kicker-mini {
		margin: 0;
		font-size: 0.68rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--gold);
	}
	.who {
		margin: 0.2rem 0 0;
		font-family: var(--serif);
		font-size: 1.1rem;
		color: var(--ink);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.who .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--emerald);
	}
	.who .status {
		font-family: var(--sans);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--stone);
	}
	.head-actions {
		display: flex;
		gap: 0.35rem;
	}
	.mini {
		border: 1px solid var(--hairline);
		background: transparent;
		color: var(--stone);
		font: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border-radius: 999px;
		padding: 0.3rem 0.65rem;
		cursor: pointer;
		transition: color 0.25s, border-color 0.25s;
	}
	.mini:hover {
		color: var(--ink);
		border-color: var(--gold);
	}

	.chat-log {
		flex: 1;
		min-height: 9rem;
		overflow-y: auto;
		padding: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		scrollbar-width: thin;
	}
	.msg {
		max-width: 88%;
	}
	.msg p {
		margin: 0;
		padding: 0.7rem 0.95rem;
		font-size: 0.92rem;
		line-height: 1.55;
		border-radius: 0.9rem;
	}
	.msg.bot p {
		background: var(--paper-deep);
		color: var(--ink-soft);
		border: 1px solid var(--hairline);
		border-bottom-left-radius: 0.2rem;
	}
	.msg.user {
		align-self: flex-end;
	}
	.msg.user p {
		background: var(--ink);
		color: var(--paper);
		border-bottom-right-radius: 0.2rem;
	}

	.typing {
		display: inline-flex;
		gap: 4px;
		align-items: center;
	}
	.typing i {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--stone);
		animation: pulse 1s ease-in-out infinite;
	}
	.typing i:nth-child(2) {
		animation-delay: 0.15s;
	}
	.typing i:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes pulse {
		0%,
		60%,
		100% {
			opacity: 0.25;
			transform: translateY(0);
		}
		30% {
			opacity: 1;
			transform: translateY(-2px);
		}
	}

	.budget-note {
		margin: 0;
		padding: 0 1.1rem 0.85rem;
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--gold);
		text-align: right;
	}

	.suggests {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		padding: 0 1.1rem 0.9rem;
	}
	.chip {
		border: 1px solid var(--hairline);
		background: transparent;
		color: var(--stone);
		font: inherit;
		font-size: 0.78rem;
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		cursor: pointer;
		transition: color 0.25s, border-color 0.25s;
	}
	.chip:hover {
		color: var(--ink);
		border-color: var(--gold);
	}

	.composer {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
		padding: 0.85rem 1.1rem 1rem;
		border-top: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--paper-deep) 30%, transparent);
	}
	.composer textarea {
		flex: 1;
		resize: none;
		font: inherit;
		font-size: 0.92rem;
		line-height: 1.45;
		color: var(--ink);
		background: color-mix(in srgb, #fffdf6 70%, var(--paper));
		border: 1px solid var(--hairline);
		border-radius: 0.75rem;
		padding: 0.6rem 0.75rem;
		min-height: 2.4rem;
		max-height: 7rem;
	}
	.composer textarea:focus-visible {
		outline: none;
		border-color: var(--gold);
	}
	.send {
		border: 1px solid var(--ink);
		background: var(--ink);
		color: var(--paper);
		font: inherit;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border-radius: 999px;
		padding: 0.65rem 1rem;
		cursor: pointer;
		transition: background-color 0.25s, opacity 0.25s;
	}
	.send:hover:not(:disabled) {
		background: var(--emerald);
		border-color: var(--emerald);
	}
	.send:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.chat-panel {
			animation: none;
		}
		.typing i {
			animation: none;
			opacity: 0.6;
		}
	}
</style>