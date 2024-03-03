import { __ } from '@wordpress/i18n';
import Header from '../header/Header';

const nrRows = 3;

export default function HomeLoading() {
	return (
		<>
			<Header title={__('Courses', 'course-resources')}></Header>
			<nav className="tw-flex tw-flex-col">
				{[...Array(nrRows)].map((_, i) => (
					<div
						key={i}
						className="tw-animate-pulse tw-bg-slate-300 tw-h-3 tw-rounded-md tw-mx-3 tw-my-6"
					/>
				))}
			</nav>
		</>
	);
}
