import { Dialog } from '@headlessui/react';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import type wp from '../../../lib/wp-types';
import ResourceViewer from '../../common/ResourceViewer';
import { useFileManagerContext } from './FileManagerContext';

export default function FileManagerPreview() {
	const { preview, setPreview } = useFileManagerContext();
	const [fileData, setFileData] = useState<wp.Media | null>(null);

	useEffect(() => {
		if (preview) {
			apiFetch<wp.Media>({
				path: `/wp/v2/media/${preview}`,
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
