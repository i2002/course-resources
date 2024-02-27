import { useContext } from '@wordpress/element';
import { LoginContext } from './LoginContext';

export default function FormMessage() {
	const {
		state: { messageTitle, message, messageType },
	} = useContext(LoginContext);

	return message ? (
		<div
			className={`tw-mb-4 tw-flex tw-flex-col tw-overflow-hidden tw-rounded-md tw-text-sm tw-border-l-4 tw-py-3 tw-pr-3 tw-pl-4 tw-bg-opacity-10 ${messageType === 'error' ? 'tw-bg-rose-500 tw-border-rose-700 tw-text-rose-700' : 'tw-bg-teal-500 tw-border-teal-700 tw-text-teal-700'}`}
			title={messageTitle}
			color={messageType === 'error' ? 'rose' : 'teal'}
		>
			<div className="tw-flex tw-items-start">
				<h4 className="tw-font-semibold">{messageTitle}</h4>
			</div>
			<p className="tw-overflow-y-auto tw-mt-2">{message}</p>
		</div>
	) : null;
}
