<script lang="ts">
	import { posts, formatDate, readingTime } from '$lib/posts';
	import { headTags, blogSchema, jsonLdScript, SITE_URL } from '$lib/seo';
	import { profile } from '$lib/content';
	import { reveal } from '$lib/motion';

	const meta = headTags({
		title: 'Notes',
		description:
			'Three essays on building websites with AI agents, keeping API keys off static sites, and optimising for AI answers.',
		path: '/blog',
	});

	const schema = jsonLdScript(blogSchema(posts.map((p) => ({ title: p.title, dek: p.dek, path: `/blog/${p.slug}`, date: p.date }))));
</script>

<svelte:head>
	{@html meta.tags.join('\n\t')}
	{@html schema}
</svelte:head>

<section class="wrap" use:reveal>
	<p class="kicker" data-cascade><span class="n">Journal</span> Notes</p>
	<h1 data-cascade>Writing about the <em>build.</em></h1>
	<p class="lede" data-cascade>
		Short pieces from working in public — what worked, what broke, and what I would do differently.
	</p>

	<div class="post-list">
		{#each posts as p, i (p.slug)}
			<a class="post-card" href={`/blog/${p.slug}`} data-cascade style={`--d:${i * 90}ms`}>
				<div class="meta">
					<span class="kind">{p.kind}</span>
					<span class="dot" aria-hidden="true"></span>
					<time datetime={p.date}>{formatDate(p.date)}</time>
					<span class="dot" aria-hidden="true"></span>
					<span>{readingTime(p)} min read</span>
				</div>
				<h2>{p.title}</h2>
				<p class="dek">{p.dek}</p>
				<div class="foot">
					<span class="tag-row">
						{#each p.tags as t}<span>{t}</span>{/each}
					</span>
					<span class="go" aria-hidden="true">↗</span>
				</div>
			</a>
		{/each}
	</div>

	<aside class="cta">
		<p class="kicker-mini">Work together</p>
		<p>
			If any of this is useful to you, I build web interfaces and software to a similar standard.
			<a href="/#contact">Get in touch →</a>
		</p>
		<p class="small">
			Or email <a href={`mailto:${profile.email}`}>{profile.email}</a> ·
			<a href={SITE_URL} rel="canonical">{SITE_URL.replace(/^https?:\/\//, '')}</a>
		</p>
	</aside>
</section>

<style>
	.post-list {
		display: grid;
		gap: 1.4rem;
		margin-top: 4rem;
	}
	.post-card {
		display: block;
		text-decoration: none;
		color: inherit;
		border: 1px solid var(--hairline);
		border-radius: 1.1rem;
		padding: clamp(1.5rem, 3.6vw, 2.6rem);
		background: color-mix(in srgb, #fffdf6 55%, var(--paper));
		transition:
			transform 0.45s var(--ease-out),
			box-shadow 0.45s var(--ease-out),
			border-color 0.45s;
	}
	.post-card:hover {
		transform: translateY(-5px);
		border-color: color-mix(in srgb, var(--gold) 55%, transparent);
		box-shadow: 0 30px 60px -30px color-mix(in srgb, var(--ink) 35%, transparent);
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem;
		font-size: 0.78rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--stone);
		margin-bottom: 1.1rem;
	}
	.meta .kind {
		color: var(--gold);
	}
	.meta .dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--stone);
		opacity: 0.6;
	}
	.post-card h2 {
		font-size: clamp(1.7rem, 3.6vw, 2.6rem);
		margin-bottom: 0.9rem;
	}
	.dek {
		margin: 0 0 1.4rem;
		color: var(--ink-soft);
		font-size: 1.05rem;
		line-height: 1.65;
		max-width: 62ch;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.go {
		font-family: var(--serif);
		font-size: 1.9rem;
		color: var(--gold);
		transition: transform 0.35s var(--ease-out);
	}
	.post-card:hover .go {
		transform: translate(4px, -4px);
	}

	.cta {
		margin-top: 4rem;
		padding: clamp(1.6rem, 4vw, 2.6rem);
		border: 1px solid color-mix(in srgb, var(--gold) 34%, transparent);
		background: color-mix(in srgb, var(--gold-bright) 10%, var(--paper));
		border-radius: 1.1rem;
	}
	.kicker-mini {
		margin: 0 0 0.8rem;
		font-size: 0.72rem;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: var(--gold);
	}
	.cta p {
		margin: 0 0 0.6rem;
		font-size: 1.12rem;
		color: var(--ink);
	}
	.cta a {
		color: var(--gold);
	}
	.cta .small {
		font-size: 0.9rem;
		color: var(--stone);
	}
</style>