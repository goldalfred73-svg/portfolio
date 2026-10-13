<script lang="ts">
	import PostBody from '$lib/PostBody.svelte';
	import { posts, formatDate, readingTime } from '$lib/posts';
	import { headTags, articleSchema, breadcrumbSchema, jsonLdScript } from '$lib/seo';
	import { profile } from '$lib/content';
	import { reveal } from '$lib/motion';

	let { data } = $props();
	const post = $derived(data.post);

	const meta = $derived(
		headTags({
			title: post.title,
			description: post.dek,
			path: `/blog/${post.slug}`,
			type: 'article',
			published: post.date,
			modified: post.date,
			keywords: post.tags,
		})
	);

	const schema = $derived(
		jsonLdScript([
			articleSchema({ ...post, path: `/blog/${post.slug}` }),
			breadcrumbSchema([
				{ name: 'Home', path: '/' },
				{ name: 'Notes', path: '/blog' },
				{ name: post.title, path: `/blog/${post.slug}` },
			]),
		])
	);

	const more = $derived(posts.filter((p) => p.slug !== post.slug));
</script>

<svelte:head>
	{@html meta.tags.join('\n\t')}
	{@html schema}
</svelte:head>

<article class="wrap" use:reveal>
	<a class="back" href="/blog" data-cascade>← All notes</a>

	<header class="post-head">
		<p class="kicker" data-cascade>
			<span class="n">{post.kind}</span>
			<time datetime={post.date}>{formatDate(post.date)}</time>
		</p>
		<h1 data-cascade>{post.title}</h1>
		<p class="lede" data-cascade>{post.dek}</p>
		<p class="byline" data-cascade>
			By {profile.name} · {readingTime(post)} min read
		</p>
	</header>

	<!-- Answer-first summary. Short, self-contained, and the most extractable
	     text on the page for AI Overviews and other answer engines. -->
	<div class="answer" data-cascade>
		<p class="answer-label">In short</p>
		<p>{post.answer}</p>
	</div>

	<PostBody blocks={post.body} />

	<aside class="author">
		<p class="author-label">Written by</p>
		<p class="author-name">{profile.name}</p>
		<p class="author-bio">{profile.lede}</p>
		<div class="author-actions">
			<a class="btn solid" href={`mailto:${profile.email}`}>Work with me <span class="arrow" aria-hidden="true">→</span></a>
			<a class="btn ghost" href="/#contact">Contact <span class="arrow" aria-hidden="true">↗</span></a>
		</div>
	</aside>

	<section class="more">
		<p class="kicker"><span class="n">More</span> Keep reading</p>
		{#each more as p (p.slug)}
			<a class="more-card" href={`/blog/${p.slug}`}>
				<span class="kind">{p.kind} · {readingTime(p)} min</span>
				<h3>{p.title}</h3>
				<p>{p.dek}</p>
				<span class="go" aria-hidden="true">↗</span>
			</a>
		{/each}
	</section>
</article>

<style>
	.back {
		display: inline-block;
		margin-bottom: 2.5rem;
		font-size: 0.82rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--stone);
		text-decoration: none;
	}
	.back:hover {
		color: var(--gold);
	}

	.post-head {
		max-width: 72ch;
	}
	.post-head .kicker {
		margin-bottom: 2rem;
	}
	.post-head .kicker time {
		color: var(--stone);
	}
	.post-head h1 {
		font-size: clamp(2.4rem, 6vw, 4.6rem);
		margin-bottom: 1.4rem;
	}
	.byline {
		margin: 2rem 0 0;
		font-size: 0.85rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--stone);
	}

	.answer {
		margin: 3rem 0 3.5rem;
		padding: clamp(1.4rem, 3.4vw, 2rem);
		max-width: 68ch;
		border-left: 2px solid var(--gold);
		background: color-mix(in srgb, var(--gold-bright) 11%, var(--paper));
		border-radius: 0 0.9rem 0.9rem 0;
	}
	.answer-label {
		margin: 0 0 0.6rem;
		font-size: 0.7rem;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: var(--gold);
	}
	.answer p {
		margin: 0;
		font-size: 1.12rem;
		line-height: 1.68;
		color: var(--ink);
	}

	.author {
		margin-top: 4.5rem;
		max-width: 68ch;
		padding: clamp(1.6rem, 4vw, 2.6rem);
		border: 1px solid var(--hairline);
		border-radius: 1.1rem;
		background: color-mix(in srgb, #fffdf6 55%, var(--paper));
	}
	.author-label {
		margin: 0 0 0.5rem;
		font-size: 0.7rem;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: var(--gold);
	}
	.author-name {
		margin: 0 0 0.8rem;
		font-family: var(--serif);
		font-size: 1.8rem;
		color: var(--ink);
	}
	.author-bio {
		margin: 0 0 1.6rem;
		color: var(--ink-soft);
		line-height: 1.65;
		max-width: 56ch;
	}
	.author-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
	}
	.author-actions .btn {
		padding: 0.8rem 1.4rem;
		font-size: 0.82rem;
	}

	.more {
		margin-top: 4.5rem;
	}
	.more-card {
		position: relative;
		display: block;
		text-decoration: none;
		color: inherit;
		border: 1px solid var(--hairline);
		border-radius: 1.1rem;
		padding: clamp(1.3rem, 3.2vw, 2rem);
		margin-bottom: 1rem;
		background: color-mix(in srgb, #fffdf6 55%, var(--paper));
		transition:
			transform 0.4s var(--ease-out),
			border-color 0.4s,
			box-shadow 0.4s var(--ease-out);
	}
	.more-card:hover {
		transform: translateY(-4px);
		border-color: color-mix(in srgb, var(--gold) 55%, transparent);
		box-shadow: 0 24px 50px -30px color-mix(in srgb, var(--ink) 35%, transparent);
	}
	.more-card .kind {
		font-size: 0.75rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--stone);
	}
	.more-card h3 {
		font-size: clamp(1.3rem, 2.8vw, 1.9rem);
		margin: 0.6rem 0 0.6rem;
		max-width: 40ch;
	}
	.more-card p {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.98rem;
		max-width: 60ch;
	}
	.more-card .go {
		position: absolute;
		top: 1.4rem;
		right: 1.5rem;
		font-family: var(--serif);
		font-size: 1.7rem;
		color: var(--gold);
		transition: transform 0.35s var(--ease-out);
	}
	.more-card:hover .go {
		transform: translate(3px, -3px);
	}
</style>