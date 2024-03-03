import ResourceViewerHeader from '../ResourceViewerHeader';

interface Props {
	name: string;
	resUrl: string;
	onClose: () => void;
}

export default function IFrameViewer({ name, resUrl, onClose }: Props) {
	return (
		<ResourceViewerHeader name={name} url={resUrl} onClose={onClose}>
			<iframe
				title={name}
				src={resUrl}
				className="tw-w-full tw-h-full"
				sandbox=""
			></iframe>
		</ResourceViewerHeader>
	);
}
