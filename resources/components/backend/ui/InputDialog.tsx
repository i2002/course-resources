import { Dialog } from '@headlessui/react';
import type { FormEvent } from 'react';

interface Props {
	open: boolean;
	title: string;
	submitButtonLabel: string;
	submitButtonColor: 'primary' | 'danger';
	className?: string;
	children: React.ReactNode;
	onClose: () => any;
	submitHandler: (e: FormEvent<HTMLFormElement>) => any;
}

export default function InputDialog({
	open,
	title,
	submitButtonLabel,
	submitButtonColor,
	className,
	children,
	onClose,
	submitHandler,
}: Props) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			className="tw-relative tw-z-[100000]"
		>
			<div className="tw-fixed tw-inset-0 tw-flex tw-w-screen tw-items-center tw-justify-center tw-p-4 tw-bg-black tw-bg-opacity-25 tw-overflow-y-auto">
				<Dialog.Panel
					className={`tw-grid tw-grid-rows-[auto_1fr] tw-overflow-y-hidden tw-bg-white tw-p-6 tw-w-full tw-rounded-lg tw-text-left tw-align-middle tw-shadow-xl ${className}`}
				>
					<Dialog.Title
						as="h3"
						className="tw-text-lg tw-font-medium tw-leading-6 tw-text-gray-900"
					>
						{title}
					</Dialog.Title>
					<form
						onSubmit={submitHandler}
						className="tw-grid tw-grid-rows-[1fr_auto] tw-overflow-y-hidden"
					>
						{children}
						<div className="tw-mt-3 tw-flex tw-justify-around">
							<button
								type="button"
								className="tw-button-neutral"
								onClick={() => onClose()}
							>
								Renunțare
							</button>
							<button
								type="submit"
								className={
									submitButtonColor === 'primary'
										? 'tw-button-primary'
										: 'tw-button-danger'
								}
							>
								{submitButtonLabel}
							</button>
						</div>
					</form>
				</Dialog.Panel>
			</div>
		</Dialog>
	);
}
