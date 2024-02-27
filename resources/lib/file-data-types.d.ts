
export type ResourcePath = Array<{
	id: number;
	name: string;
}>;

export type Resource = {
	id: number;
	name: string;
	type: 'folder' | 'file';
	updatedAt: string | number;
	fileData?: {
		mimeType: string;
		size: number;
		path: string;
	},
	_count?: {
		children: number;
	}
};

export type FolderData = {
	path: ResourcePath;
	children: Resource[];
}

export type Course = {
	id: number;
	name: string;
}
