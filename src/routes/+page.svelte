<script lang="ts">
	import { profile, projects, services, about, colophon } from '$lib/content';
	import { reveal, magnetic } from '$lib/motion';
</script>

<!-- ══ HERO ══ -->
<section class="hero wrap" use:reveal>
	<p class="role" data-cascade>{profile.role}</p>
	<h1 data-cascade>From atoms <em>to interfaces.</em></h1>
	<p class="lede" data-cascade>{profile.lede}</p>
	<div class="cta-row" data-cascade>
		<a class="btn solid" href="#work" use:magnetic>
			View selected work <span class="arrow" aria-hidden="true">↗</span>
		</a>
		<a class="btn ghost" href="#contact" use:magnetic data-chime>
			Say hello <span class="arrow" aria-hidden="true">→</span>
		</a>
	</div>
	<div class="hero-meta" data-cascade>
		<span><strong>Currently</strong> — studying & building in public</span>
		<span><strong>Based</strong> — {profile.location}</span>
		<span><strong>Elsewhere</strong> — move your cursor; the site answers</span>
	</div>
</section>

<!-- ══ WORK ══ -->
<section id="work" class="wrap" use:reveal>
	<p class="kicker" data-cascade><span class="n">01</span> Selected work</p>
	<h2 data-cascade>A short list, <em>on purpose.</em></h2>
	<div style="height: 2.5rem"></div>
	<div class="work-list">
		{#each projects as p}
			<a class="work-card" href={p.href} data-cascade>
				<span class="idx">{p.index}</span>
				<span>
					<span class="kind">{p.kind} · {p.year}</span>
					<h3>{p.title}</h3>
					<p>{p.summary}</p>
					<span class="tag-row">
						{#each p.tags as t}<span>{t}</span>{/each}
					</span>
				</span>
				<span class="go" aria-hidden="true">↗</span>
			</a>
		{/each}
	</div>
</section>

<!-- ══ PRACTICE — the dark chapter ══ -->
<section id="practice" class="wrap" use:reveal>
	<div class="chapter-dark wrap" style="padding: clamp(2rem, 5vw, 4rem);">
		<p class="kicker" data-cascade><span class="n">02</span> Practice</p>
		<h2 data-cascade>Three crafts, <em>one hand.</em></h2>
		<div style="height: 1.5rem"></div>
		{#each services as s}
			<div class="svc" data-cascade>
				<span class="rn">{s.index}</span>
				<div>
					<h3>{s.title}</h3>
					<p>{s.detail}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ══ ABOUT ══ -->
<section id="about" class="wrap" use:reveal>
	<p class="kicker" data-cascade><span class="n">03</span> About</p>
	<div class="about-grid">
		<div class="seal" data-cascade aria-hidden="true">
			<span class="big">{profile.monogram}</span>
			<span class="band">Est. of good taste</span>
		</div>
		<div class="about-copy">
			{#each about as para}
				<p data-cascade>{para}</p>
			{/each}
		</div>
	</div>
</section>

<!-- ══ CONTACT ══ -->
<section id="contact" class="wrap contact" use:reveal>
	<p class="kicker" data-cascade style="justify-content: center;"><span class="n">04</span> Contact</p>
	<h2 data-cascade>Let's build something <em>worth remembering.</em></h2>
	<div data-cascade>
		<a class="mail" href={`mailto:${profile.email}`} data-chime use:magnetic>{profile.email}</a>
	</div>
	<div class="socials" data-cascade>
		{#each profile.socials as s}
			<a href={s.href} rel="me noopener">{s.label} ↗</a>
		{/each}
	</div>
</section>

<footer class="site">
	<div class="wrap">
		<span>© {new Date().getFullYear()} {profile.name} — all rights reserved.</span>
		<span>{colophon}</span>
	</div>
</footer>
