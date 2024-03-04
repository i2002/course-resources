import { __ } from '@wordpress/i18n';
import { Form, useNavigation } from 'react-router-dom';

export default function EmailForm() {
	const { state } = useNavigation();

	return (
		<Form method="post" className="tw-w-full">
			<div className="tw-mb-6">
				<input
					required
					type="email"
					name="email"
					placeholder={__('Email address', 'course-resources')}
					className="tw-form-input"
					disabled={state !== 'idle'}
				/>
			</div>
			<button
				className="tw-button-primary tw-w-full tw-py-2"
				disabled={state !== 'idle'}
				type="submit"
				name="intent"
				value="login_request"
			>
				{__('Login with email address', 'course-resources')}
			</button>
		</Form>
	);
}
