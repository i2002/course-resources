import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import apiFetch from '@wordpress/api-fetch';
import { useNavigate, useRouteLoaderData } from 'react-router-dom';
import { AuthLoader } from '../root/RootLayout';

interface Props {
	className?: string;
}

export default function AccountOptionsMenu({ className }: Props) {
	const { user } = useRouteLoaderData('root') as AuthLoader;
	const navigate = useNavigate();

	const signOut = async () => {
		await apiFetch({
			method: 'POST',
			path: '/course-resources/v1/logout',
		});

		navigate('/login', {
			replace: true,
		});
	};

	return (
		<Menu as="div" className="tw-relative tw-inline-block tw-text-left">
			<Menu.Button
				className={`tw-inline-flex tw-w-full tw-justify-center tw-items-center tw-rounded-md ${className}`}
			>
				{user.email ?? 'Utilizator'}
				<ChevronDownIcon
					className="tw-ml-1 -tw-mr-1 tw-h-5 tw-w-5"
					aria-hidden="true"
				/>
			</Menu.Button>
			<Transition
				enter="transition duration-100 ease-out"
				enterFrom="transform scale-95 opacity-0"
				enterTo="transform scale-100 opacity-100"
				leave="transition duration-75 ease-out"
				leaveFrom="transform scale-100 opacity-100"
				leaveTo="transform scale-95 opacity-0"
			>
				<Menu.Items className="tw-absolute tw-right-0 tw-mt-2 tw-w-40 tw-origin-top-right tw-divide-y tw-divide-gray-100 tw-rounded-md tw-bg-white tw-shadow-lg tw-ring-1 tw-ring-black/5 focus:tw-outline-none tw-p-1 tw-z-10">
					<Menu.Item
						as="a"
						onClick={() => signOut()}
						className="ui-active:tw-bg-teal-500 ui-active:tw-text-white ui-not-active:tw-text-gray-900 tw-cursor-pointer tw-flex tw-w-full tw-items-center tw-rounded-md tw-px-2 tw-py-2 tw-text-sm"
					>
						Deconectare
					</Menu.Item>
				</Menu.Items>
			</Transition>
		</Menu>
	);
}
