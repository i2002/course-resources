import { RouterProvider, createHashRouter } from 'react-router-dom';
import type { FrontendInitialData } from '../../lib/hydration-types';
import '../../styles/frontend.css';
import LoginView from './auth/LoginView';
import CourseView, { courseLoader } from './course/CourseView';
import FileView, { fileLoader } from './course/file/FileView';
import FolderLoading from './course/folder/FolderLoading';
import FolderView, { folderLoader } from './course/folder/FolderView';
import HomeView, { homeLoader } from './home/HomeView';
import AppError from './root/AppError';
import RootLayout, { authLoader } from './root/RootLayout';

const paths = [
	{
		path: '/',
		loader: authLoader,
		element: <RootLayout />,
		errorElement: <AppError />,
		id: 'root',
		children: [
			{
				index: true,
				id: 'home',
				element: <HomeView />,
				loader: homeLoader,
			},
			{
				path: 'course/:courseId',
				element: <CourseView />,
				loader: courseLoader,
				HydrateFallback: FolderLoading,
				id: 'course',
				children: [
					{
						index: true,
						element: <FolderView />,
						loader: folderLoader,
					},
					{
						path: 'folder/:folderId',
						element: <FolderView />,
						loader: folderLoader,
					},
					{
						path: 'file/:fileId',
						element: <FileView />,
						loader: fileLoader,
					},
				],
			},
		],
	},
	{
		path: '/login',
		element: <LoginView />,
	},
];

export const createRouter = (initial: FrontendInitialData | undefined) =>
	createHashRouter(paths, {
		hydrationData: initial,
		future: {
			v7_partialHydration: true,
		},
	});

export default function FrontendApp({
	router,
}: {
	router: ReturnType<typeof createHashRouter>;
}) {
	return <RouterProvider router={router} />;
}
