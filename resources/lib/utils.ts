import type { Resource } from './file-data-types';

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

export function getResSize(res: Resource) {
	return res.type === 'folder'
		? res._count?.children ?? 0
		: formatSize(res.fileData?.size ?? 0);
}

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
