import { Dialog } from '@headlessui/react';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import type { Resource } from '../../../lib/file-data-types';
import ResourceViewer from '../../common/ResourceViewer';
import { useFileManagerContext } from './FileManagerContext';

export default function FileManagerPreview() {
	const { preview, setPreview } = useFileManagerContext();
	const [fileData, setFileData] = useState<Resource | null>(null);

	useEffect(() => {
		if (preview) {
			apiFetch<Resource>({
				path: `/course-resources/v1/files/${preview}`,
			}).then((data) => setFileData(data));
		} else {
			setFileData(null);
		}
	}, [preview]);

	return (
		<Dialog
			open={preview !== null}
			onClose={() => setPreview(null)}
			className="tw-z-[100000] tw-absolute"
		>
			{fileData !== null && (
				<ResourceViewer
					fileData={fileData}
					onClose={() => setPreview(null)}
				/>
			)}
		</Dialog>
	);
}
