import type { FormEvent } from 'react';
import InputDialog from '../ui/InputDialog';

interface Props {
	open: boolean;
	setOpen: (state: boolean) => any;
	onSubmit: (name: string) => any;
}

export default function AddFolderDialog({ open, setOpen, onSubmit }: Props) {
	const submitHandler = (e: FormEvent<HTMLFormElement>) => {
		const formData = new FormData(e.currentTarget);
		onSubmit(formData.get('name')?.toString() ?? '');
		setOpen(false);
		e.preventDefault();
		e.stopPropagation();
	};

	return (
		<InputDialog
			open={open}
			title="Adăugare director nou"
			submitButtonLabel="Creare director"
			submitButtonColor="primary"
			className="tw-max-w-sm"
			onClose={() => setOpen(false)}
			submitHandler={submitHandler}
		>
			<div className="tw-mt-4 tw-w-full tw-p-1">
				<input
					type="text"
					name="name"
					className="tw-form-input tw-text-sm"
					placeholder="Nume director"
					onKeyDown={(e) => e.stopPropagation()} // prevent close dialog when input focused
					required
				/>
			</div>
		</InputDialog>
	);
}
