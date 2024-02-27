import { DocumentIcon, FolderIcon } from '@heroicons/react/20/solid';

interface ResourceIconProps extends React.ComponentPropsWithoutRef<'svg'> {
	type: string;
}

export default function ResourceIcon({ type, ...props }: ResourceIconProps) {
	switch (type) {
		case 'folder':
			return <FolderIcon {...props}></FolderIcon>;
		case 'file':
		default:
			return <DocumentIcon {...props}></DocumentIcon>;
	}
}
