import type { Dispatch, SetStateAction } from "react";
import { Resource, ResourcePath } from "../../../lib/file-data-types";
import wp from "../../../lib/wp-types";

export type FileManagerContextType = {
	courseId: number;
	parent: number;
	resources: Resource[];
	path: ResourcePath;
	preview: number | null;
	loading: boolean;
	error: string | undefined;
	selected: Resource[];
	moving: number;
	setParent: (parent: number) => void;
	setPreview: (preview: number | null) => void;
	setSelected: Dispatch<SetStateAction<Resource[]>>;
	dismissError: () => void;
	addFolder: (name: string) => void;
	attachMedia: (attachments: wp.Attachment[]) => void;
	refresh: () => void;
  // uploadFile: (files: FileList) => void;
	renameResource: (newName: string, renamed: Resource) => void;
	deleteSelection: (deleteAttachments: boolean) => void;
	startMoveSelection: () => void;
	cancelMoveSelection: () => void;
	endMoveSelection: () => void;
}