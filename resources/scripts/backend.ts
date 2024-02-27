import { createElement, createRoot } from '@wordpress/element';
import FileManagerApp from '../components/backend/FileManagerApp';
import StudentEnrolmentApp from '../components/backend/StudentEnrolmentApp';
import '../styles/backend.css';

const fileManagerRoot = document.getElementById('course-files-app');
if (fileManagerRoot) {
	const courseId = parseInt(fileManagerRoot.dataset?.courseId ?? '');
	createRoot(fileManagerRoot).render(
		createElement(FileManagerApp, { courseId })
	);
}

const studentEnrolmentRoot = document.getElementById('student-enrolment-app');
if (studentEnrolmentRoot) {
	const courseId = parseInt(studentEnrolmentRoot.dataset?.courseId ?? '');
	createRoot(studentEnrolmentRoot).render(
		createElement(StudentEnrolmentApp, { courseId })
	);
}
