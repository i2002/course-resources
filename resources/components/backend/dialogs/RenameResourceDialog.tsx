import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { FormEvent } from 'react';
import InputDialog from '../ui/InputDialog';

interface Props {
	open: boolean;
	initialData: string;
	setOpen: (state: boolean) => any;
	onSubmit: (name: string) => any;
}

export default function RenameResourceDialog({
	open,
	initialData,
	setOpen,
	onSubmit,
}: Props) {
	const submitHandler = (e: FormEvent<HTMLFormElement>) => {
		const formData = new FormData(e.currentTarget);
		onSubmit(formData.get('name')?.toString() ?? '');
		setOpen(false);
		e.preventDefault();
	};

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.value = initialData;
		}
	}, [inputRef, initialData]);

	return (
		<InputDialog
			open={open}
			title={__('Rename resource', 'course-resources')}
			submitButtonLabel={__('Rename', 'course-resources')}
			submitButtonColor="primary"
			className="tw-max-w-sm"
			onClose={() => setOpen(false)}
			submitHandler={submitHandler}
		>
			<div className="tw-mt-4 tw-w-full tw-p-1">
				<input
					type="text"
					name="name"
					ref={inputRef}
					className="tw-form-input tw-text-sm"
					placeholder={__('Resource name', 'course-resources')}
					onKeyDown={(e) => e.stopPropagation()} // prevent close dialog when input focused
					required
				/>
			</div>
		</InputDialog>
	);
}
