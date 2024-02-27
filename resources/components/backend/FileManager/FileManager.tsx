import FileManagerChildren from './FileManagerChildren';
import FileManagerError from './FileManagerError';
import FileManagerPreview from './FileManagerPreview';
import FileManagerToolbar from './FileManagerToolbar';

export default function FileManager() {
	return (
		<div className="tw-my-3">
			<FileManagerError />
			<FileManagerToolbar />
			<FileManagerChildren />
			<FileManagerPreview />
		</div>
	);
}
