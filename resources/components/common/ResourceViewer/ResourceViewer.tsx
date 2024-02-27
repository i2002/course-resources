import { useEffect } from '@wordpress/element';
import wp from '../../../lib/wp-types';
import ImageViewer from './ImageViewer';
import PDFViewer from './PDFViewer';
import ResourceViewerHeader from './ResourceViewerHeader';
import TextViewer from './TextViewer';

type Props = {
	fileData: wp.Media;
	onClose: () => void;
};

export default function ResourceViewer({ fileData, onClose }: Props) {
	const name = fileData.title.rendered;
	const resUrl = fileData.source_url;

	useEffect(() => {
		// prevent outer scroll when modal active
		document.body.style.overflow = 'hidden';
	}, []);

	const onCloseHandler = () => {
		// restore body scroll
		document.body.style.overflow = '';
		onClose();
	};

	if (fileData.mime_type === 'application/pdf') {
		return (
			<PDFViewer name={name} resUrl={resUrl} onClose={onCloseHandler} />
		);
	} else if (fileData.mime_type.startsWith('image/')) {
		return (
			<ImageViewer name={name} resUrl={resUrl} onClose={onCloseHandler} />
		);
	} else if (fileData.mime_type.startsWith('text/')) {
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
