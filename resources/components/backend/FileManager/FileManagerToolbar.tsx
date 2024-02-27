import AddFolderDialog from '../dialogs/AddFolderDialog';
// import ConfirmDeleteResourceDialog from '@/components/admin/dialogs/ConfirmDeleteResourceDialog';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import {
	DocumentPlusIcon,
	FolderPlusIcon,
	HomeIcon,
	PencilSquareIcon,
	ScissorsIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { Fragment, useState } from '@wordpress/element';
import wp from '../../../lib/wp-types';
import ConfirmDeleteResourceDialog from '../dialogs/ConfirmDeleteResourceDialog';
import RenameResourceDialog from '../dialogs/RenameResourceDialog';
import { useFileManagerContext } from './FileManagerContext';

export default function FileManagerToolbar() {
	const {
		path,
		selected,
		moving,
		setParent,
		addFolder,
		attachMedia,
		// uploadFile,
		renameResource,
		deleteSelection,
		startMoveSelection,
		cancelMoveSelection,
		endMoveSelection,
	} = useFileManagerContext();
	const [addFolderDialogOpen, setAddFolderDialogOpen] = useState(false);
	const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] =
		useState(false);
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);

	const showMediaFrame = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		// create new media frame
		const frame = wp.media({
			// const frame = new wp.media.view.MediaFrame.Select({
			title: 'Attach files to course folder',
			button: {
				text: 'Attach selection',
			},
			frame: 'select',
			multiple: true,
			library: {
				// order: 'ASC',

				// [ 'name', 'author', 'date', 'title', 'modified', 'uploadedTo',
				// 'id', 'post__in', 'menuOrder' ]
				// orderby: 'title',

				// mime type. e.g. 'image', 'image/jpeg'
				// type: 'image',

				// Searches the attachment title.
				// search: null,

				// Attached to a specific post (ID).
				uploadedTo: 0,

				// meta_key: 'cr-folder',
				// meta_value_num: 19,
				// folder: 'cc',
			},
		});

		// frame.on('open', () => {
		// 	// console.log(frame.state());
		// 	const library = frame.state().get('library');
		// 	// library.props.set({
		// 	// 	orderby: 'date',
		// 	// 	order: 'ASC',
		// 	// 	meta_key: '30',
		// 	// 	'cr-folder': 'a',
		// 	// });
		// 	console.log(library.props);
		// 	// library._requery(true);
		// });

		// add select callback
		frame.on('select', () =>
			attachMedia(frame.state().get('selection').toJSON())
		);

		// frame.on('select', () =>
		// 	console.log(frame.state().get('selection').toJSON())
		// );

		// show media frame
		frame.open();
	};

	return (
		<div className="tw-rounded tw-bg-slate-100 tw-p-2 tw-flex tw-text-slate-600 tw-items-center">
			<div className="tw-w-full tw-flex tw-text-sm tw-items-center">
				<HomeIcon
					className="tw-w-5 tw-h-5 tw-mx-1 tw-cursor-pointer hover:tw-text-slate-900"
					title="Folder rădăcină"
					onClick={() => setParent(0)}
				/>
				{path.length > 3 && (
					<>
						<ChevronRightIcon className="tw-w-4 tw-h-4 tw-text-slate-500" />
						<span className="tw-mx-1">...</span>
					</>
				)}
				{path.slice(-3).map((segment) => (
					<Fragment key={segment.id}>
						<ChevronRightIcon className="tw-w-4 tw-h-4 tw-text-slate-500" />
						<span
							title={segment.name}
							onClick={() => setParent(segment.id)}
							className="hover:tw-underline tw-underline-offset-2 tw-mx-1 tw-cursor-pointer tw-max-w-[150px] tw-truncate"
							role="button"
							aria-hidden="true"
						>
							{segment.name}
						</span>
					</Fragment>
				))}
			</div>
			<div className="tw-flex tw-w-full tw-justify-end tw-items-center">
				{moving !== 0 && (
					<div className="tw-bg-yellow-500 tw-bg-opacity-10 tw-rounded tw-text-sm tw-text-nowrap tw-px-1 tw-py-0.5">
						<span>{`${moving} resurse selectate`}</span>:
						<button
							type="button"
							onClick={() => cancelMoveSelection()}
							className="hover:tw-underline tw-mx-1 tw-font-medium"
						>
							Renunță
						</button>
						<button
							type="button"
							onClick={() => endMoveSelection()}
							className="hover:tw-underline tw-mx-1 tw-font-medium"
						>
							Mută aici
						</button>
					</div>
				)}
				<button
					type="button"
					title="Director nou"
					onClick={() => setAddFolderDialogOpen(true)}
					className="tw-w-6 tw-h-6 tw-p-0.5 tw-mx-1 hover:enabled:tw-text-teal-600 tw-cursor-pointer disabled:tw-cursor-not-allowed disabled:tw-text-gray-400"
				>
					<FolderPlusIcon />
				</button>
				<button
					type="button"
					title="Adaugare fișier"
					className="tw-w-6 tw-h-6 tw-p-0.5 tw-mx-1 hover:enabled:tw-text-teal-600 tw-cursor-pointer disabled:tw-cursor-not-allowed disabled:tw-text-gray-400"
					onClick={showMediaFrame}
				>
					<DocumentPlusIcon />
				</button>
				<button
					type="button"
					title="Redenumire resursă"
					className="tw-w-6 tw-h-6 tw-p-0.5 tw-mx-1 hover:enabled:tw-text-teal-600 tw-cursor-pointer disabled:tw-cursor-not-allowed disabled:tw-text-gray-400"
					disabled={selected.length !== 1}
					onClick={() =>
						selected.length === 1 && setRenameDialogOpen(true)
					}
				>
					<PencilSquareIcon />
				</button>
				<button
					type="button"
					title="Mutare selecție"
					className="tw-w-6 tw-h-6 tw-p-0.5 tw-mx-1 hover:enabled:tw-text-teal-600 tw-cursor-pointer disabled:tw-cursor-not-allowed disabled:tw-text-gray-400"
					onClick={() =>
						selected.length !== 0 &&
						moving === 0 &&
						startMoveSelection()
					}
					disabled={selected.length === 0 || moving !== 0}
				>
					<ScissorsIcon />
				</button>
				<button
					type="button"
					title="Ștergere selecție"
					className="tw-w-6 tw-h-6 tw-p-0.5 tw-mx-1 enabled:hover:tw-text-teal-600 tw-cursor-pointer disabled:tw-cursor-not-allowed disabled:tw-text-gray-400"
					disabled={selected.length === 0}
					onClick={() =>
						selected.length > 0 && setConfirmDeleteDialogOpen(true)
					}
				>
					<TrashIcon />
				</button>
			</div>

			<AddFolderDialog
				open={addFolderDialogOpen}
				setOpen={setAddFolderDialogOpen}
				onSubmit={(name) => addFolder(name)}
			/>

			<ConfirmDeleteResourceDialog
				open={confirmDeleteDialogOpen}
				setOpen={setConfirmDeleteDialogOpen}
				onConfirm={(deleteAttachments) =>
					deleteSelection(deleteAttachments)
				}
			/>

			{renameDialogOpen && (
				<RenameResourceDialog
					open={renameDialogOpen}
					setOpen={setRenameDialogOpen}
					initialData={
						(selected.length === 1 && selected[0].name) || ''
					}
					onSubmit={(name) => {
						if (name !== selected[0].name) {
							renameResource(name, selected[0]);
						}
					}}
				/>
			)}
		</div>
	);
}
