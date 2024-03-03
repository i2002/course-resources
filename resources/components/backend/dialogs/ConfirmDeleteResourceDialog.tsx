import { __ } from '@wordpress/i18n';
import InputDialog from '../ui/InputDialog';

interface Props {
	open: boolean;
	setOpen: (state: boolean) => any;
	onConfirm: () => any;
}

export default function ConfirmDeleteResourceDialog({
	open,
	setOpen,
	onConfirm,
}: Props) {
	const submitHandler = () => {
		onConfirm();
		setOpen(false);
	};

	return (
		<InputDialog
			open={open}
			title={__('Delete selection confirmation', 'course-resources')}
			submitButtonLabel={__('Delete selection', 'course-resources')}
			submitButtonColor="danger"
			className="tw-max-w-sm"
			onClose={() => setOpen(false)}
			submitHandler={submitHandler}
		>
			<div className="tw-mt-4 tw-text-sm tw-font-medium tw-text-slate-900">
				<p className="tw-mb-3 tw-text-center">
					{__(
						'All selected files and folders will be permanently deleted.',
						'course-resources'
					)}
				</p>
			</div>
		</InputDialog>
	);
}
