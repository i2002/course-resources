import apiFetch from '@wordpress/api-fetch';
import { Outlet, redirect, useNavigation } from 'react-router-dom';
import type { User } from '../../../lib/auth-types';
import FileLoading from '../course/file/FileLoading';
import FolderLoading from '../course/folder/FolderLoading';
import HomeLoading from '../home/HomeLoading';

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
	const navigation = useNavigation();

	let loader = null;
	if (navigation.state === 'loading') {
		if (navigation.location.pathname === '/') {
			loader = <HomeLoading />;
		} else if (navigation.location.pathname.includes('/file')) {
			loader = <FileLoading />;
		} else {
			loader = <FolderLoading />;
		}
	}

	return (
		<div className="tw-p-3 tw-rounded tw-min-h-[80vh]">
			{!loader && <Outlet />}
			{loader}
		</div>
	);
}
