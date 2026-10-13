// ─────────────────────────────────────────────────────────────
// SEO primitives. One place for canonical URLs, Open Graph, Twitter
// cards and JSON-LD so every route emits them consistently.
//
// Site URL comes from PUBLIC_SITE_URL if set at build time, else falls
// back to the canonical production domain. Change it here, not in ten
// templates.
// ─────────────────────────────────────────────────────────────

import { profile } from '$lib/content';

export const SITE_URL = (
	import.meta.env.PUBLIC_SITE_URL ?? 'https://ojo-gold-portfolio.pages.dev'
).replace(/\/$/, '');

/** Canonical absolute URL for a path. Pass '' for the home page. */
export function canonical(path = ''): string {
	const clean = path === '/' ? '' : path.replace(/^\//, '');
	return `${SITE_URL}/${clean}`.replace(/\/$/, '');
}

export interface PageMeta {
	title: string;
	description: string;
	path?: string;
	type?: 'website' | 'article';
	published?: string;
	modified?: string;
	keywords?: string[];
}

/**
 * Build the full head-tag set for a route.
 *
 * Returned as strings so callers can splat them into <svelte:head>. The JSON-LD
 * is serialised with `<` escaped — otherwise a description containing markup
 * can break out of the script tag.
 */
export function headTags(meta: PageMeta) {
	const url = canonical(meta.path ?? '');
	const isArticle = meta.type === 'article';
	const fullTitle =
		meta.title === profile.name
			? `${profile.name} — ${profile.role}`
			: `${meta.title} — ${profile.name}`;

	return {
		fullTitle,
		canonical: url,
		tags: [
			`<title>${escapeHtml(fullTitle)}</title>`,
			`<meta name="description" content="${escapeAttr(meta.description)}" />`,
			`<link rel="canonical" href="${escapeAttr(url)}" />`,
			`<meta property="og:type" content="${isArticle ? 'article' : 'website'}" />`,
			`<meta property="og:url" content="${escapeAttr(url)}" />`,
			`<meta property="og:title" content="${escapeAttr(fullTitle)}" />`,
			`<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
			`<meta property="og:site_name" content="${escapeAttr(profile.name)}" />`,
			`<meta property="og:image" content="${escapeAttr(`${SITE_URL}/og.png`)}" />`,
			`<meta name="twitter:card" content="summary_large_image" />`,
			`<meta name="twitter:title" content="${escapeAttr(fullTitle)}" />`,
			`<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`,
			meta.keywords?.length
				? `<meta name="keywords" content="${escapeAttr(meta.keywords.join(', '))}" />`
				: '',
			meta.published ? `<meta property="article:published_time" content="${meta.published}" />` : '',
			meta.modified ? `<meta property="article:modified_time" content="${meta.modified}" />` : '',
		].filter(Boolean),
	};
}

/** The person entity, emitted once on the home page. */
export function personSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: profile.name,
		jobTitle: profile.role,
		description: profile.lede,
		url: SITE_URL,
		email: `mailto:${profile.email}`,
		sameAs: profile.socials
			.filter((s) => s.href.startsWith('http'))
			.map((s) => s.href),
		address: {
			'@type': 'PostalAddress',
		addressLocality: profile.location,
		addressCountry: 'NG',
		},
		knowsAbout: ['Software engineering', 'Web interfaces', 'Design systems', 'Mechanical engineering'],
	};
}

export function blogSchema(posts: { title: string; dek: string; path: string; date: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: `${profile.name} — Notes`,
		description: 'Essays on building with AI agents, keeping secrets off static sites, and SEO for AI answers.',
		url: canonical('/blog'),
		author: { '@type': 'Person', name: profile.name, url: SITE_URL },
		blogPost: posts.map((p) => ({
			'@type': 'BlogPosting',
			headline: p.title,
			description: p.dek,
			url: canonical(p.path),
			datePublished: p.date,
			author: { '@type': 'Person', name: profile.name },
		})),
	};
}

export function articleSchema(post: { title: string; dek: string; path: string; date: string; answer: string; tags: string[] }) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.dek,
		// The direct answer doubles as the article body excerpt for answer engines.
		abstract: post.answer,
		url: canonical(post.path),
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonical(post.path) },
		datePublished: post.date,
		dateModified: post.date,
		keywords: post.tags.join(', '),
		inLanguage: 'en',
		author: { '@type': 'Person', name: profile.name, url: SITE_URL },
		publisher: { '@type': 'Person', name: profile.name, url: SITE_URL },
		image: `${SITE_URL}/og.png`,
	};
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((t, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: t.name,
			item: canonical(t.path),
		})),
	};
}

/** Serialise JSON-LD safely for inline embedding. */
export function jsonLd(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026');
}

/**
 * Build a complete <script type="application/ld+json"> tag as a string.
 *
 * Svelte does not interpolate `{expr}` inside a <script> element in the template —
 * it emits the literal text — and `{@html}` is likewise ignored there. So the whole
 * tag has to be constructed as a string and injected with `{@html}` inside
 * <svelte:head>. Verified against the prerendered output: without this the page
 * ships the literal text `{schema}`, which is not valid JSON-LD.
 */
export function jsonLdScript(data: unknown): string {
	return `<script type="application/ld+json">${jsonLd(data)}</script>`;
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
	return escapeHtml(s).replace(/"/g, '&quot;');
}