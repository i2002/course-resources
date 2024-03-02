import { useEffect } from '@wordpress/element';
import type { Resource } from '../../../lib/file-data-types';
import ImageViewer from './ImageViewer';
import PDFViewer from './PDFViewer';
import ResourceViewerHeader from './ResourceViewerHeader';
import TextViewer from './TextViewer';

type Props = {
	fileData: Resource;
	onClose: () => void;
};

export default function ResourceViewer({ fileData, onClose }: Props) {
	const name = fileData.name;
	const resUrl = fileData.fileData?.path ?? '';

	useEffect(() => {
		// prevent outer scroll when modal active
		document.body.style.overflow = 'hidden';
	}, []);

	const onCloseHandler = () => {
		// restore body scroll
		document.body.style.overflow = '';
		onClose();
	};

	if (fileData.fileData?.mimeType === 'application/pdf') {
		return (
			<PDFViewer name={name} resUrl={resUrl} onClose={onCloseHandler} />
		);
	} else if (fileData.fileData?.mimeType.startsWith('image/')) {
		return (
			<ImageViewer name={name} resUrl={resUrl} onClose={onCloseHandler} />
		);
	} else if (fileData.fileData?.mimeType.startsWith('text/')) {
		return (
			<TextViewer name={name} resUrl={resUrl} onClose={onCloseHandler} />
		);
	}
	return (
		<ResourceViewerHeader name={name} onClose={onCloseHandler}>
			<div className="tw-absolute tw-text-center tw-m-auto tw-top-0 tw-bottom-0 tw-left-0 tw-right-0 tw-max-w-sm tw-h-24 tw-bg-white tw-rounded tw-p-3">
				<p className="tw-mb-3">
					Resursa specificată nu poate fi previzualizată.
				</p>
				<a href={resUrl}>
					<button className="tw-button-primary" color="teal">
						Descărcare resursă
					</button>
				</a>
			</div>
		</ResourceViewerHeader>
	);
}