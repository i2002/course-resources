import { createRoot } from '@wordpress/element';
import FrontendApp, { createRouter } from '../components/frontend/FrontendApp';
import type { FrontendInitialData } from '../lib/hydration-types';

const root = document.getElementById('cr-frontend-app');
if (root) {
	const data = root.dataset.initial;
	const initialData = data
		? (JSON.parse(data) as FrontendInitialData)
		: undefined;

	if (initialData && window.location.hash.startsWith('#/login')) {
		// already authenticated
		if (!initialData.errors) {
			window.location.hash = '#/';
		} else {
			initialData.errors = undefined;
		}
	}

	const router = createRouter(initialData);
	createRoot(root).render(<FrontendApp router={router} />);
}
