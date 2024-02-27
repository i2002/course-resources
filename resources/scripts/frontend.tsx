import { createRoot } from '@wordpress/element';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import LoginView, { loginLoader } from '../components/frontend/auth/LoginView';
import CourseView, {
	courseLoader,
} from '../components/frontend/course/CourseView';
import FileView, {
	fileLoader,
} from '../components/frontend/course/file/FileView';
import FolderView, {
	folderLoader,
} from '../components/frontend/course/folder/FolderView';
import HomeView, { homeLoader } from '../components/frontend/home/HomeView';
import AppError from '../components/frontend/root/AppError';
import RootLayout, { authLoader } from '../components/frontend/root/RootLayout';
import '../styles/frontend.css';

const router = createHashRouter([
	{
		path: '/',
		loader: authLoader,
		element: <RootLayout />,
		errorElement: <AppError />,
		id: 'root',
		children: [
			{
				index: true,
				element: <HomeView />,
				loader: homeLoader,
			},
			{
				path: 'course/:courseId',
				element: <CourseView />,
				loader: courseLoader,
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
		loader: loginLoader,
		element: <LoginView />,
	},
]);

const root = document.getElementById('cr-frontend-app');
if (root) {
	createRoot(root).render(<RouterProvider router={router} />);
}
