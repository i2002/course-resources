import { Link } from 'react-router-dom';
import type { Course } from '../../../lib/file-data-types';

type Props = {
	courses: Course[];
};

export default function CourseList({ courses }: Props) {
	return courses.length ? (
		<nav>
			{courses.map((course) => (
				<Link
					to={`/course/${course.id}`}
					key={course.id}
					className="hover:tw-bg-slate-100 active:tw-bg-slate-50 tw-bg-white tw-cursor-pointer tw-my-2 tw-px-3 tw-py-2 tw-rounded tw-block tw-shadow"
				>
					{course.name}
				</Link>
			))}
		</nav>
	) : (
		<span>You do not have access to any course.</span>
	);
}
