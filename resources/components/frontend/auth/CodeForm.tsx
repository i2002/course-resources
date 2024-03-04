import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { __ } from '@wordpress/i18n';
import {
	Form,
	useNavigation,
	useSearchParams,
	useSubmit,
} from 'react-router-dom';
import Callout from '../../common/ui/Callout';

export default function CodeForm() {
	const { state } = useNavigation();
	const submit = useSubmit();
	const [params, setParams] = useSearchParams();
	const email = params.get('email') ?? '';

	const resendCode = () => {
		submit(
			{
				email,
				resend: true,
				intent: 'login_request',
			},
			{
				method: 'POST',
			}
		);
	};

	return (
		<Form method="POST" className="tw-w-full">
			<Callout
				title={__('Verification code sent', 'course-resources')}
				type="info"
			>
				<p>
					{__(
						'Please input the verification code sent to your email address.',
						'course-resources'
					)}
				</p>
				<p>
					<button
						className="tw-font-medium"
						type="button"
						onClick={() => resendCode()}
					>
						{__('Resend code', 'course-resources')}
					</button>
				</p>
			</Callout>
			<div className="tw-mb-6">
				<input
					type="text"
					hidden={true}
					readOnly={true}
					name="email"
					value={params.get('email') ?? ''}
				/>
				<input
					type="text"
					name="code"
					placeholder={__('Login code', 'course-resources')}
					className="tw-form-input"
					disabled={state !== 'idle'}
				/>
			</div>
			<button
				className="tw-button-primary tw-w-full tw-py-2 tw-mb-3"
				disabled={state !== 'idle'}
				type="submit"
				name="intent"
				value="verify_code"
			>
				{__('Verify code', 'course-resources')}
			</button>
			<button
				type="button"
				className="tw-w-full tw-rounded-lg tw-border tw-border-transparent tw-bg-transparent tw-px-5 tw-py-2 tw-text-center tw-text-sm tw-font-medium tw-text-gray-500 tw-shadow-none tw-transition-all hover:tw-bg-gray-100 disabled:tw-bg-transparent disabled:tw-text-gray-400 tw-flex tw-justify-center tw-items-center"
				onClick={() => {
					setParams('');
				}}
			>
				<ArrowLeftIcon className="tw-h-4 tw-w-4 tw-mr-2" />
				{__('Change email address', 'course-resources')}
			</button>
		</Form>
	);
}
