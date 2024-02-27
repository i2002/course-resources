import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Fragment } from '@wordpress/element';
import { Link } from 'react-router-dom';
import type { ResourcePath } from '../../../../lib/file-data-types';

type Props = {
	courseId: number;
	path: ResourcePath;
};

export default function FolderPath({ courseId, path }: Props) {
	return (
		<div className="tw-flex tw-p-3 tw-mb-3 tw-box-content tw-h-5 tw-overflow-hidden tw-border tw-bg-slate-100 tw-items-center tw-rounded-md tw-text-sm">
			<Link to={`/course/${courseId}`} key="home">
				<HomeIcon className="tw-w-5 tw=h-5 tw-text-gray-600 hover:tw-text-black" />
			</Link>
			{path.length > 4 && (
				<>
					<ChevronRightIcon className="tw-w-5 tw-h-5 tw-text-gray-600 tw-mx-1" />
					<span className="tw-font-medium">...</span>
				</>
			)}
			{path.slice(-4).map((item, index, array) => (
				<Fragment key={`segment-${item.id}`}>
					<ChevronRightIcon className="tw-w-5 tw-h-5 tw-text-gray-600 tw-mx-1" />
					<Link to={`/course/${courseId}/folder/${item.id}`}>
						<span
							className={
								index === array.length - 1
									? 'tw-font-medium'
									: 'hover:tw-text-black hover:tw-underline tw-underline-offset-4'
							}
						>
							{item.name}
						</span>
					</Link>
				</Fragment>
			))}
		</div>
	);
}
