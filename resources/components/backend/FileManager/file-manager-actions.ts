import apiFetch from '@wordpress/api-fetch';
import type { FolderData, Resource } from '../../../lib/file-data-types';
import type wp from '../../../lib/wp-types';

/**
 * Get folder data.
 *
 * @param courseId course id
 * @param parent   parent folder id (0 for root folder)
 * @return children resources and folder path for the resource
 */
export const getFolderData = async (courseId: number, parent: number) =>
	await apiFetch<FolderData>({
		path: `/course-resources/v1/${courseId}/${parent}`,
	});

/**
 * Change the name of a resource (file or folder).
 *
 * @param newName new name for the resource
 * @param renamed the resource to be renamed
 * @return the renamed resource
 */
export const renameResourceAction = async (
	newName: string,
	renamed: Resource
) => {
	if (renamed.type === 'folder') {
		const folder = await apiFetch<wp.FolderTax>({
			path: `/wp/v2/cr-folder/${renamed.id}`,
			method: 'POST',
			data: {
				name: newName,
			},
		});

		return resourceMapFolderTax(folder);
	} else if (renamed.type === 'file') {
		const file = await apiFetch<wp.Media>({
			path: `/wp/v2/cr-file/${renamed.id}`,
			method: 'POST',
			data: {
				title: newName,
			},
		});

		return resourceMapMedia(file);
	}
};

/**
 * Create folder action.
 *
 * @param name     name of the new folder
 * @param resource parent folder (0 for root folder)
 * @param courseId course id
 * @return data of the new folder
 */
export const addFolderAction = async (
	name: string,
	resource: number,
	courseId: number
) => {
	// https://gist.github.com/codeguy/6684588
	const slug = name
		.normalize('NFD') // split an accented letter in the base letter and the acent
		.replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
		.replace(/\s+/g, '_');

	const folder = await apiFetch<wp.FolderTax>({
		path: `/wp/v2/cr-folder`,
		method: 'POST',
		data: {
			name,
			slug: `${courseId}_${slug}`,
			parent: resource,
			meta: {
				cr_folder_course: courseId,
			},
		},
	});

	return resourceMapFolderTax(folder);
};

/**
 * Upload selected files.
 *
 * @param files    array of file data and selected title
 * @param resource parent folder (0 for root folder)
 * @param courseId course id
 * @return data of the created file resources
 */
export const uploadFilesAction = async (
	files: { name: string; file: File }[],
	resource: number,
	courseId: number
) => {
	const uploadedFiles = [];

	for (const file of files) {
		const formData = new FormData();
		formData.append('file', file.file);
		formData.append('course', String(courseId));
		formData.append('parent', String(resource));
		formData.append('title', file.name);

		const newFile = await apiFetch<Resource>({
			path: `/course-resources/v1/files`,
			method: 'POST',
			body: formData,
		});

		uploadedFiles.push(newFile);
	}

	return uploadedFiles;
};

/**
 * Move resources to folder action.
 *
 * @param resource destination parent folder id (0 for root folder)
 * @param moving   resources to be moved
 * @return data of the moved resources
 */
export const moveSelectionAction = async (
	resource: number,
	moving: Resource[]
) => {
	const movedResources: Resource[] = [];
	for (const res of moving) {
		if (res.type === 'folder') {
			const folder = await apiFetch<wp.FolderTax>({
				method: 'POST',
				path: `/wp/v2/cr-folder/${res.id}`,
				data: {
					name: res.name,
					parent: resource,
				},
			});

			movedResources.push(resourceMapFolderTax(folder));
		} else if (res.type === 'file') {
			const file = await apiFetch<wp.Media>({
				method: 'POST',
				path: `/wp/v2/cr-file/${res.id}`,
				data: {
					title: res.name,
					'cr-folder': resource !== 0 ? [resource] : [],
				},
			});

			movedResources.push(resourceMapMedia(file));
		}
	}

	return movedResources;
};

/**
 * Delete selection action.
 *
 * The selected files and folders are deleted recursivelly.
 *
 * @param selected selected resources
 * @return data of the deleted resources
 */
export const deleteSelectionAction = async (selected: Resource[]) => {
	const removedResources: Resource[] = [];
	for (const res of selected) {
		if (res.type === 'folder') {
			const response = await apiFetch<{
				deleted: boolean;
				previous: wp.FolderTax;
			}>({
				method: 'DELETE',
				path: `/wp/v2/cr-folder/${res.id}`,
				data: {
					force: true,
				},
			});

			if (response.deleted) {
				removedResources.push(resourceMapFolderTax(response.previous));
			}
		} else if (res.type === 'file') {
			const response = await apiFetch<{
				deleted: boolean;
				previous: wp.Media;
			}>({
				method: 'DELETE',
				path: `/wp/v2/cr-file/${res.id}`,
				data: {
					force: true,
				},
			});

			let file: wp.Media | null = null;
			if (response.deleted) {
				file = response.previous;
			}

			if (file) {
				removedResources.push(resourceMapMedia(file));
			}
		}
	}

	return removedResources;
};

/**
 * Map folder data from REST API to Resource format.
 *
 * @param folder folder data from REST API
 * @return mapped resource data
 */
function resourceMapFolderTax(folder: wp.FolderTax): Resource {
	return {
		type: 'folder',
		id: folder.id,
		name: folder.name,
		_count: {
			children: folder.count,
		},
		updatedAt: folder.meta.cr_folder_updated_at * 1000,
	};
}

/**
 * Map file data from REST API to Resource format.
 *
 * @param file file data from REST API
 * @return mapped resource data
 */
function resourceMapMedia(file: wp.Media): Resource {
	return {
		type: 'file',
		id: file.id,
		name: file.title.raw,
		fileData: {
			mimeType: file.mime_type,
			size: file.meta.cr_file_size,
			path: file.source_url,
		},
		updatedAt: file.modified_gmt,
	};
}
