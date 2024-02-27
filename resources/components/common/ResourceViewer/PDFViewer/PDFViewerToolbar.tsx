import {
	MagnifyingGlassMinusIcon as MinusIcon,
	MagnifyingGlassPlusIcon as PlusIcon,
} from '@heroicons/react/20/solid';
import { useContext } from '@wordpress/element';
import { PDFViewerContext } from './PDFViewerContext';

interface Props {
	currentPage: number;
	numPages: number;
	scale: number;
	setScale: React.Dispatch<React.SetStateAction<number>>;
	scrollToPage: (page: number) => any;
}

export default function PDFViewerToolbar() {
	const {
		state: { currentPage, numPages, scale },
		dispatch,
	} = useContext(PDFViewerContext);

	return (
		<>
			<div className="tw-mx-3 tw-py-1 tw-px-2 tw-bg-zinc-600 tw-rounded tw-flex tw-items-center">
				<input
					className="tw-text-sm tw-bg-gray-500 tw-w-10 tw-text-center tw-p-0 tw-arrow-hide"
					type="number"
					value={currentPage}
					onChange={(e) =>
						dispatch({
							type: 'currentPage',
							payload: parseInt(e.target.value),
						})
					}
				/>
				<span className="tw-mx-3">/</span>
				<span>{numPages}</span>
			</div>
			<div className="tw-w-20 tw-py-1 tw-px-1.5 tw-flex tw-justify-between tw-items-center tw-bg-zinc-600 tw-rounded tw-select-none">
				<MinusIcon
					className="tw-cursor-pointer tw-w-4 tw-h-4"
					title="Micșorare imagine"
					onClick={() =>
						dispatch({
							type: 'scaleDecrease',
						})
					}
				/>
				<span
					className="cursor-pointer"
					title="Resetare scalare"
					onClick={() =>
						dispatch({
							type: 'scaleReset',
						})
					}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							dispatch({
								type: 'scaleReset',
							});
						}
					}}
					role="button"
					tabIndex={0}
				>
					{scale.toFixed(1)}
				</span>
				<PlusIcon
					className="tw-cursor-pointer tw-w-4 tw-h-4"
					title="Mărire imagine"
					onClick={() =>
						dispatch({
							type: 'scaleIncrease',
						})
					}
				/>
			</div>
		</>
	);
}
