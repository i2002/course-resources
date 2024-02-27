import apiFetch from '@wordpress/api-fetch';
import { Outlet, redirect } from 'react-router-dom';
import type { User } from '../../../lib/auth-types';

export type AuthLoader = {
	user: User;
};

export const authLoader = async (): Promise<AuthLoader | Response> => {
	try {
		const user = await apiFetch<User>({
			path: '/course-resources/v1/user-info',
		});

		return {
			user,
		};
	} catch (err: any) {
		return redirect('/login');
	}
};

export default function RootLayout() {
	return (
		<div className="tw-p-3 tw-rounded tw-min-h-[80vh]">
			<Outlet />
		</div>
	);
}
