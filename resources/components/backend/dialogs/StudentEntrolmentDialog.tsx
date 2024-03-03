import { XMarkIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import InputDialog from '../ui/InputDialog';

interface Props {
	open: boolean;
	initialEmails: string[];
	setOpen: (state: boolean) => any;
	onSubmit: (emails: string[]) => any;
}

function isEmail(email: string) {
	return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(email);
}

export default function StudentEnrolmentDialog({
	open,
	initialEmails,
	setOpen,
	onSubmit,
}: Props) {
	const [input, setInput] = useState<string>('');
	const [emails, setEmails] = useState<string[]>(initialEmails);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		setEmails(initialEmails);
	}, [initialEmails]);

	const submitHandler = () => {
		onSubmit(emails);
		setOpen(false);
	};

	const keyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (['Enter', 'Tab', ',', ';'].includes(e.key)) {
			e.preventDefault();

			setError('');

			const email = input.trim();

			if (!email) {
				return;
			}

			if (!isEmail(email)) {
				setError(__('Invalid email', 'course-resources'));
				return;
			}

			if (emails.includes(email)) {
				setInput('');
				return;
			}

			setEmails((oldEmails) => [...oldEmails, email]);
			setInput('');
		}
		e.stopPropagation();
	};

	const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
		if (error) {
			const email = e.target.value.trim();
			if (email && isEmail(email)) {
				setError('');
			}
		}
	};

	const pasteHandler = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();

		const paste = e.clipboardData.getData('text');
		const pastedEmails = paste.match(
			/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
		);

		if (pastedEmails) {
			const newEmails = pastedEmails.filter(
				(email) => !emails.includes(email)
			);

			setEmails((oldEmails) => [...oldEmails, ...newEmails]);
		}
	};

	return (
		<InputDialog
			open={open}
			title={__('Change student list', 'course-resources')}
			submitButtonColor="primary"
			submitButtonLabel={__('Save changes', 'course-resources')}
			className="tw-h-[85vh] tw-w-[90vw]"
			onClose={() => setOpen(false)}
			submitHandler={submitHandler}
		>
			<div className="tw-grid tw-grid-rows-[auto_minmax(50px,1fr)_auto] tw-overflow-y-hidden tw-p-1">
				<div className="tw-my-3">
					<input
						placeholder={__(
							'Type or paste email addresses and press `Enter`',
							'course-resources'
						)}
						className={
							error ? 'tw-form-input-error' : 'tw-form-input'
						}
						type="text"
						value={input}
						onChange={changeHandler}
						onKeyDown={keyDownHandler}
						onPaste={pasteHandler}
					/>
					{error && (
						<p className="tw-mt-1 tw-ml-2 tw-text-sm tw-text-red-500">
							{error}
						</p>
					)}
				</div>

				<ul className="tw-px-3 tw-py-1 tw-my-1 tw-border-gray-200 tw-rounded-md tw-border tw-overflow-auto">
					{emails.map((email) => (
						<li
							key={email}
							className="tw-bg-gray-100 hover:tw-bg-gray-200 tw-rounded-md tw-px-2 tw-py-1 tw-my-1 tw-flex tw-justify-between tw-items-center"
						>
							<span className="tw-truncate">{email}</span>
							<button
								type="button"
								className="tw-p-0.5 hover:tw-bg-red-400 hover:tw-text-white tw-rounded-full tw-h-5"
								onClick={() =>
									setEmails((oldEmails) =>
										oldEmails.filter((e) => e !== email)
									)
								}
							>
								<XMarkIcon
									title={__('Remove', 'course-resources')}
									className="tw-h-full"
								/>
							</button>
						</li>
					))}
				</ul>
				<button
					type="button"
					className="tw-text-sm hover:tw-shadow hover:tw-bg-red-100 tw-px-2 tw-py-1 tw-mt-2 tw-rounded"
					onClick={() => setEmails([])}
				>
					{__('Clear all', 'course-resources')}
				</button>
			</div>
		</InputDialog>
	);
}
