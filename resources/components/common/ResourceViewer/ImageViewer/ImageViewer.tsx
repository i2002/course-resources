import ResourceViewerHeader from '../ResourceViewerHeader';

interface Props {
	name: string;
	resUrl: string;
	onClose: () => void;
}

export default function ImageViewer({ name, resUrl, onClose }: Props) {
	return (
		<ResourceViewerHeader name={name} url={resUrl} onClose={onClose}>
			<div className="tw-relative tw-h-screen tw-w-full">
				<img
					alt={name}
					src={resUrl}
					className="tw-object-contain tw-w-svw tw-h-full tw-absolute"
				/>
			</div>
		</ResourceViewerHeader>
	);
}
