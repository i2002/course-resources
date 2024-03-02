import { createContext, useReducer } from '@wordpress/element';
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
			return 'Un email a fost trimis deja la adresa specificată. Dacă nu ați primit email-ul puteți reîncerca peste un minut.';
		case 'cr_auth_email_error':
			return 'Nu s-a putut trimite email-ul.';
		case 'cr_auth_access_denied':
			return 'Adresa de email nu este înregistrată la niciun curs.';
		case 'invalid_code':
			return 'Link-ul de autentificare a expirat sau a fost folosit deja.';
		default:
			return 'Eroare internă la autentificare.';
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
				messageTitle: 'Autentificare eșuată',
				message: getErrorMessage(action.text),
				messageType: 'error',
			};

		case 'messageError':
			return {
				...state,
				messageTitle: 'Autentificare eșuată',
				message: action.text,
				messageType: 'error',
			};

		case 'messageEmail':
			return {
				...state,
				messageTitle: 'Link de verificare trimis',
				message: `Linkul de autentificare a fost trimis pe adresa ${action.text}.`,
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
