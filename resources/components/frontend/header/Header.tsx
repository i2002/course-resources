import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Link } from 'react-router-dom';
import AccountOptionsMenu from './AccountOptionsMenu';

type Props = {
	title?: string;
	back?: boolean;
};

export default function Header({ title, back }: Props) {
	return (
		<div className="tw-flex tw-items-center tw-mt-2 tw-m-4">
			{back && (
				<Link
					to="/"
					className="hover:tw-text-black tw-text-gray-500 tw-cursor-pointer tw-mx-1"
				>
					<ChevronLeftIcon className="tw-w-8 tw-h-8"></ChevronLeftIcon>
				</Link>
			)}
			<h1 className={`tw-text-2xl tw-mr-auto ${!back ? 'tw-ml-10' : ''}`}>
				{title}
				{title === undefined && (
					<div className="tw-h-3 tw-w-60 tw-my-2.5 tw-bg-slate-300 tw-animate-pulse tw-rounded-md" />
				)}
			</h1>
			<AccountOptionsMenu className="hover:tw-bg-gray-200 hover:tw-shadow tw-rounded-md tw-px-2 tw-py-1 tw-text-base tw-font-medium"></AccountOptionsMenu>
		</div>
	);
}
