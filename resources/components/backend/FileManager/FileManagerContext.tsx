import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Resource, ResourcePath } from '../../../lib/file-data-types';
import {
	addFolderAction,
	deleteSelectionAction,
	getFolderData,
	moveSelectionAction,
	renameResourceAction,
	uploadFilesAction,
} from './file-manager-actions';
import type { FileManagerContextType } from './file-manager-types';
import {
	addResource,
	prepareMovingData,
	prepareUploadedFilesData,
	removeResource,
	replaceResource,
	resourceComparator,
} from './file-manager-utils';

const FileManagerContext = createContext<FileManagerContextType | null>(null);

export const useFileManagerContext = () => {
	const fileManagerContext = useContext(FileManagerContext);
	if (!fileManagerContext) {
		throw new Error(
			'No FileManagerContextProvider found when calling useFileManagerContext'
		);
	}

	return fileManagerContext;
};

type ProviderProps = {
	children: React.ReactNode;
	courseId: number;
};

type ResourcesReducerAction =
	| {
			type: 'add' | 'remove';
			resources: Resource[] | Resource;
	  }
	| {
			type: 'replace';
			oldResource: Resource;
			newResource: Resource;
	  }
	| {
			type: 'set';
			resources: Resource[];
	  };

const resourcesReducer = (
	state: Resource[],
	action: ResourcesReducerAction
) => {
	if (action.type === 'add' || action.type === 'remove') {
		// transform single item in array
		const resources = Array.isArray(action.resources)
			? action.resources
			: Array.of(action.resources);

		const handler = action.type === 'add' ? addResource : removeResource;

		state = resources.reduce(
			(tempState, res) => handler(tempState, res),
			state
		);
	} else if (action.type === 'replace') {
		state = replaceResource(state, action.oldResource, action.newResource);
	} else if (action.type === 'set') {
		state = action.resources;
	}

	return state.sort(resourceComparator);
};

export const FileManagerProvider = ({ children, courseId }: ProviderProps) => {
	// data states
	const [parent, setParent] = useState<number>(0);
	const [preview, setPreview] = useState<number | null>(null);
	const [path, setPath] = useState<ResourcePath>([]);
	const [resources, resourcesDispatch] = useReducer(resourcesReducer, []);

	// status states
	const [selected, setSelected] = useState<Resource[]>([]);
	const [moving, setMoving] = useState<Resource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();

	// load parent data
	const loadParent = useCallback(() => {
		loadData(
			getFolderData(courseId, parent).then((newState) => {
				setPath(newState.path);

				resourcesDispatch({
					type: 'set',
					resources: newState.children,
				});
			})
		);
	}, [parent, courseId]);

	// manage loading state
	const loadData = (newState: Promise<void>) => {
		setLoading(true);
		newState
			// .then((data) => setState(data))
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	};

	// update state when resource change
	useEffect(() => {
		loadParent();
	}, [loadParent]);

	// reset selection when state changes
	useEffect(() => {
		setSelected([]);
	}, [resources]);

	// action handlers
	const addFolder = useCallback(
		async (name: string) => {
			const nameList = resources.map((res) => res.name);

			if (nameList.includes(name)) {
				setError(__('Folder name already exists.', 'course-resources'));
				return;
			}

			const newFolder = await addFolderAction(name, parent, courseId);

			resourcesDispatch({ type: 'add', resources: newFolder });
		},
		[parent, courseId, resources]
	);

	const uploadFiles = useCallback(
		(files: FileList) =>
			uploadFilesAction(
				prepareUploadedFilesData(files, resources),
				parent,
				courseId
			).then((uploadedFiles) =>
				resourcesDispatch({
					type: 'add',
					resources: uploadedFiles,
				})
			),
		[resources, parent, courseId]
	);

	const moveSelection = useCallback(
		() =>
			moveSelectionAction(parent, prepareMovingData(moving, resources))
				.then((movedResources) => {
					resourcesDispatch({
						type: 'add',
						resources: movedResources,
					});
				})
				.finally(() => setMoving([])),
		[parent, resources, moving]
	);

	const renameResource = useCallback(
		async (newName: string, renamed: Resource) => {
			const nameList = resources.map((res) => res.name);

			if (nameList.includes(newName)) {
				setError(__('Name already exists.', 'course-resources'));
				return;
			}

			const newResource = await renameResourceAction(newName, renamed);

			if (newResource) {
				resourcesDispatch({
					type: 'replace',
					oldResource: renamed,
					newResource,
				});

				setSelected([]);
			}
		},
		[resources]
	);

	const deleteSelection = useCallback(
		() =>
			deleteSelectionAction(selected).then((removedResources) =>
				resourcesDispatch({
					type: 'remove',
					resources: removedResources,
				})
			),
		[selected]
	);

	return (
		<FileManagerContext.Provider
			value={{
				courseId,
				parent,
				resources,
				path,
				preview,
				loading,
				error,
				selected,
				moving: moving.length,
				setParent,
				setPreview,
				setSelected,
				dismissError: () => setError(undefined),
				addFolder: (name) => loadData(addFolder(name)),
				refresh: loadParent,
				startMoveSelection: () => setMoving(selected),
				cancelMoveSelection: () => setMoving([]),
				endMoveSelection: () => loadData(moveSelection()),
				uploadFiles: (files: FileList) => loadData(uploadFiles(files)),
				renameResource: (newName, renamed) =>
					loadData(renameResource(newName, renamed)),
				deleteSelection: () => loadData(deleteSelection()),
			}}
		>
			{children}
		</FileManagerContext.Provider>
	);
};
