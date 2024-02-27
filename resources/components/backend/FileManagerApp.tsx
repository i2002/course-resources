import FileManager from './FileManager/FileManager';
import { FileManagerProvider } from './FileManager/FileManagerContext';

type Props = {
	courseId: number;
};

export default function FileManagerApp({ courseId }: Props) {
	return (
		<div className="tw-bg-white">
			<FileManagerProvider courseId={courseId}>
				<FileManager></FileManager>
			</FileManagerProvider>
		</div>
	);
}
