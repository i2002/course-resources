import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useLoaderData } from 'react-router-dom';
import type { Course } from '../../../lib/file-data-types';
import Header from '../header/Header';
import CourseList from './CourseList';

export type HomeLoader = {
	courses: Course[];
};

export const homeLoader = async (): Promise<HomeLoader> => {
	const courses = await apiFetch<Course[]>({
		path: `/course-resources/v1/courses`,
	});

	return { courses };
};

export default function HomeView() {
	const { courses } = useLoaderData() as HomeLoader;

	return (
		<>
			<Header title={__('Courses', 'course-resources')} />
			<CourseList courses={courses} />
		</>
	);
}
