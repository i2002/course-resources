import type { Resource } from '../../../lib/file-data-types';
import type wp from '../../../lib/wp-types';

/**
 * Add resource to folder resources array.
 *
 * @param resources older resources array
 * @param newRes    resource to be added
 * @return the new resource array
 */
export function addResource(resources: Resource[], newRes: Resource) {
	const exists = resources.find(
		(res) => res.id === newRes.id && res.type === newRes.type
	);

	if (!exists) {
		resources.push(newRes);
	}

	return resources;
}

/**
 * Remove resource from folder resources array.
 *
 * @param resources folder resources array
 * @param removed   resource to be removed
 * @return the new resource array
 */
export function removeResource(resources: Resource[], removed: Resource) {
	return resources.filter(
		(res) => res.id !== removed.id || res.type !== removed.type
	);
}

/**
 * Replace old resource with new one.
 *
 * @param resources   folder resources array
 * @param oldResource resource to be removed
 * @param newResource resource to be added in its place
 * @return the new resource array
 */
export function replaceResource(
	resources: Resource[],
	oldResource: Resource,
	newResource: Resource
) {
	const index = resources.findIndex(
		(res) => res.id === oldResource.id && res.type === oldResource.type
	);

	if (index !== -1) {
		resources[index] = newResource;
	}

	return resources;
}

/**
 * Comparator for sorting files after basename (without extension).
 *
 * @param a first filename
 * @param b second filename
 * @return -1 if a < b, 1 if a > b or 0 if a === b
 */
export function filenameComparator(a: string, b: string) {
	if (fileName(a) < fileName(b)) {
		return -1;
	} else if (fileName(a) > fileName(b)) {
		return 1;
	}
	return 0;
}

/**
 * Comparator for sorting resources.
 *
 * Folders before files, and sorting after basename (without extension) for resources of the same type.
 *
 * @param resA first resource
 * @param resB second resource
 * @return -1 if resA < resB, 1 if resA > resB or 0 if resA === resB
 */
export function resourceComparator(resA: Resource, resB: Resource) {
	if (resA.type > resB.type) {
		return -1;
	} else if (resA.type < resB.type) {
		return 1;
	}

	if (fileName(resA.name).toLowerCase() < fileName(resB.name).toLowerCase()) {
		return -1;
	} else if (
		fileName(resA.name).toLowerCase() > fileName(resB.name).toLowerCase()
	) {
		return 1;
	}

	if (fileName(resA.name) < fileName(resB.name)) {
		return -1;
	} else if (fileName(resA.name) > fileName(resB.name)) {
		return 1;
	}

	return 0;
}

/**
 * Ensure attachment names are unique within parent folder.
 *
 * @param attachments attachments array from WP media frame
 * @param resources   folder resources array
 * @return array of ids and unique names for the new attachments
 */
export function prepareAttachmentData(
	attachments: wp.Attachment[],
	resources: Resource[]
) {
	const nameList = resources.map((res) => res.name);
	return attachments.map((attachment) => {
		let name = attachment.title;
		if (fileExt(attachment.filename) !== fileExt(attachment.title)) {
			name += fileExt(attachment.filename);
		}
		name = uniqueFilename(nameList, name);
		nameList.push(name);

		return {
			id: attachment.id,
			name,
		};
	});
}

/**
 * Ensure moved resources have unique names in destination parent folder.
 *
 * @param moving    resources to be moved
 * @param resources destination folder resources array
 * @return array of moving resources with unique names
 */
export function prepareMovingData(moving: Resource[], resources: Resource[]) {
	const nameList = resources.map((res) => res.name);

	return moving.map((res) => {
		res.name = uniqueFilename(nameList, res.name);
		nameList.push(res.name);
		return res;
	});
}

/**
 * Get file extension from filename.
 *
 * @param name filename
 * @return extension of the file name (including dot)
 */
function fileExt(name: string) {
	const extIndex = name.lastIndexOf('.');
	return extIndex !== -1 ? name.substring(extIndex) : '';
}

/**
 * Get base file name (without extension).
 *
 * @param name filename
 * @return basefilename (without extension)
 */
function fileName(name: string) {
	const extIndex = name.lastIndexOf('.');
	return extIndex !== -1 ? name.substring(0, extIndex) : name;
}

/**
 * Get unique filename variation in list of filenames.
 *
 * The filename variation includes an increment right before file extension.
 *
 * @param nameList    list of file names
 * @param initialName initial name of the file
 * @return unique filename within the list of names
 */
function uniqueFilename(nameList: string[], initialName: string) {
	nameList.sort(filenameComparator);

	const ext = fileExt(initialName);
	const filename = fileName(initialName);
	let count = 0;
	let name = initialName;

	for (const res of nameList) {
		if (res === name) {
			count++;
			name = `${filename}-${count}${ext}`;
		}
	}

	return name;
}
