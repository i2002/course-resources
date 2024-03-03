import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import wp from '../../lib/wp-types';
import StudentEnrolmentDialog from './dialogs/StudentEntrolmentDialog';

type Props = {
	courseId: number;
};

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
				setEmails(course.meta.cr_course_students);
			})
			.catch(() =>
				setError(__('Error loading student data.', 'course-resources'))
			)
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
					cr_course_students: newEmails,
				},
			},
		})
			.then((course) => setEmails(course.meta.cr_course_students))
			.catch(() =>
				setError(__('Error updating student data.', 'course-resources'))
			)
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
				{sprintf(
					/* translators: %s number of enrolled students */
					_n(
						'%s student enrolled',
						'%s students enrolled',
						emails.length,
						'course-resources'
					),
					emails.length
				)}
			</p>
			<button
				type="button"
				className="tw-my-1 tw-px-1 tw-rounded tw-text-blue-950 disabled:tw-text-slate-600 disabled:tw-cursor-not-allowed hover:enabled:tw-bg-gray-100 hover:enabled:tw-shadow"
				onClick={() => setEditDialogOpen(true)}
				disabled={loading}
			>
				{__('Update student list', 'course-resources')}
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
