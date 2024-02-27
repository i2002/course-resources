import apiFetch from '@wordpress/api-fetch';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router-dom';
import type { FolderData } from '../../../../lib/file-data-types';
import FolderChildren from './FolderChildren';
import FolderPath from './FolderPath';

export type FolderLoader = {
	courseId: number;
	folderData: FolderData;
};

export const folderLoader = async ({
	params,
}: LoaderFunctionArgs): Promise<FolderLoader> => {
	const folderData = await apiFetch<FolderData>({
		path: `/course-resources/v1/${params.courseId}/${params.folderId ?? ''}`,
	});

	return {
		courseId: parseInt(params.courseId ?? ''),
		folderData,
	};
};

export default function FolderView() {
	const { courseId, folderData } = useLoaderData() as FolderLoader;

	return (
		<div className="tw-relative tw-w-full tw-text-left tw-ring-1 tw-rounded-lg tw-p-6 tw-bg-white tw-ring-slate-200 tw-shadow tw-border-blue-500">
			<FolderPath courseId={courseId} path={folderData.path} />
			<FolderChildren
				courseId={courseId}
				folderChildren={folderData.children}
			/>
		</div>
	);
}
