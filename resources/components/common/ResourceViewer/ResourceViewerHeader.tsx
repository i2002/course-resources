import { XMarkIcon } from '@heroicons/react/20/solid';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { ForwardRefRenderFunction } from 'react';

interface Props {
	name: string;
	toolbar?: React.ReactNode;
	children?: React.ReactNode;
	onClose: () => void;
}

const ResourceViewerHeader: ForwardRefRenderFunction<HTMLDivElement, Props> =
	function ({ name, toolbar, children, onClose }, ref) {
		return (
			<div className="tw-fixed tw-inset-0 tw-flex tw-flex-col tw-z-[100000] tw-text-base">
				<header className="tw-bg-zinc-700 tw-p-4 tw-text-white tw-grid tw-grid-cols-3 tw-items-center tw-h-16 tw-flex-shrink-0">
					<span title={name}>{name}</span>
					<div className="tw-justify-self-center tw-flex tw-items-center">
						{toolbar}
					</div>
					<XMarkIcon
						className="tw-w-5 tw-h-5 tw-justify-self-end tw-cursor-pointer hover:tw-text-gray-300"
						title={__('Close', 'course-resources')}
						onClick={() => onClose()}
					/>
				</header>
				<div
					className="tw-flex tw-flex-col tw-items-center tw-h-full tw-bg-zinc-500 tw-relative tw-overflow-auto"
					ref={ref}
				>
					{children}
				</div>
			</div>
		);
	};

export default forwardRef<HTMLDivElement, Props>(ResourceViewerHeader);
