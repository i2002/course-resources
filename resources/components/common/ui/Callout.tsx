type Props = {
	title: string;
	type: 'info' | 'error';
	children?: React.ReactNode;
};

export default function Callout({ title, type, children }: Props) {
	const colors =
		type === 'error'
			? 'tw-bg-rose-500 tw-border-rose-700 tw-text-rose-700'
			: 'tw-bg-teal-500 tw-border-teal-700 tw-text-teal-700';
	return (
		<div
			className={`tw-mb-4 tw-flex tw-flex-col tw-overflow-hidden tw-rounded-md tw-text-sm tw-border-l-4 tw-py-3 tw-pr-3 tw-pl-4 tw-bg-opacity-10 ${colors}`}
		>
			<div className="tw-flex tw-items-start">
				<h4 className="tw-font-semibold">{title}</h4>
			</div>
			<div className="tw-overflow-y-auto tw-mt-2">{children}</div>
		</div>
	);
}
