import apiFetch from '@wordpress/api-fetch';
import { useContext, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from './LoginContext';

type LoginResponse = {
	success: true;
	code: string;
};

export default function EmailForm() {
	const [loading, setLoading] = useState(false);
	const {
		state: { callbackUrl },
		dispatch,
	} = useContext(LoginContext);
	const navigate = useNavigate();
	const emailRef = useRef<HTMLInputElement>(null);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const email = emailRef.current?.value ?? '';

		try {
			setLoading(true);
			dispatch({ type: 'messageReset' });

			const res = await apiFetch<LoginResponse>({
				path: '/course-resources/v1/login',
				method: 'POST',
				data: {
					email,
					callbackUrl,
				},
			});

			if (res.code === 'email_sent') {
				dispatch({ type: 'messageEmail', text: email });
			} else if (res.code === 'already_signedin') {
				navigate('/');
			}
		} catch (error: any) {
			dispatch({ type: 'messageErrorCode', text: error.code });
		}

		setLoading(false);
	};

	return (
		<form onSubmit={onSubmit} className="tw-w-full">
			<div className="tw-mb-6">
				<input
					required
					type="email"
					name="email"
					placeholder={__('Email address', 'course-resources')}
					className="tw-form-input"
					ref={emailRef}
					disabled={loading}
				/>
			</div>
			<button
				className="tw-button-primary tw-w-full tw-py-2"
				disabled={loading}
				type="submit"
			>
				{__('Login with email address', 'course-resources')}
			</button>
		</form>
	);
}
