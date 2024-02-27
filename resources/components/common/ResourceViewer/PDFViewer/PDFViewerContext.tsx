import { createContext, useReducer } from '@wordpress/element';
import type { Dispatch } from 'react';

type PDFViewerState = {
	currentPage: number;
	numPages: number;
	scale: number;
};

type PDFViewerAction =
	| {
			type: 'currentPage' | 'numPages';
			payload: number;
	  }
	| {
			type: 'scaleIncrease' | 'scaleDecrease' | 'scaleReset';
	  };

type PDFViewerContextType = {
	state: PDFViewerState;
	dispatch: Dispatch<PDFViewerAction>;
};

const initialState: PDFViewerState = {
	currentPage: 0,
	numPages: 0,
	scale: 1,
};

function reducer(state: PDFViewerState, action: PDFViewerAction) {
	switch (action.type) {
		case 'currentPage':
			return {
				...state,
				currentPage:
					action.payload > 0 && action.payload <= state.numPages
						? action.payload
						: state.currentPage,
			};
		case 'numPages':
			return {
				...state,
				numPages: action.payload > 0 ? action.payload : state.numPages,
			};
		case 'scaleIncrease':
			return {
				...state,
				scale: state.scale + 0.1,
			};

		case 'scaleDecrease':
			return {
				...state,
				scale: state.scale > 0.1 ? state.scale - 0.1 : state.scale,
			};
		case 'scaleReset':
			return {
				...state,
				scale: 1,
			};
	}
}

export const PDFViewerContext = createContext<PDFViewerContextType>({
	state: initialState,
	dispatch: (val: PDFViewerAction) => {},
});

export const PDFViewerProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [state, dispatch] = useReducer(reducer, initialState);

	return (
		<PDFViewerContext.Provider value={{ state, dispatch }}>
			{children}
		</PDFViewerContext.Provider>
	);
};
