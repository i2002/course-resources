import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useRouteLoaderData } from 'react-router-dom';
import Header from '../../header/Header';
import { CourseLoader } from '../CourseView';

const nrRows = 3;
const nrSegments = 3;

export default function FolderLoading() {
	const data = useRouteLoaderData('course') as CourseLoader | undefined;

	return (
		<>
			<Header title={data?.course.name} back={true} />
			<div className='className="tw-relative tw-w-full tw-text-left tw-ring-1 tw-rounded-lg tw-p-6 tw-bg-white tw-ring-slate-200 tw-shadow tw-border-blue-500'>
				<div className="tw-flex tw-p-3 tw-mb-3 tw-box-content tw-h-5 tw-overflow-hidden tw-border tw-bg-slate-100 tw-items-center tw-rounded-md tw-text-sm">
					<HomeIcon className="tw-w-5 tw-h-5 tw-text-gray-600 hover:tw-text-black" />
					{[...Array(nrSegments)].map((e, index) => (
						<Fragment key={index}>
							<ChevronRightIcon className="tw-w-5 tw-h-5 tw-text-gray-600 tw-mx-1" />
							<div className="tw-h-2 tw-w-20 tw-bg-slate-300 tw-rounded tw-animate-pulse"></div>
						</Fragment>
					))}
				</div>

				<div className="tw-text-sm tw-text-slate-500">
					<div className="tw-py-2.5 tw-px-3 tw-grid tw-grid-cols-[1fr_100px_100px] tw-items-center tw-gap-2 tw-text-sm tw-border-b tw-border-slate-300 tw-font-bold tw-text-slate-500">
						<span className="tw-whitespace-nowrap tw-text-left tw-font-semibold tw-text-slate-600">
							{__('Name', 'course-resources')}
						</span>
						<span className="tw-whitespace-nowrap tw-text-left tw-font-semibold tw-text-slate-600">
							{__('Size', 'course-resources')}
						</span>
						<span className="tw-whitespace-nowrap tw-text-left tw-font-semibold tw-text-slate-600">
							{__('Last updated', 'course-resources')}
						</span>
					</div>
					{[...Array(nrRows)].map((e, i) => (
						<div
							className="tw-animate-pulse tw-border-y tw-px-3 tw-py-2.5 tw-grid tw-grid-cols-[1fr_100px_100px] tw-items-center tw-border-b-slate-200 tw-border-b tw-gap-2"
							key={`row-${i}`}
						>
							<div className="tw-h-2 tw-my-2 tw-bg-slate-300 tw-rounded"></div>
							<div className="tw-h-2 tw-my-2 tw-bg-slate-300 tw-rounded"></div>
							<div className="tw-h-2 tw-my-2 tw-bg-slate-300 tw-rounded"></div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
