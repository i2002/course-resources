import apiFetch from '@wordpress/api-fetch';
import {
	Outlet,
	useLoaderData,
	useNavigation,
	type LoaderFunctionArgs,
} from 'react-router-dom';
import type { Course } from '../../../lib/file-data-types';
import Header from '../header/Header';
import FileLoading from './file/FileLoading';
import FolderLoading from './folder/FolderLoading';

export type CourseLoader = {
	course: Course;
};

export const courseLoader = async ({
	params,
}: LoaderFunctionArgs): Promise<CourseLoader> => {
	const course = await apiFetch<Course>({
		path: `/course-resources/v1/courses/${params.courseId}`,
	});

	return { course };
};

export default function CourseView() {
	const { course } = useLoaderData() as CourseLoader;

	const navigation = useNavigation();
	let loader = null;
	if (navigation.location?.pathname.includes('/course')) {
		if (navigation.location.pathname.includes('/file')) {
			loader = <FileLoading />;
		} else {
			loader = <FolderLoading />;
		}
	}

	return (
		<>
			<Header title={course.name} back={true} />
			{(navigation.state === 'loading' && loader) || <Outlet />}
		</>
	);
}
