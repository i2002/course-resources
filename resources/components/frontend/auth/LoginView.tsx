import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import {
	redirect,
	useSearchParams,
	type ActionFunctionArgs,
} from 'react-router-dom';
import CodeForm from './CodeForm';
import EmailForm from './EmailForm';
import FormMessage, { formatErrorMessage } from './FormMessage';

type LoginResponse = {
	success: true;
	code: string;
};

export const loginAction = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const intent = formData.get('intent');

	let path = '';
	const data = {
		email: '',
		code: '',
		resend: false,
	};

	data.email = (formData.get('email') as string | null) ?? '';

	if (intent === 'login_request') {
		path = '/course-resources/v1/login-request';
		data.resend = (formData.get('resend') as string | null) ? true : false;
	} else if (intent === 'verify_code') {
		path = '/course-resources/v1/login';
		data.code = (formData.get('code') as string | null) ?? '';
	}

	try {
		const res = await apiFetch<LoginResponse>({
			path,
			method: 'POST',
			data,
		});

		if (res.code === 'email_sent') {
			return redirect(`?email=${data.email}`);
		} else if (
			res.code === 'already_signedin' ||
			res.code === 'login_success'
		) {
			return redirect('/');
		}
	} catch (error: any) {
		return {
			errors: formatErrorMessage('messageErrorCode', error.code),
		};
	}

	return null;
};

export default function LoginView() {
	const [params] = useSearchParams();

	return (
		<div className="tw-max-w-lg tw-mx-auto tw-h-full tw-w-full tw-flex tw-flex-col tw-mt-10">
			<h1 className="tw-text-center tw-text-2xl tw-font-medium tw-my-10">
				{__('Student login', 'course-resources')}
			</h1>

			<FormMessage />
			{(!params.get('email') && <EmailForm />) || <CodeForm />}
		</div>
	);
}
