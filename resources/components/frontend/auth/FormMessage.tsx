import { __ } from '@wordpress/i18n';
import { useActionData } from 'react-router-dom';
import Callout from '../../common/ui/Callout';

export type LoginFormMessage = {
	messageTitle: string;
	message: string;
	messageType: 'info' | 'error';
};

export function formatErrorMessage(
	action: 'messageErrorCode' | 'messageError',
	text: string
): LoginFormMessage {
	switch (action) {
		case 'messageErrorCode':
			return {
				messageTitle: __('Login failed', 'course-resources'),
				message: getErrorCodeMessage(text),
				messageType: 'error',
			};

		case 'messageError':
			return {
				messageTitle: __('Login failed', 'course-resources'),
				message: text,
				messageType: 'error',
			};
	}
}

const getErrorCodeMessage = (errorCode: string) => {
	switch (errorCode) {
		case 'cr_auth_email_timeout':
			return __(
				"An email has already been sent to the specified email address. If you didn't receive the email try again in a minute.",
				'course-resources'
			);
		case 'cr_auth_email_error':
			return __("The login email couldn't be sent.", 'course-resources');
		case 'cr_auth_access_denied':
			return __(
				'The email address is not enrolled in any course.',
				'course-resources'
			);
		case 'cr_invalid_auth_code':
			return __('Invalid login code.', 'course-resources');
		default:
			return __(
				'Internal server error while logging in.',
				'course-resources'
			);
	}
};

export default function FormMessage() {
	const data = useActionData() as { errors?: LoginFormMessage } | undefined;
	const errors = data?.errors;

	return errors ? (
		<Callout title={errors.messageTitle} type={errors.messageType}>
			{errors.message}
		</Callout>
	) : null;
}
