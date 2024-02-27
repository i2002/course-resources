import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import wp from '../../lib/wp-types';
import StudentEnrolmentDialog from './dialogs/StudentEntrolmentDialog';

type Props = {
	courseId: number;
};

function isEmail(email: string) {
	return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(email);
}

export default function StudentEnrolmentApp({ courseId }: Props) {
	const [emails, setEmails] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	// load student email list
	useEffect(() => {
		apiFetch<wp.Course>({
			path: `/wp/v2/cr-course/${courseId}`,
		})
			.then((course) => {
				setEmails(course.meta.students);
			})
			.catch(() => setError('Eroare la încărcare date.'))
			.finally(() => setLoading(false));
	}, [courseId]);

	// apply list changes
	const submitHandler = (newEmails: string[]) => {
		setLoading(true);
		apiFetch<wp.Course>({
			path: `/wp/v2/cr-course/${courseId}`,
			method: 'POST',
			data: {
				meta: {
					students: newEmails,
				},
			},
		})
			.then((course) => setEmails(course.meta.students))
			.catch(() => setError('Eroare la actualizare studenți.'))
			.finally(() => setLoading(false));
	};

	return (
		<div className="tw-bg-white">
			{error !== '' && (
				<p className="tw-text-base tw-text-red-500 tw-px-1 tw-py-0.5 tw-bg-red-100 tw-rounded tw-truncate">
					{error}
				</p>
			)}

			<p
				className={`tw-text-base tw-p-1 ${loading ? 'tw-text-slate-500' : 'tw-text-slate-900'}`}
			>
				{`${emails.length} studenți înscriși`}
			</p>
			<button
				type="button"
				className="tw-my-1 tw-px-1 tw-rounded tw-text-blue-950 disabled:tw-text-slate-600 disabled:tw-cursor-not-allowed hover:enabled:tw-bg-gray-100 hover:enabled:tw-shadow"
				onClick={() => setEditDialogOpen(true)}
				disabled={loading}
			>
				Modificare listă studenți
			</button>
			<StudentEnrolmentDialog
				open={editDialogOpen}
				initialEmails={emails}
				setOpen={setEditDialogOpen}
				onSubmit={submitHandler}
			></StudentEnrolmentDialog>
		</div>
	);
}
