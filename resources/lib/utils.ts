import type { Resource } from './file-data-types';

/**
 * Human readable file size format.
 *
 * @param bytes file size in bytes
 * @return the formatted file size
 */
const formatSize = (bytes: number) => {
	if (bytes === 0) {
		return '0.00 B';
	}

	const exp = Math.floor(Math.log(bytes) / Math.log(1024));
	bytes = bytes - (bytes % 1024);
	const base = (bytes / Math.pow(1024, exp)).toFixed(exp > 1 ? 2 : 0);
	const unit = ' KMGTP'.charAt(exp) + 'B';
	return `${base} ${unit}`;
};

/**
 * Get formatted resource size.
 *
 * @param res resource
 * @return the formatted resource size
 */
export function getResSize(res: Resource) {
	return res.type === 'folder'
		? res._count?.children ?? 0
		: formatSize(res.fileData?.size ?? 0);
}

/**
 * Get formatted resource updated timestamp.
 *
 * @param res     resource
 * @param context context of the string (full means to return full datetime formatted string to show in tooltip, display shows only formatted date string)
 * @return the formatted resource updated timestamp
 */
export function getResDate(
	res: Resource,
	context: 'full' | 'display' = 'display'
) {
	let updatedAt = res.updatedAt;
	if (typeof updatedAt === 'string') {
		updatedAt += 'Z';
	}

	return new Date(updatedAt).toLocaleString(
		'ro-RO',
		context === 'display'
			? {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				}
			: undefined
	);
}
