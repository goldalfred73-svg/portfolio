// ─────────────────────────────────────────────────────────────
// Ojo Gold's site copy lives here — edit words, everything updates.
// ─────────────────────────────────────────────────────────────

export const profile = {
	name: 'Ojo Gold',
	monogram: 'OG',
	role: 'Software Engineering Student',
	location: 'Edo State, Nigeria',
	lede: 'I am 18, studying software engineering with one foot in mechanical engineering — learning to build from atoms to interfaces, and documenting every step in public.',
	email: 'goldalfred73@gmail.com',
	socials: [
		{ label: 'GitHub', href: 'https://github.com/goldalfred73-svg' },
		{ label: 'Email', href: 'mailto:goldalfred73@gmail.com' }
	]
};

export interface Project {
	index: string;
	title: string;
	kind: string;
	year: string;
	summary: string;
	tags: string[];
	href: string;
}

export const projects: Project[] = [
	{
		index: '01',
		title: 'This Portfolio',
		kind: 'Flagship build',
		year: '2026',
		summary:
			'My own corner of the internet — designed like a studio piece and engineered in SvelteKit, with motion that answers the cursor and sound synthesised live in the browser.',
		tags: ['SvelteKit', 'TypeScript', 'Motion & sound'],
		href: '#contact'
	},
	{
		index: '02',
		title: 'Code Practice Ground',
		kind: 'Learning in public',
		year: 'Ongoing',
		summary:
			'Small programs, exercises, and experiments as I work through software engineering — each one a rep toward thinking like an engineer.',
		tags: ['Problem solving', 'Fundamentals'],
		href: '#contact'
	},
	{
		index: '03',
		title: 'Mechanical × Digital',
		kind: 'Crossover sketches',
		year: 'Ongoing',
		summary:
			'Where my mechanical engineering studies meet code — precise thinking from the workshop applied to interfaces, layouts, and moving parts on screen.',
		tags: ['Mechanical', 'Design systems'],
		href: '#contact'
	}
];

export interface Service {
	index: string;
	title: string;
	detail: string;
}

export const services: Service[] = [
	{
		index: 'i',
		title: 'Web interfaces',
		detail: 'Clean, responsive pages built with modern tools — this site is my first exhibit, and the standard I hold myself to.'
	},
	{
		index: 'ii',
		title: 'Software fundamentals',
		detail: 'Data structures, problem solving, and careful code — the unglamorous reps that compound into real engineering ability.'
	},
	{
		index: 'iii',
		title: 'Mechanical intuition',
		detail: 'How things fit, move, and bear weight. A machine mindset that makes my digital work sturdier than it looks.'
	}
];

export const about = [
	'My name is Ojo Gold. I am 18, based in Edo State, Nigeria, studying software engineering while also taking part in mechanical engineering.',
	'One field teaches me how software thinks; the other teaches me how the physical world moves. I am building this site — and my skills — in the open, one precise piece at a time.'
];

export const colophon =
	'Set in Cormorant Garamond & Inter. Motion follows a single upward current; sound is synthesised live in your browser — no audio files.';
