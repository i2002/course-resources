import apiFetch from '@wordpress/api-fetch';
import { redirect, useSearchParams } from 'react-router-dom';
import type { User } from '../../../lib/auth-types';
import EmailForm from './EmailForm';
import FormMessage from './FormMessage';
import { LoginContextProvider } from './LoginContext';

export const loginLoader = async (): Promise<Response | null> => {
	try {
		await apiFetch<User>({
			path: '/course-resources/v1/user-info',
		});

		return redirect('/');
	} catch (err: any) {
		return null;
	}
};

export default function LoginView() {
	const [params] = useSearchParams();

	return (
		<LoginContextProvider
			initArgs={{
				callbackUrl: window.location.pathname + window.location.search,
				error: params.get('error') ?? '',
			}}
		>
			<div className="tw-max-w-lg tw-mx-auto tw-h-full tw-w-full tw-flex tw-flex-col tw-mt-10">
				<h1 className="tw-text-center tw-text-2xl tw-font-medium tw-my-10">
					Autentificare student
				</h1>

				<FormMessage />
				<EmailForm />
			</div>
		</LoginContextProvider>
	);
}
