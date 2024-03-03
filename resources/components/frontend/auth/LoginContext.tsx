import { createContext, useReducer } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { Dispatch } from 'react';

type LoginContextState = {
	messageTitle: string;
	message: string;
	messageType: 'info' | 'error';
	callbackUrl: string;
};

type LoginContextAction =
	| {
			text: string;
			type: 'messageErrorCode' | 'messageError' | 'messageEmail';
	  }
	| {
			type: 'messageReset';
	  };

type LoginContextInitArgs = {
	callbackUrl: string;
	error: string;
};

type LoginContextType = {
	state: LoginContextState;
	dispatch: Dispatch<LoginContextAction>;
};

const initialState: LoginContextState = {
	messageTitle: '',
	message: '',
	messageType: 'info',
	callbackUrl: '',
};

const getErrorMessage = (errorCode: string) => {
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
		case 'invalid_code':
			return __(
				'Login link expired or already used.',
				'course-resources'
			);
		default:
			return __(
				'Internal server error while logging in.',
				'course-resources'
			);
	}
};

function reducer(
	state: LoginContextState,
	action: LoginContextAction
): LoginContextState {
	switch (action.type) {
		case 'messageErrorCode':
			return {
				...state,
				messageTitle: __('Login failed', 'course-resources'),
				message: getErrorMessage(action.text),
				messageType: 'error',
			};

		case 'messageError':
			return {
				...state,
				messageTitle: __('Login failed', 'course-resources'),
				message: action.text,
				messageType: 'error',
			};

		case 'messageEmail':
			return {
				...state,
				messageTitle: __('Login link sent', 'course-resources'),
				message: sprintf(
					/* translators: %s user email address */
					__(
						'Login link sent to email address: %s',
						'course-resources'
					),
					action.text
				),
				messageType: 'info',
			};

		case 'messageReset':
			return {
				...state,
				messageTitle: '',
				message: '',
				messageType: 'info',
			};
	}
}

function init({ callbackUrl, error }: LoginContextInitArgs): LoginContextState {
	let state = {
		...initialState,
		callbackUrl: callbackUrl ? callbackUrl : window.location.pathname,
	};

	if (error && error !== '') {
		state = reducer(state, { type: 'messageErrorCode', text: error });
	}

	return state;
}

export const LoginContext = createContext<LoginContextType>({
	state: initialState,
	dispatch: (val: LoginContextAction) => {},
});

export const LoginContextProvider = ({
	children,
	initArgs,
}: {
	children: React.ReactNode;
	initArgs: LoginContextInitArgs;
}) => {
	const [state, dispatch] = useReducer(reducer, initArgs, init);

	return (
		<LoginContext.Provider value={{ state, dispatch }}>
			{children}
		</LoginContext.Provider>
	);
};
