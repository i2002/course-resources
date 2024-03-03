import { ChevronRightIcon } from '@heroicons/react/20/solid';
import {
	DocumentPlusIcon,
	FolderPlusIcon,
	HomeIcon,
	PencilSquareIcon,
	ScissorsIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { Fragment, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AddFolderDialog from '../dialogs/AddFolderDialog';
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
		uploadFiles,
		renameResource,
		deleteSelection,
		startMoveSelection,
		cancelMoveSelection,
		endMoveSelection,
	} = useFileManagerContext();

	const fileUploadRef = useRef<HTMLInputElement>(null);

	const [addFolderDialogOpen, setAddFolderDialogOpen] = useState(false);
	const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] =
		useState(false);
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);

	const fileChangedHandler = () => {
		if (fileUploadRef.current?.files) {
			uploadFiles(fileUploadRef.current.files);
			fileUploadRef.current.value = '';
		}
	};

	return (
		<div className="tw-rounded tw-bg-slate-100 tw-p-2 tw-flex tw-text-slate-600 tw-items-center">
			<div className="tw-w-full tw-flex tw-text-sm tw-items-center">
				<HomeIcon
					className="tw-w-5 tw-h-5 tw-mx-1 tw-cursor-pointer hover:tw-text-slate-900"
					title={__('Root folder', 'course-resources')}
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
							{__('Cancel', 'course-resources')}
						</button>
						<button
							type="button"
							onClick={() => endMoveSelection()}
							className="hover:tw-underline tw-mx-1 tw-font-medium"
						>
							{__('Move here', 'course-resources')}
						</button>
					</div>
				)}
				<button
					type="button"
					title={__('New folder', 'course-resources')}
					onClick={() => setAddFolderDialogOpen(true)}
					className="tw-w-6 tw-h-6 tw-p-0.5 tw-mx-1 hover:enabled:tw-text-teal-600 tw-cursor-pointer disabled:tw-cursor-not-allowed disabled:tw-text-gray-400"
				>
					<FolderPlusIcon />
				</button>
				<div>
					<label htmlFor="fileUpload">
						<input
							ref={fileUploadRef}
							type="file"
							name="fileUpload"
							id="fileUpload"
							onChange={() => fileChangedHandler()}
							className="hidden"
							multiple
						/>
						<DocumentPlusIcon
							title={__('Upload file', 'course-resources')}
							className="tw-w-6 tw-h-6 tw-p-0.5 tw-mx-1 hover:tw-text-teal-600 tw-cursor-pointer disabled:tw-cursor-not-allowed disabled:tw-text-gray-400"
						/>
						<span className="tw-sr-only">
							{__('Upload file', 'course-resources')}
						</span>
					</label>
				</div>
				<button
					type="button"
					title={__('Rename resource', 'course-resources')}
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
					title={__('Move selection', 'course-resources')}
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
					title={__('Delete selection', 'course-resources')}
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
				onConfirm={() => deleteSelection()}
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
