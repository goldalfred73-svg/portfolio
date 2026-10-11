/**
 * Cloudflare Pages Function — POST /api/chat
 *
 * Proxies chat completions to Groq so the API key stays server-side.
 *
 * Why this exists: this site builds with `adapter-static`, so there is no
 * SvelteKit server and nowhere in the app to hold a secret. A key referenced
 * by client code ends up in the built JS and is readable by every visitor.
 * This edge function is the server boundary that keeps `GROQ_API_KEY` off the
 * client. It coexists with the static output — no change to adapter-static.
 *
 * ── Running it locally ───────────────────────────────────────────────────────
 * `pnpm dev` (vite) serves only `src/routes`, so `/api/chat` 404s locally.
 * Pages Functions need the Pages dev server, not vite:
 *
 *   npx wrangler pages dev . --port 8788
 *
 * wrangler builds and serves this function itself, so the panel is fully live
 * at http://localhost:8788 without deploying. `pnpm dev` alone will show the
 * concierge rendering correctly but every answer will be the offline message —
 * that's expected, not a bug.
 *
 * The key is read from the environment at request time:
 *   - local:  .env (gitignored) — wrangler pages dev loads it
 *   - production: Cloudflare Pages -> Settings -> Environment variables
 *
 * Rate limiting runs in two layers. The in-memory limiter below needs no config
 * and protects every isolate it lands on. If you bind a native Cloudflare Rate
 * Limiting binding as `CHAT_LIMITER` (Pages -> Settings -> Functions -> Bindings),
 * that stricter, globally-consistent check runs first. See RATE LIMITING below for
 * why both exist and what the in-memory layer cannot do on its own.
 */

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

/**
 * Minimal structural stand-in for Cloudflare's `PagesFunction`.
 *
 * This repo's tsconfig only typechecks `src/**`, and `@cloudflare/workers-types`
 * isn't a dependency, so importing the real type would leave this file full of
 * unresolved-identifier errors in editors. The shape Pages actually passes is
 * small and stable, so declaring it locally keeps this file self-contained.
 * If you later add `@cloudflare/workers-types`, delete this and import theirs.
 */
interface EventContext<C = unknown> {
	request: Request;
	env: C;
}
type PagesFunction<C = Record<string, string | undefined>> = (context: EventContext<C>) => Promise<Response> | Response;

/**
 * Structural stand-in for Cloudflare's native Rate Limiting binding.
 *
 * The real binding (Workers Rate Limiting API) exposes `.limit({ key })`, which
 * resolves `{ success: boolean }`. Declared structurally so this file still
 * typechecks without `@cloudflare/workers-types`; if you add that package, this
 * can be deleted in favour of the imported type.
 */
interface RateLimiterBinding {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Bindings {
	GROQ_API_KEY?: string;
	GROQ_MODEL?: string;
	/** Optional: a Cloudflare Rate Limiting binding named `CHAT_LIMITER`. */
	CHAT_LIMITER?: RateLimiterBinding;
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Verified against this key's available models. `llama-3.3-70b-versatile` is NOT
// on the account and returns 404 — confirm with:
//   curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
//
// Reasoning models (`openai/gpt-oss-*`) emit a `reasoning` field and spend tokens
// on it, so they need a generous max_tokens or `content` comes back empty.
// `qwen/qwen3.8-27b` is non-reasoning and cheapest for a portfolio widget.
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';

// Keep the edge function from lingering on slow or abusive clients.
const TIMEOUT_MS = 30_000;
// Ceiling on what we forward, so this endpoint can't be used to relay arbitrary payloads.
const MAX_BODY_BYTES = 16_000;
// Generous default so reasoning models don't return empty content on a token cutoff.
const DEFAULT_MAX_TOKENS = 1024;
const MAX_MAX_TOKENS = 8192;

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
//
// Two layers, because neither alone is sufficient:
//
// 1. In-memory fixed-window counter (this layer). Needs no dashboard config and
//    works the moment the function deploys. Each isolate keeps its own Map, so it
//    bounds a single hot process — which is what actually stops a runaway script
//    hammering one endpoint. It is per-isolate and resets on deploy, so it is NOT
//    a hard global cap and must not be relied on as one.
//
// 2. Optional native Cloudflare Rate Limiting binding (`CHAT_LIMITER`). Globally
//    consistent and cheap. Configure it in the dashboard to bind a limit of
//    e.g. 20 requests / minute per key; then this layer only handles the case
//    where nobody bound one.
//
// Defaults are deliberately generous: a visitor having a real conversation is the
// expected case, and a portfolio widget should never lock someone out mid-sentence.
const RATE_LIMIT_MAX = 12; // requests allowed per window, per client
const RATE_LIMIT_WINDOW_MS = 60_000; // window length
// Bound the Map so a spoofed-IP flood can't grow isolate memory without limit.
const RATE_LIMIT_MAX_TRACKED_CLIENTS = 10_000;

interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

/** Drop expired buckets occasionally so the Map tracks live clients, not all-time ones. */
function sweep(now: number): void {
	if (now - lastSweep < RATE_LIMIT_WINDOW_MS) return;
	lastSweep = now;
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
	if (buckets.size > RATE_LIMIT_MAX_TRACKED_CLIENTS) {
		buckets.clear();
	}
}

/**
 * Identify the caller.
 *
 * `CF-Connecting-IP` is set by Cloudflare and cannot be forged by the client.
 * Wrangler's dev server sets it too, so local runs exercise the same code path.
 * If it's somehow absent, fall back to a constant — which makes every request
 * share one bucket. That's fine: the point is to not silently disable the
 * limiter when the header is missing.
 */
function clientKey(request: Request): string {
	return (
		request.headers.get('CF-Connecting-IP') ??
		request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
		'local'
	);
}

/**
 * Fixed-window check.
 *
 * NOTE the return shape: a budget object is returned on BOTH paths. Success is
 * signalled by `remaining > 0`; a block is `remaining === 0` plus `retryAfter > 0`.
 * There is deliberately no `null` case — a caller that forgets to test `remaining`
 * would otherwise read a 429 as success. Keep that invariant.
 */
function checkRateLimit(key: string, now: number): { remaining: number; retryAfter: number; blocked: boolean } {
	sweep(now);
	const existing = buckets.get(key);

	if (!existing || existing.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return { remaining: RATE_LIMIT_MAX - 1, retryAfter: 0, blocked: false };
	}

	if (existing.count >= RATE_LIMIT_MAX) {
		return { remaining: 0, retryAfter: Math.ceil((existing.resetAt - now) / 1000), blocked: true };
	}

	existing.count += 1;
	return { remaining: RATE_LIMIT_MAX - existing.count, retryAfter: 0, blocked: false };
}

/** Headers describing the caller's current budget, on every response. */
function rateHeaders(remaining: number, retryAfter: number): Record<string, string> {
	const headers: Record<string, string> = {
		'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
		'X-RateLimit-Remaining': String(remaining),
	};
	if (retryAfter > 0) headers['Retry-After'] = String(retryAfter);
	return headers;
}

export const onRequestPost: PagesFunction<Bindings> = async ({ request, env }) => {
	// Layer 2 first: if a native binding is configured, it is authoritative.
	const key = clientKey(request);
	if (env.CHAT_LIMITER) {
		try {
			const { success } = await env.CHAT_LIMITER.limit({ key });
			if (!success) {
				return json(
					{ error: 'Too many questions. Give it a moment, then try again.' },
					429,
					{ 'Retry-After': '60' }
				);
			}
		} catch (err) {
			// Never fail closed on a limiter error — that would take the widget down
			// for everyone. The in-memory layer below still applies.
			console.error('CHAT_LIMITER binding failed:', err);
		}
	}

	// Layer 1: always enforced, needs no configuration.
	const now = Date.now();
	const budget = checkRateLimit(key, now);
	if (budget.blocked) {
		return json(
			{ error: 'Too many questions. Give it a moment, then try again.' },
			429,
			{ 'Retry-After': String(budget.retryAfter), 'X-RateLimit-Limit': String(RATE_LIMIT_MAX), 'X-RateLimit-Remaining': '0' }
		);
	}
	const limitHeaders = rateHeaders(budget.remaining, budget.retryAfter);

	const apiKey = env.GROQ_API_KEY;
	if (!apiKey) {
		return json({ error: 'GROQ_API_KEY is not configured on this deployment.' }, 500, limitHeaders);
	}

	let payload: { messages?: ChatMessage[]; model?: string; max_tokens?: number };
	try {
		const raw = await request.text();
		if (raw.length > MAX_BODY_BYTES) {
			return json({ error: 'Request body too large.' }, 413, limitHeaders);
		}
		payload = JSON.parse(raw);
	} catch {
		return json({ error: 'Expected a JSON body.' }, 400, limitHeaders);
	}

	if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
		return json({ error: 'Expected a non-empty `messages` array.' }, 400, limitHeaders);
	}

	const messages = payload.messages.filter(
		(m): m is ChatMessage =>
			!!m &&
			(m.role === 'system' || m.role === 'user' || m.role === 'assistant') &&
			typeof m.content === 'string'
	);
	if (messages.length === 0) {
		return json({ error: 'No valid messages found.' }, 400, limitHeaders);
	}

	// Clamp rather than trust the caller — this is a billable, rate-limited upstream.
	const requestedTokens =
		typeof payload.max_tokens === 'number' && Number.isFinite(payload.max_tokens)
			? Math.floor(payload.max_tokens)
			: DEFAULT_MAX_TOKENS;
	const maxTokens = Math.min(Math.max(requestedTokens, 1), MAX_MAX_TOKENS);

	// Honour a client-side abort so a cancelled request doesn't hold the worker open.
	const abort = new AbortController();
	const onAbort = () => abort.abort();
	request.signal?.addEventListener('abort', onAbort, { once: true });
	const timeout = setTimeout(() => abort.abort(), TIMEOUT_MS);

	try {
		const upstream = await fetch(GROQ_ENDPOINT, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: payload.model || env.GROQ_MODEL || DEFAULT_MODEL,
				messages,
				max_tokens: maxTokens,
				stream: false,
			}),
			signal: abort.signal,
		});

		if (!upstream.ok) {
			// Log the status for debugging, but return a generic message — upstream
			// error bodies can echo request details, and this response reaches the browser.
			const detail = (await upstream.text()).slice(0, 500);
			console.error(`Groq upstream ${upstream.status}: ${detail}`);
			// Pass Groq's own 429 through so the client can show a rate-limit message
			// rather than a generic failure when the quota (not our limiter) is the cause.
			if (upstream.status === 429) {
				return json({ error: 'The studio line is busy right now. Try again shortly.' }, 429, limitHeaders);
			}
			return json({ error: 'Upstream model request failed.' }, 502, limitHeaders);
		}

		const data = await upstream.json();
		const message = data?.choices?.[0]?.message;
		const finishReason = data?.choices?.[0]?.finish_reason ?? null;

		// A reasoning model that exhausts max_tokens returns `finish_reason: "length"`
		// with empty `content` — its budget went to the `reasoning` field. Surface that
		// distinctly so the client can retry with a higher budget instead of rendering
		// a blank bubble.
		const content = message?.content ?? '';
		if (!content && finishReason === 'length') {
			return json(
				{
					error: 'The model used its whole token budget reasoning and returned no text. Retry with a higher max_tokens.',
					finishReason,
				},
				502,
				limitHeaders
			);
		}

		return json({ content, model: data?.model ?? null, finishReason }, 200, limitHeaders);
	} catch (err) {
		if (abort.signal.aborted) return json({ error: 'Request cancelled or timed out.' }, 504, limitHeaders);
		console.error('Groq proxy failure:', err);
		return json({ error: 'Could not reach the model provider.' }, 502, limitHeaders);
	} finally {
		clearTimeout(timeout);
		request.signal?.removeEventListener('abort', onAbort);
	}
};

// Reject the other verbs explicitly rather than falling through to a 404 HTML page.
const methodNotAllowed = (): Response => json({ error: 'Method not allowed. Use POST.' }, 405);

export const onRequestGet: PagesFunction<Bindings> = methodNotAllowed;
export const onRequestPut: PagesFunction<Bindings> = methodNotAllowed;
export const onRequestPatch: PagesFunction<Bindings> = methodNotAllowed;
export const onRequestDelete: PagesFunction<Bindings> = methodNotAllowed;

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			// Deliberately no Access-Control-Allow-Origin. This endpoint is same-origin;
			// omitting the header means the browser blocks any cross-origin caller, which
			// is what we want. Setting it to `*` would make this an open relay.
			'Cache-Control': 'no-store',
			...extraHeaders,
		},
	});
}