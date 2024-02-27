import ResourceViewerHeader from '../ResourceViewerHeader';
import PDFViewerContent from './PDFViewerContent';
import { PDFViewerProvider } from './PDFViewerContext';
import PDFViewerToolbar from './PDFViewerToolbar';

interface Props {
	name: string;
	resUrl: string;
	onClose: () => void;
}

export default function PDFViewer({ name, resUrl, onClose }: Props) {
	return (
		<PDFViewerProvider>
			<ResourceViewerHeader
				name={name}
				toolbar={<PDFViewerToolbar />}
				onClose={onClose}
			>
				<PDFViewerContent resUrl={resUrl} />
			</ResourceViewerHeader>
		</PDFViewerProvider>
	);
}
