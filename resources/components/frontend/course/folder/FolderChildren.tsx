import { Link } from 'react-router-dom';
import type { Resource } from '../../../../lib/file-data-types';
import { getResDate, getResSize } from '../../../../lib/utils';
import ResourceIcon from '../../../common/ui/ResourceIcon';

type Props = {
	courseId: number;
	folderChildren: Resource[];
};

export default function FolderChildren({ courseId, folderChildren }: Props) {
	return (
		<div className="tw-text-sm tw-text-slate-500">
			<div className="tw-py-2.5 tw-px-3 tw-grid tw-grid-cols-[1fr_100px_100px] tw-items-center tw-gap-2 tw-text-sm tw-border-b tw-border-slate-300 tw-font-bold tw-text-slate-500">
				<span className="tw-whitespace-nowrap tw-text-left tw-font-semibold tw-text-slate-600">
					Nume
				</span>
				<span className="tw-whitespace-nowrap tw-text-left tw-font-semibold tw-text-slate-600">
					Dimensiune
				</span>
				<span className="tw-whitespace-nowrap tw-text-left tw-font-semibold tw-text-slate-600">
					Modificat la
				</span>
			</div>
			{folderChildren.map((resource) => (
				<Link
					key={`${resource.type}-${resource.id}`}
					to={`/course/${courseId}/${resource.type}/${resource.id}`}
					className={`tw-px-3 tw-py-2.5 hover:tw-bg-slate-100 active:tw-bg-slate-50 tw-rounded-sm tw-grid tw-grid-cols-[auto_1fr_100px_100px] tw-items-center tw-border-b-slate-200 tw-border-b tw-gap-2 tw-cursor-pointer`}
				>
					<ResourceIcon
						type={resource.type}
						className="tw-h-6 tw-w-6"
					/>
					<span className="tw-truncate tw-whitespace-nowrap">
						{resource.name}
					</span>
					<span className="tw-align-middle tw-whitespace-nowrap tw-text-left tw-truncate">
						{getResSize(resource)}
					</span>
					<span
						className="tw-align-middle tw-whitespace-nowrap tw-text-left tw-truncate"
						title={getResDate(resource, 'full')}
					>
						{getResDate(resource)}
					</span>
				</Link>
			))}
			{folderChildren.length === 0 && (
				<div className="tw-text-slate-400 tw-text-sm tw-text-center tw-py-6">
					Acest folder nu conține niciun fișier.
				</div>
			)}
		</div>
	);
}
