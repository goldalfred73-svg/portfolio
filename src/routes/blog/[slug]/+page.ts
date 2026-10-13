import { error } from '@sveltejs/kit';
import { posts, getPost } from '$lib/posts';
import type { PageLoad } from './$types';

// Every post is prerendered at build time — required because the site uses
// adapter-static. Adding a post to src/lib/posts.ts is all that's required.
export const prerender = true;

export const entries = () => posts.map((p) => ({ slug: p.slug }));

export const load: PageLoad = ({ params }) => {
	const post = getPost(params.slug);
	if (!post) error(404, 'Post not found');
	return { post };
};