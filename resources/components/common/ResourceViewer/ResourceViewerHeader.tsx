import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { ForwardRefRenderFunction } from 'react';

interface Props {
	name: string;
	url: string;
	toolbar?: React.ReactNode;
	children?: React.ReactNode;
	onClose: () => void;
}

const ResourceViewerHeader: ForwardRefRenderFunction<HTMLDivElement, Props> =
	function ({ name, url, toolbar, children, onClose }, ref) {
		return (
			<div className="tw-fixed tw-inset-0 tw-flex tw-flex-col tw-z-[100000] tw-text-base">
				<header className="tw-bg-zinc-700 tw-p-4 tw-text-white tw-grid tw-grid-cols-3 tw-items-center tw-h-16 tw-flex-shrink-0">
					<span title={name}>{name}</span>
					<div className="tw-justify-self-center tw-flex tw-items-center">
						{toolbar}
					</div>
					<div className="tw-justify-self-end tw-flex">
						<a
							href={url}
							title={__('Download file', 'course-resources')}
							download
						>
							<ArrowDownTrayIcon className="tw-w-5 tw-h-5 tw-mx-3 tw-justify-self-end tw-cursor-pointer hover:tw-text-gray-300" />
						</a>
						<XMarkIcon
							className="tw-w-5 tw-h-5 tw-justify-self-end tw-cursor-pointer hover:tw-text-gray-300"
							title={__('Close', 'course-resources')}
							onClick={() => onClose()}
						/>
					</div>
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
