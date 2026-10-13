<!-- Renders typed post blocks inside the atelier design system.
     Deliberately not a markdown pipeline: blocks stay type-safe and the
     typography matches the rest of the site without extra dependencies. -->
<script lang="ts">
	import type { Block } from '$lib/posts';

	let { blocks }: { blocks: Block[] } = $props();
</script>

<div class="prose">
	{#each blocks as b, i (i)}
		{#if b.t === 'p'}
			<p>{b.text}</p>
		{:else if b.t === 'h2'}
			<h2>{b.text}</h2>
		{:else if b.t === 'ul'}
			<ul>
				{#each b.items as item}<li>{item}</li>{/each}
			</ul>
		{:else if b.t === 'ol'}
			<ol>
				{#each b.items as item}<li>{item}</li>{/each}
			</ol>
		{:else if b.t === 'code'}
			<pre><code>{b.text}</code></pre>
		{:else if b.t === 'quote'}
			<blockquote>
				<p>{b.text}</p>
				{#if b.cite}<cite>{b.cite}</cite>{/if}
			</blockquote>
		{:else if b.t === 'callout'}
			<aside>
				<p class="label">{b.label}</p>
				<p class="text">{b.text}</p>
			</aside>
		{/if}
	{/each}
</div>

<style>
	.prose {
		max-width: 68ch;
	}
	.prose :global(p) {
		margin: 0 0 1.5rem;
		font-size: 1.06rem;
		line-height: 1.75;
		color: var(--ink-soft);
	}
	.prose :global(h2) {
		font-size: clamp(1.6rem, 3.4vw, 2.3rem);
		margin: 3.2rem 0 1.3rem;
		color: var(--ink);
	}
	.prose :global(h2:first-child) {
		margin-top: 0;
	}
	.prose :global(ul),
	.prose :global(ol) {
		margin: 0 0 1.6rem;
		padding-left: 1.3rem;
		color: var(--ink-soft);
		font-size: 1.04rem;
		line-height: 1.7;
	}
	.prose :global(li) {
		margin-bottom: 0.6rem;
	}
	.prose :global(li::marker) {
		color: var(--gold);
	}
	.prose :global(pre) {
		margin: 0 0 1.8rem;
		padding: 1.1rem 1.2rem;
		background: var(--ink);
		color: var(--paper);
		border-radius: 0.9rem;
		overflow-x: auto;
		font-size: 0.86rem;
		line-height: 1.6;
	}
	.prose :global(blockquote) {
		margin: 0 0 1.8rem;
		padding-left: 1.3rem;
		border-left: 2px solid var(--gold);
	}
	.prose :global(blockquote p) {
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.24rem;
		line-height: 1.5;
		color: var(--ink);
		margin-bottom: 0.4rem;
	}
	.prose :global(blockquote cite) {
		font-size: 0.84rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--stone);
		font-style: normal;
	}
	.prose :global(aside) {
		margin: 0 0 1.9rem;
		padding: 1.2rem 1.3rem;
		background: color-mix(in srgb, var(--gold-bright) 13%, var(--paper));
		border: 1px solid color-mix(in srgb, var(--gold) 34%, transparent);
		border-radius: 0.9rem;
	}
	.prose :global(aside .label) {
		margin: 0 0 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--gold);
	}
	.prose :global(aside .text) {
		margin: 0;
		color: var(--ink);
	}
</style>