import { User } from "./auth-types";
import { Course } from "./file-data-types";

export type FrontendInitialData = {
	loaderData: {
		root: User;
		home: Course[];
	},
	errors?: {
		root: Error;
	}
}