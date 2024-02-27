import type { FormEvent } from 'react';
import InputDialog from '../ui/InputDialog';

interface Props {
	open: boolean;
	setOpen: (state: boolean) => any;
	onConfirm: (deleteAttachments: boolean) => any;
}

export default function ConfirmDeleteResourceDialog({
	open,
	setOpen,
	onConfirm,
}: Props) {
	const submitHandler = (e: FormEvent<HTMLFormElement>) => {
		const formData = new FormData(e.currentTarget);
		onConfirm(formData.has('delete-attachments'));
		setOpen(false);
	};

	return (
		<InputDialog
			open={open}
			title="Confirmare ștergere selecție"
			submitButtonLabel="Ștergere selecție"
			submitButtonColor="danger"
			className="tw-max-w-sm"
			onClose={() => setOpen(false)}
			submitHandler={submitHandler}
		>
			<div className="tw-mt-4 tw-text-sm tw-font-medium tw-text-slate-900">
				<p className="tw-mb-3 tw-text-center">
					Fișierele șterse vor rămâne în biblioteca media.
				</p>
				<div className="tw-flex tw-items-center tw-space-x-2 tw-px-1">
					<input
						type="checkbox"
						name="delete-attachments"
						id="delete-attachments"
						className="tw-form-checkbox"
					/>
					<label
						htmlFor="delete-attachments"
						className="tw-text-gray-700"
					>
						Șterge permanent fișierele din selecție
					</label>
				</div>
			</div>
		</InputDialog>
	);
}
