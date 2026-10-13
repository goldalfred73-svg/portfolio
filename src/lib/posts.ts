// ─────────────────────────────────────────────────────────────
// Blog posts. Same rule as the rest of the site copy: edit words
// here, everything updates.
//
// Posts are typed blocks rather than markdown so they render inside the
// atelier design system (kickers, hairlines, serif headings) without a
// markdown dependency, and so the whole thing stays prerenderable.
//
// `answer` is deliberate and not decoration: it is the 2-3 sentence direct
// response placed at the top of each post. That is the single most
// extractable thing on the page for AI Overviews / answer engines, which
// quote short self-contained claims far more readily than prose.
// ─────────────────────────────────────────────────────────────

export type Block =
	| { t: 'p'; text: string }
	| { t: 'h2'; text: string }
	| { t: 'ul'; items: string[] }
	| { t: 'ol'; items: string[] }
	| { t: 'code'; lang: string; text: string }
	| { t: 'quote'; text: string; cite?: string }
	| { t: 'callout'; label: string; text: string };

export interface Post {
	slug: string;
	title: string;
	/** Meta description. Kept under ~155 chars so it survives truncation. */
	dek: string;
	/** Direct answer, shown as the post's opening summary. */
	answer: string;
	date: string;
	kind: string;
	tags: string[];
	body: Block[];
}

export const posts: Post[] = [
	// ─────────────────────────────────────────────────────────────
	{
		slug: 'building-a-website-with-ai-in-2026',
		title: 'Building a website with AI in 2026: the workflow that actually holds up',
		dek: 'Coding agents are good enough to build real sites now. The skill is not prompting — it is supervising a loop, and knowing where to stop trusting.',
		answer:
			'The most reliable way to build a website with AI in 2026 is to treat the model as an agent inside a supervised loop — observe, plan, act, evaluate — rather than as a one-shot code generator. You keep ownership of architecture, secrets, and verification, and let the agent handle the repetitive implementation. The limiting factor is your ability to verify output, not the quality of the prompts.',
		date: '2026-10-11',
		kind: 'Practice',
		tags: ['Coding agents', 'SvelteKit', 'Workflow'],
		body: [
			{
				t: 'p',
				text: 'There is a version of this advice that is already obsolete: prompt a model, receive a page, deploy it. That produced beautiful demos and unmaintainable repos. What works now is less glamorous and much more durable.',
			},
			{ t: 'h2', text: 'The loop is the unit of work' },
			{
				t: 'p',
				text: 'Every serious coding agent runs the same internal cycle: inspect the repository, decide what to do, edit or run something, read the result, then decide again. Once you understand that shape, you stop treating the model as an oracle and start supervising it.',
			},
			{
				t: 'ol',
				items: [
					'Observe — let it read the real files, not your summary of them.',
					'Plan — ask for the plan before the code. A wrong plan executed confidently is more expensive than no code.',
					'Act — one bounded change at a time, so a regression is attributable.',
					'Evaluate — run the build, the tests, the type checker. Then look at it yourself.',
				],
			},
			{
				t: 'callout',
				label: 'The rule I actually follow',
				text: 'Never accept a change you have not verified by running something. A green build is evidence; a confident summary is not.',
			},
			{ t: 'h2', text: 'Where agents genuinely win' },
			{
				t: 'p',
				text: 'Boilerplate, type definitions, repetitive refactors, and — underrated — writing the tests you were avoiding. Also the unglamorous half of any project: the config file nobody wants to touch.',
			},
			{ t: 'h2', text: 'Where they still need you' },
			{
				t: 'ul',
				items: [
					'Architecture that will survive its own first rewrite.',
					'Anything involving secrets, billing, or a public URL.',
					'Judgment calls about taste — what a page should feel like.',
					'Deciding what to delete. Agents add; a good codebase needs subtraction.',
				],
			},
			{
				t: 'p',
				text: 'A model will happily rewrite working code to satisfy a request that did not need touching. Knowing when to say "stop, revert that" is the job.',
			},
			{ t: 'h2', text: 'Keep the secrets out of the client, always' },
			{
				t: 'p',
				text: 'This is the failure I hit while building the concierge on this very site. I wanted a chat widget backed by a real model. The naive version puts an API key in client code, which means shipping a working credential to every visitor in the JavaScript bundle — where it is readable by anyone who opens devtools.',
			},
			{
				t: 'p',
				text: 'The fix is architectural, not stylistic: put a server or edge function between the browser and the provider, read the key from the environment at request time, and never let it into the bundle. On a fully static site the edge function is the server boundary that otherwise does not exist.',
			},
			{ t: 'h2', text: 'What I would tell my past self' },
			{
				t: 'ul',
				items: [
					'Set up the loop before writing any feature.',
					'Get verification running first: build, typecheck, one real browser check.',
					'Decide the secret-handling story before you need the API key, not after.',
					'Keep your design system intact. An agent will happily ship a generic component that fights what you already built.',
				],
			},
			{
				t: 'p',
				text: 'Building has gotten genuinely easy. Verification, taste, and shipping have not. Those are still the parts that are yours.',
			},
		],
	},
	// ─────────────────────────────────────────────────────────────
	{
		slug: 'static-sites-and-the-secret-that-wasnt',
		title: 'Static sites, edge functions, and the secret that almost shipped',
		dek: 'A `.gitignore` is not a security model. Here is what actually keeps an API key off a public website, and the mistake that taught me.',
		answer:
			'To keep an API key off a static website, never reference it from client code — put a server or edge function between the browser and the provider, and read the key from the environment at request time. A `.gitignore` entry only protects your git history; it does nothing about a key that gets inlined into the JavaScript bundle and served to every visitor.',
		date: '2026-10-09',
		kind: 'Field note',
		tags: ['Security', 'Cloudflare Pages', 'SvelteKit'],
		body: [
			{
				t: 'p',
				text: 'I wanted a small AI concierge on my portfolio. The model provider issues API keys, so the first question was where the key lives. My repo already had a correct `.gitignore`, and my instinct was that this was solved.',
			},
			{ t: 'h2', text: 'The mistake: trusting `.gitignore` as a security model' },
			{
				t: 'p',
				text: 'A `.gitignore` prevents a file from being committed. It does absolutely nothing about what ends up inside your built JavaScript. On a static build, any environment variable your client code touches gets inlined at build time and shipped to every visitor in the bundle — readable in seconds from devtools.',
			},
			{
				t: 'callout',
				label: 'The rule',
				text: 'Gitignoring a secret protects your repository. It does not protect your users. If a key can be read by the browser, it is public, regardless of git.',
			},
			{ t: 'h2', text: 'The fix: build the boundary the architecture lacks' },
			{
				t: 'p',
				text: 'This site builds with a static adapter. There is no application server, so there is nowhere in the app to hold a secret. That is the real constraint, and it is easy to miss because nothing errors — the site builds fine and the key quietly ships.',
			},
			{
				t: 'p',
				text: 'The solution is an edge function: a small server-side handler deployed next to the static assets. The browser posts to it, it reads the key from the environment, calls the provider, and returns only the text. The key never crosses into client code.',
			},
			{
				t: 'code',
				lang: 'ts',
				text: `// The whole security model in one line:
const apiKey = env.GROQ_API_KEY;   // read at request time, server-side

// The browser only ever sees this:
return json({ content });          // no key, no provider auth`,
			},
			{ t: 'h2', text: 'Defence in depth, because one layer is not enough' },
			{
				t: 'ul',
				items: [
					'.env stays gitignored, and the repo also carries a committed .env.example with empty placeholders so the shape is documented without the value.',
					'Production secrets live in the host dashboard, never in the repository at all.',
					'Verify the build output — grep the compiled bundle for the key prefix. If it appears, the boundary is broken.',
					'Clamp anything a caller can influence (token limits, body size) before it reaches a billable upstream.',
					'Rate-limit per client, and pass the provider’s own rate-limit response through honestly rather than hiding it behind a generic error.',
				],
			},
			{
				t: 'quote',
				text: 'I scanned the built output for the key I had just added, and it was absent. That single check is what turned "I think this is fine" into "this is verified".',
			},
			{ t: 'h2', text: 'The lesson worth keeping' },
			{
				t: 'p',
				text: 'Security that depends on a file staying untracked is a habit, not a guarantee. Security that depends on an architectural boundary holds even when someone is in a hurry. Build the boundary, then verify it by inspecting the artifact you actually shipped.',
			},
		],
	},
	// ─────────────────────────────────────────────────────────────
	{
		slug: 'seo-in-the-age-of-ai-answers',
		title: 'SEO when there is no click: being the source AI answers with',
		dek: 'Answer engines synthesise instead of linking. What that rewards instead of keywords — and what quietly stopped working.',
		answer:
			'Answer engine optimisation (AEO) is the practice of structuring content so AI assistants — ChatGPT, Perplexity, Google AI Overviews — can extract and cite you directly. Unlike traditional SEO, which competes for a ranked position in a list of links, AEO competes to be the sentence quoted inside a synthesised answer. The tactics that matter most are direct answer-first summaries, consistent entity signals like structured data, and genuinely fast pages.',
		date: '2026-10-06',
		kind: 'Explainer',
		tags: ['SEO', 'AEO', 'Performance'],
		body: [
			{
				t: 'p',
				text: 'The click is going away. Referral traffic from Google fell sharply through 2025 as AI Overviews expanded, and the majority of searches now end without anyone visiting a page. If your only goal is a blue link, you are optimising for a shrinking slice of the pie.',
			},
			{ t: 'h2', text: 'Ranking is no longer the whole game' },
			{
				t: 'p',
				text: 'Traditional SEO competes for a ranked position. Answer engine optimisation competes to be quoted — to be the source the model reads and repeats. That is a different goal, and it rewards different structure.',
			},
			{ t: 'h2', text: 'What actually gets quoted' },
			{
				t: 'h2',
				text: 'Answer first, prose second',
			},
			{
				t: 'p',
				text: 'The single highest-leverage change: open every post with two or three sentences that answer its own title outright, before any introduction. A model synthesising an answer needs a self-contained claim it can lift. Burying the answer in paragraph four means it is usually summarised as something vaguer than you wrote.',
			},
			{
				t: 'ul',
				items: [
					'Answer the question the title asks, in the first fifty words.',
					'Use real numbers and dates. Vague claims get dropped; specific ones get repeated.',
					'Question-shaped headings. They match how people actually query.',
					'Keep paragraphs short. Long blocks are expensive to summarise accurately.',
				],
			},
			{ t: 'h2', text: 'Be findable as an entity, not just a page' },
			{
				t: 'p',
				text: 'Structured data is how a machine confirms that the same person is the same person across pages. Schema is not magic — one large study found adding JSON-LD produced no statistically meaningful jump in AI citations. But consistent entity signals, matching author details and identifiers everywhere, reduce the chance you get summarised incorrectly or attributed to someone else.',
			},
			{
				t: 'code',
				lang: 'html',
				text: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "author": { "@type": "Person", "name": "Ojo Gold" },
  "datePublished": "2026-10-11"
}
</script>`,
			},
			{ t: 'h2', text: 'Speed is still the entry fee' },
			{
				t: 'p',
				text: 'Core Web Vitals have not changed: LCP under 2.5s, INP under 200ms, CLS under 0.1, judged at the 75th percentile of real visits. INP is now the most commonly failed metric across the web, and it is the one people feel — it measures how long a page takes to respond after you click something.',
			},
			{
				t: 'p',
				text: 'There is no solid evidence that passing these directly earns you an AI citation. They are a quality floor, not a shortcut. But a static, prerendered page that responds instantly is easier to crawl, cheaper to fetch, and better for the human who does arrive.',
			},
			{ t: 'h2', text: 'The honest summary' },
			{
				t: 'p',
				text: 'The sites that get cited are the ones that say something specific, say it early, are unambiguous about who wrote it, and load instantly. That is not a trick. It is the same discipline that made good pages good, minus the assumption that a visitor is coming.',
			},
		],
	},
];

export function getPost(slug: string): Post | undefined {
	return posts.find((p) => p.slug === slug);
}

/** Rough reading time, in minutes, from the body copy. */
export function readingTime(post: Post): number {
	let words = post.answer.split(/\s+/).length;
	for (const b of post.body) {
		if (b.t === 'ul' || b.t === 'ol') words += b.items.join(' ').split(/\s+/).length;
		else words += (b.text ?? '').split(/\s+/).length;
	}
	return Math.max(1, Math.round(words / 220));
}

export function formatDate(iso: string): string {
	return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	});
}