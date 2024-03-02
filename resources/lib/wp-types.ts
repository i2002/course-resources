declare namespace wp {
	interface Media {
		date: string | null;
		date_gmt: string | null;
		id: number;
		link: string;
		modified: string;
		modified_gmt: string;
		slug: string;
		status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
		type: string;
		permalink_template: string;
		generated_slug: string;
		title: {
			raw: string;
			rendered: string;
		};
		author: number;
		comment_status: 'open' | 'closed';
		ping_status: 'open' | 'closed';
		meta: {
			cr_file_size: number;
			cr_file_mime_type: string;
		};
		template: string;
		alt_text: string;
		caption: {
			rendered: string;
		};
		description: {
			rendered: string;
		};
		media_type: 'image' | 'file';
		mime_type: string;
		media_details: {
			filesize: number;
		};
		post: number;
		source_url: string;
		missing_image_sizes: [];
		'cr-folder': number[];
	}

	interface Post {
		date: string | null;
		date_gmt: string | null;
		id: number;
		link: string;
		modified: string;
		modified_gmt: string;
		slug: string;
		status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
		type: string;
		permalink_template: string;
		generated_slug: string;
		title: {
			raw: string;
			rendered: string;
		};
		content: {
			rendered: string;
		};
		author: number;
		excerpt: {
			rendered: string;
		};
		featured_media: number;
		comment_status: 'open' | 'closed';
		ping_status: 'open' | 'closed';
		format:
			| 'standard'
			| 'aside'
			| 'chat'
			| 'gallery'
			| 'link'
			| 'image'
			| 'quote'
			| 'status'
			| 'video'
			| 'audio';
		meta: {};
		sticky: boolean;
		template: string;
		categories: number[];
		tags: number[];
	}

	interface Course extends Post {
		meta: {
			cr_course_students: string[];
		};
	}

	interface Taxonomy {
		capabilities: {};
		description: string;
		hierarchical: boolean;
		labels: {};
		name: string;
		slug: string;
		show_cloud: boolean;
		types: string[];
		rest_base: string;
		rest_namespace: string;
		visibility: {};
	}

	interface Type {
		capabilities: {};
		description: string;
		hierarchical: boolean;
		viewable: boolean;
		labels: {};
		name: string;
		slug: string;
		supports: {};
		has_archive: string | boolean;
		taxonomies: string[];
		rest_base: string;
		rest_namespace: string;
		visibility: {};
		icon: string | null;
	}

	interface FolderTax {
		id: number;
		count: number;
		description: string;
		link: string;
		name: string;
		slug: string;
		taxonomy: string;
		parent: number;
		path: Array<{ name: string; id: number }>;
		meta: {
			cr_folder_course: number;
			cr_folder_updated_at: number;
		};
	}
}

export default wp;
