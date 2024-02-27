import apiFetch from '@wordpress/api-fetch';
import {
	useLoaderData,
	useNavigate,
	type LoaderFunctionArgs,
} from 'react-router-dom';
import wp from '../../../../lib/wp-types';
import ResourceViewer from '../../../common/ResourceViewer';

export type FileLoader = {
	courseId: number;
	fileData: wp.Media;
};

export const fileLoader = async ({
	params,
}: LoaderFunctionArgs): Promise<FileLoader> => {
	const fileData = await apiFetch<wp.Media>({
		path: `/wp/v2/media/${params.fileId}`,
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
