import { __ } from '@wordpress/i18n';
import { useFileManagerContext } from './FileManagerContext';

export default function FileManagerError() {
	const { error, dismissError } = useFileManagerContext();
	return error ? (
		<div className="tw-rounded-md tw-bg-red-50 tw-p-4 tw-text-sm tw-text-red-500 tw-my-4 tw-flex tw-justify-between">
			<span>
				<b>{__('Error:', 'course-resources')} </b>
				{error}
			</span>
			<button
				className="tw-text-sm tw-cursor-pointer"
				onClick={() => dismissError()}
			>
				{__('Hide', 'course-resources')}
			</button>
		</div>
	) : null;
}
