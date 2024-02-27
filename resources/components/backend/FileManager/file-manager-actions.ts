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
			path: `/wp/v2/media/${renamed.id}`,
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
				course: courseId,
			},
		},
	});

	return resourceMapFolderTax(folder);
};

/**
 * Insert attachments to folder.
 *
 * @param attachments list of attachments to be added
 * @param resource    parent folder (0 for root folder)
 * @param courseId    course id
 * @return data of the new files
 */
export const attachMediaAction = async (
	attachments: Array<{ id: number; name: string }>,
	resource: number,
	courseId: number
) => {
	const attachedFiles: Resource[] = [];
	for (const attachment of attachments) {
		const res = await apiFetch<wp.Media>({
			method: 'POST',
			path: `/wp/v2/media/${attachment.id}`,
			data: {
				title: attachment.name,
				post: courseId,
				'cr-folder': resource !== 0 ? [resource] : [],
			},
		});

		attachedFiles.push(resourceMapMedia(res));
	}

	return attachedFiles;
};

export const uploadFile = async (
	files: FileList,
	resource: number,
	courseId: number,
	state: FolderData
) => {
	const formData = new FormData();
	formData.append('file', files[0]);
	formData.append('courseId', String(courseId));
	formData.append('parentId', String(resource) ?? '');

	if (state.children.find((res) => res.name === files[0].name)) {
		throw new Error('Numele fișierului selectat nu este unic.');
	}

	const res = await fetch('/api/upload', {
		method: 'POST',
		body: formData,
	});

	const data = await res.json();
	if (data.error !== undefined) {
		throw new Error(data.error);
	}

	return data.data;
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
				path: `/wp/v2/media/${res.id}`,
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
 * If deleteAttachments argument is true, the attachments in the deletion tree will be deleted.
 * If it is false, they will be unlinked from course but still remain in Media Library.
 *
 * @param selected          selected resources
 * @param deleteAttachments whether to delete attachments or unlink them
 * @return data of the deleted resources
 */
export const deleteSelectionAction = async (
	selected: Resource[],
	deleteAttachments: boolean
) => {
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
					deleteAttachments,
				},
			});

			if (response.deleted) {
				removedResources.push(resourceMapFolderTax(response.previous));
			}
		} else if (res.type === 'file') {
			let file: wp.Media | null = null;
			if (deleteAttachments) {
				const response = await apiFetch<{
					deleted: boolean;
					previous: wp.Media;
				}>({
					method: 'DELETE',
					path: `/wp/v2/media/${res.id}`,
					data: {
						force: true,
					},
				});

				if (response.deleted) {
					file = response.previous;
				}
			} else {
				file = await apiFetch<wp.Media>({
					method: 'POST',
					path: `/wp/v2/media/${res.id}`,
					data: {
						post: 0,
						'cr-folder': [],
					},
				});
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
		updatedAt: folder.meta.updatedAt * 1000,
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
			size: file.media_details.filesize,
			path: file.source_url,
		},
		updatedAt: file.modified_gmt,
	};
}
