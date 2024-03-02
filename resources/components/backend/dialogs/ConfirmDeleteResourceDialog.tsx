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
			title="Confirmare ștergere selecție"
			submitButtonLabel="Ștergere selecție"
			submitButtonColor="danger"
			className="tw-max-w-sm"
			onClose={() => setOpen(false)}
			submitHandler={submitHandler}
		>
			<div className="tw-mt-4 tw-text-sm tw-font-medium tw-text-slate-900">
				<p className="tw-mb-3 tw-text-center">
					Toate fișierele selectate vor fi șterse permanent.
				</p>
			</div>
		</InputDialog>
	);
}
