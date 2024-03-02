import apiFetch from '@wordpress/api-fetch';
import {
	useLoaderData,
	useNavigate,
	type LoaderFunctionArgs,
} from 'react-router-dom';
import type { Resource } from '../../../../lib/file-data-types';
import ResourceViewer from '../../../common/ResourceViewer';

export type FileLoader = {
	courseId: number;
	fileData: Resource;
};

export const fileLoader = async ({
	params,
}: LoaderFunctionArgs): Promise<FileLoader> => {
	const fileData = await apiFetch<Resource>({
		path: `/course-resources/v1/files/${params.fileId}`,
	});

	return {
		courseId: parseInt(params.courseId ?? ''),
		fileData,
	};
};

export default function FileView() {
	const { fileData } = useLoaderData() as FileLoader;
	const navigate = useNavigate();

	return <ResourceViewer fileData={fileData} onClose={() => navigate(-1)} />;
}
