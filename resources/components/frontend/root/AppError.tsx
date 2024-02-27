import { useEffect } from '@wordpress/element';
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

	let title = 'Eroare la încărcarea paginii';
	let message = 'A apărut o eroare la încărcarea paginii';
	let linkTo = '/';
	let linkLabel = 'Înapoi la lista de cursuri';

	if (error.status === 404 || (error.data && error.data.status === 404)) {
		title = 'Conținut indexistent';
		message = 'Pagina specificată nu a fost găsită.';

		if (error.code === 'rest_term_invalid_id') {
			message = 'Folder-ul specificat nu există.';
		}

		if (params.courseId) {
			linkTo = `/course/${params.courseId}`;
			linkLabel = 'Înapoi la pagina cursului';
		}
	} else if (error.code === 'invalid_json') {
		title = 'Eroare la încărcare date';
		message =
			'A apărut o eroare la încărcarea datelor. Reîncercați după câteva momente.';
	} else if (error.code === 'cr_rest_forbidden') {
		title = 'Access restricționat';
		message = 'Nu ai permisiune de a accesa acest curs.';
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
