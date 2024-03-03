import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Link,
	useNavigate,
	useParams,
	useRouteError,
	useRouteLoaderData,
} from 'react-router-dom';
import { CourseLoader } from '../course/CourseView';
import Header from '../header/Header';

export default function AppError() {
	const error = useRouteError() as any;
	const params = useParams();
	const navigate = useNavigate();
	const userData = useRouteLoaderData('root');
	const courseData = useRouteLoaderData('course') as CourseLoader;

	let title = __('Error loading page', 'course-resources');
	let message = __(
		'An error has occured while loading the page',
		'course-resources'
	);
	let linkTo = '/';
	let linkLabel = __('Back to course list', 'course-resources');

	if (
		error.status === 404 ||
		(error.data && (error.data.status === 404 || error.data.state === 404))
	) {
		title = __('Content not found', 'course-resources');
		message = __(
			'The requested page could not be found.',
			'course-resources'
		);

		if (
			error.code === 'rest_term_invalid_id' ||
			error.code === 'cr_rest_term_invalid_id'
		) {
			message = __(
				'Requested folder does not exist.',
				'course-resources'
			);
		}

		if (params.courseId) {
			linkTo = `/course/${params.courseId}`;
			linkLabel = __('Back to course page', 'course-resources');
		}
	} else if (error.code === 'invalid_json') {
		title = __('Error loading data', 'course-resources');
		message = __(
			'An error has occured while loading data. Please try again later.',
			'course-resources'
		);
	} else if (error.code === 'cr_rest_forbidden') {
		title = __('Access denied', 'course-resources');
		message = __(
			'You are not enrolled to this course.',
			'course-resources'
		);
	}

	useEffect(() => {
		if (
			error.code === 'cr_rest_unauth' ||
			(error.data && error.data.status === 401)
		) {
			navigate('/login');
		}
	}, [error, navigate]);

	return (
		<>
			{userData && (
				<Header
					title={courseData ? courseData.course.name : ''}
					back={true}
				/>
			)}
			<div className="tw-bg-white tw-rounded tw-p-6 tw-text-center">
				<h1 className="tw-font-medium tw-text-lg tw-py-2">{title}</h1>
				<p className="tw-text-gray-600 tw-py-2">{message}</p>
				<p className="tw-my-3">
					<Link to={linkTo} className="tw-button-primary">
						{linkLabel}
					</Link>
				</p>
			</div>
		</>
	);
}
