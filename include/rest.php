<?php

/**
 * Register course resources REST API.
 *
 * @since 0.1.0
 */
function cr_rest_init()
{
	// Auth routes
	register_rest_route( 'course-resources/v1', '/login', array(
		'methods'             => 'POST',
		'callback'            => 'cr_rest_login',
		'permission_callback' => '__return_true'
	) );

	register_rest_route( 'course-resources/v1', '/logout', array(
		'methods'             => 'POST',
		'callback'            => 'cr_rest_logout',
		'permission_callback' => '__return_true'
	) );

	register_rest_route( 'course-resources/v1', '/user-info', array(
		'methods'  => 'GET',
		'callback' => 'cr_rest_user_info',
		'permission_callback' => '__return_true'
	) );

	// Data routes
	register_rest_route( 'course-resources/v1', '/courses', array(
		'methods'  => 'GET',
		'callback' => 'cr_rest_get_courses',
		'permission_callback' => 'cr_rest_courses_permission'
	) );

	register_rest_route( 'course-resources/v1', '/courses/(?P<course_id>\d+)', array(
		'methods'  => 'GET',
		'callback' => 'cr_rest_get_course',
		'permission_callback' => 'cr_rest_course_permission'
	) );

	register_rest_route( 'course-resources/v1', '/(?P<course_id>\d+)(?:/(?P<parent_id>\d+))?', array(
		'methods'             => 'GET',
		'callback'            => 'cr_rest_get_folder_data',
		'permission_callback' => 'cr_rest_course_permission',
		'args'                => array(
			'course_id' => array(
				'validate_callback' => function($param, $request, $key) {
					return is_numeric( $param );
				},
				'required' => true
			),
			'parent_id' => array(
				'validate_callback' => function($param, $request, $key) {
					return is_numeric( $param );
				},
				'default' => 0
			)
		)
	) );

	register_rest_route( 'course-resources/v1', '/files', array(
		'methods' => 'POST',
		'callback' => 'cr_rest_upload_file',
		'permission_callback' => 'cr_rest_upload_file_permission'
	) );

	register_rest_route( 'course-resources/v1', '/files/(?P<file_id>\d+)', array(
		'method' => 'GET',
		'callback' => 'cr_rest_get_file',
		'permission_callback' => 'cr_rest_get_file_permission',
		'args'                => array(
			'file_id' => array(
				'validate_callback' => function($param, $request, $key) {
					return is_numeric( $param );
				},
				'required' => true
			)
		)
	) );

	// Add fields to file response
	add_filter( 'rest_prepare_' . CR_FILE_TYPE, 'cr_rest_set_file_fields', 10, 2 );
}

function cr_rest_get_file_permission( $request )
{
	$file = get_post( (int) $request['file_id'] );

	if ( ! $file || $file->post_type !== CR_FILE_TYPE ) {
		return new WP_Error( 'cr_rest_not_found', 'File not found.', array( 'state' => 404 ) );
	}

	$course_id = $file->post_parent;

	// permit requests from admin page
	if ( current_user_can( 'manage_options' ) ) {
		return true;
	}

	$email = cr_get_current_student();

	if ( ! $email ) {
		return new WP_Error( 'cr_rest_unauth', 'You need to log in to access this.', array( 'state' => 401 ) );
	}

	$permission = cr_is_student_enrolled( $email, $course_id );

	if ( $permission === false ) {
		return new WP_error( 'cr_rest_forbidden', 'You are not enrolled in this course.', array( 'state' => 403 ) );
	}

	return true;
}

/**
 * Get file data.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
function cr_rest_get_file( $request )
{
	$file = get_post( $request['file_id'] );

	if ( ! $file || $file->post_type !== CR_FILE_TYPE ) {
		return new WP_Error( 'cr_rest_invalid_param', __( 'Invalid file ID' ) ); // FIXME: text domain
	}

	return rest_ensure_response( cr_prepare_file_response( $file ) );
}

/**
 * Check if user has permissions to upload file.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return bool|WP_Error
 */
function cr_rest_upload_file_permission( $request )
{
	$post_type = get_post_type_object( CR_FILE_TYPE );

	if ( ! current_user_can( $post_type->cap->create_posts ) ) {
		return new WP_Error(
			'rest_cannot_create',
			__( 'Sorry, you are not allowed to create files as this user.' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	if ( ! current_user_can( 'upload_files' ) ) {
		return new WP_Error(
			'rest_cannot_create',
			__( 'Sorry, you are not allowed to upload files on this site.' ),
			array( 'status' => 400 )
		);
	}

	if ( ! empty( $request['course'] ) && ! current_user_can( 'edit_post', (int) $request['course'] ) ) {
		return new WP_Error(
			'rest_cannot_edit',
			__( 'Sorry, you are not allowed to upload files to this course.' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	return true;
}

/**
 * Insert file REST route handler.
 *
 * It uploads the file to the server and creates file post data.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function cr_rest_upload_file( $request )
{
	$ret = cr_check_upload_file_params( $request );
	if ( is_wp_error( $ret ) ) {
		return $ret;
	}

	add_filter( 'upload_dir', 'cr_file_uploads_dir' );

	$file = cr_insert_file( $request );
	if ( is_wp_error( $file ) ) {
		return $file;
	}

	remove_filter( 'upload_dir', 'cr_file_upload_dir' );

	return rest_ensure_response( cr_prepare_file_response( $file ) );
}

/**
 * Check if upload file request required parameters are present and valid.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return bool|WP_Error
 */
function cr_check_upload_file_params( $request )
{
	if ( ! isset( $request['parent'] ) ) {
		return new WP_Error( 'cr_rest_required_param', __( 'File parent required.' ), array( 'status' => 400 ) ); // FIXME: text domain
	} else if ( (int) $request['parent'] !== 0 ) {
		$parent = get_term( $request['parent'], CR_FOLDER_TAX );

		if ( is_null( $parent ) || is_wp_error( $parent ) ) {
			return new WP_Error( 'cr_rest_invalid_param', __( 'Invalid parent folder.' ), array( 'status' => 400 ) ); // FIXME: text domain
		}
	}

	if ( empty( $request['course'] ) ) {
		return new WP_Error('cr_rest_required_param', __( 'Course ID required.' ), array( 'status' => 400 ) ); // FIXME: text domain
	} else if ( get_post_type( $request['course'] ) !== CR_COURSE_TYPE ) {
		return new WP_Error('cr_rest_invalid_param', __( 'Invalid course.' ), array( 'status' => 400 ) ); // FIXME: text domain
	}

	if ( empty( $request['title'] ) ) {
		return new WP_Error( 'cr_rest_required_param', __( 'File title required.' ), array( 'status' => 400 ) ); // FIXME: text domain
	}

	return true;
}

/**
 * Upload file into the correct folder and create file data post.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return array|WP_Error
 */
function cr_insert_file( $request )
{
	// Get the file via $_FILES or raw data.
	$files   = $request->get_file_params();
	$headers = $request->get_headers();

	require_once 'upload.php';

	if ( ! empty( $files ) ) {
		$file = cr_upload_from_file( $files, $headers );
	} else {
		$file = cr_upload_from_data( $request->get_body(), $headers );
	}

	if ( is_wp_error( $file ) ) {
		return $file;
	}

	$name       = wp_basename( $file['file'] );
	$name_parts = pathinfo( $name );
	$name       = trim( substr( $name, 0, -( 1 + strlen( $name_parts['extension'] ) ) ) );

	$type = $file['type'];
	$file = $file['file'];

	$file_data = array(
		'post_title'     => wp_strip_all_tags( $request['title'] ),
		'post_content'   => '',
		'post_type'      => CR_FILE_TYPE,
		'post_parent'    => $request['course'],
		'post_mime_type' => $type,
		'post_status'    => 'inherit',
		'ping_status'    => 'closed',
		'tax_input'      => array(
			CR_FOLDER_TAX => $request['parent'] !== 0 ? array($request['parent']) : array()
		),
		'meta_input'     => array(
			CR_FILE_NAME_META => basename( $file ),
			CR_FILE_SIZE_META => filesize( $file ),
			CR_FILE_MIME_META => $type
		)
	);

	$id = wp_insert_post( $file_data );

	if ( is_wp_error( $id ) ) {
		if ( 'db_update_error' === $id->get_error_code() ) {
			$id->add_data( array( 'status' => 500 ) );
		} else {
			$id->add_data( array( 'status' => 400 ) );
		}

		return $id;
	}

	return get_post( $id );
}

/**
 * Change upload dir for files.
 *
 * @param array $upload_dir
 * @return array
 */
function cr_file_uploads_dir( $upload_dir )
{
	$course_id = $_REQUEST['course'];

	$path = cr_file_get_upload_path( $course_id );

	$upload_dir['path'] = $upload_dir['basedir'] . '/' . $path;
	$upload_dir['url'] = $upload_dir['baseurl'] . '/' . $path;

	return $upload_dir;
}

/**
 * Login student request.
 *
 * Send email with login link.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function cr_rest_login( $request )
{
	if ( ! isset( $request['email'] ) || ! isset( $request['callbackUrl'] ) ) {
		return new WP_Error( 'cr_rest_auth_bad_request', 'Bad request', array( 'status' => 400 ) );
	}

	$email = sanitize_email( $request['email'] );
	$redirect_url = sanitize_url( $request['callbackUrl'] );

	if ( $email === '' || ! is_email( $email ) || $redirect_url === '' ) {
		return new WP_Error( 'cr_rest_auth_bad_request', 'Bad request', array( 'status' => 400 ) );
	}

	// student already logged in
	if ( cr_get_current_student() !== false ) {
		return rest_ensure_response( array(
			'success' => true,
			'code' => 'already_signedin'
		) );
	}

	// send email with login link
	$ret = cr_auth_login_request( $email, $redirect_url );

	if ( is_wp_error( $ret ) ) {
		return $ret;
	}

	return rest_ensure_response( array(
		'success' => true,
		'code' => 'email_sent'
	) );
}

/**
 * Clear student auth cookie.
 *
 * @since 0.1.0
 *
 * @return WP_REST_Response
 */
function cr_rest_logout()
{
	cr_auth_logout();
	return rest_ensure_response( array( 'success' => true ) );
}

/**
 * Get logged in student data.
 *
 * @since 0.1.0
 *
 * @return WP_REST_Response|WP_Error
 */
function cr_rest_user_info()
{
	$student = cr_get_current_student();

	if ( $student == false ) {
		return new WP_Error( 'cr_rest_unauth', 'You need to log in to access this.', array( 'status' => 401 ) );
	}

	$data = array(
		'email' => $student
	);

	return rest_ensure_response( $data );
}

/**
 * Check permission to access course list.
 *
 * Only logged in students can access their student list.
 *
 * @since 0.1.0
 *
 * @return bool
 */
function cr_rest_courses_permission()
{
	return cr_get_current_student() !== false;
}

/**
 * Get courses current student is enrolled to.
 *
 * @since 0.1.0
 *
 * @return WP_REST_Response
 */
function cr_rest_get_courses()
{
	$email = cr_get_current_student();

	if ( ! $email ) {
		return new WP_Error('cr_rest_unauth', 'You need to log in to access this.', array( 'state' => 401 ) );
	}

	$courses = cr_get_student_courses( $email );

	return rest_ensure_response( array_map( 'cr_prepare_course_response', $courses ) );
}

/**
 * Check permission to access course data and files.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return bool|WP_Error
 */
function cr_rest_course_permission( $request )
{
	$course_id = (int) $request['course_id'];

	// permit requests from admin page
	if ( current_user_can( 'manage_options' ) ) {
		return true;
	}

	$email = cr_get_current_student();

	if ( ! $email ) {
		return new WP_Error( 'cr_rest_unauth', 'You need to log in to access this.', array( 'state' => 401 ) );
	}

	$permission = cr_is_student_enrolled( $email, $course_id );

	if ( $permission === false ) {
		return new WP_error( 'cr_rest_forbidden', 'You are not enrolled in this course.', array( 'state' => 403 ) );
	}

	return true;
}

/**
 * Get course data.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
function cr_rest_get_course( $request )
{
	$course = cr_get_course( $request['course_id'] );

	if ( is_wp_error( $course ) ) {
		return $course;
	}

	return rest_ensure_response( cr_prepare_course_response( $course ) );
}

/**
 * Get course folder children and path.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Request $request the request object
 * @return WP_REST_Response
 */
function cr_rest_get_folder_data( $request )
{
	$course = cr_get_course( $request['course_id'] );
	if ( is_wp_error( $course ) ) {
		return $course;
	}

	$parent = cr_get_parent_folder( $request['parent_id'] );
	if ( is_wp_error( $parent ) ) {
		return $parent;
	}

	// check parent folder has the same course_id
	if ( $parent !== 0 ) {
		if ( (int) get_term_meta( $parent->term_id, CR_FOLDER_COURSE_META, true ) !== $course->ID ) {
			return new WP_Error( 'cr_rest_course_invalid_folder', __( 'Invalid folder ID.' ), array( 'status' => 404 ) );
		}
	}

	$path = cr_get_folder_path( $parent );
	$subfolders = cr_get_child_folders( $course, $parent );
	$files = cr_get_child_files( $course, $parent );

	$children = array(
		...cr_prepare_child_folders_response( $subfolders ),
		...cr_prepare_child_files_response( $files )
	);

	return rest_ensure_response( array(
		'path' => $path,
		'children' => $children
	) );
}

/**
 * Add source URL and mime type fields to file response.
 *
 * @since 0.1.0
 *
 * @param WP_REST_Response $response
 * @param WP_Post $file
 * @return string
 */
function cr_rest_set_file_fields( $response, $file )
{
	$response->data['source_url'] = cr_file_get_url( $file->ID );
	$response->data['mime_type'] = $file->post_mime_type;
	return $response;
}

/**
 * Get course by id or error for REST response.
 *
 * @param int $id
 * @return WP_Post|WP_Error
 */
function cr_get_course( $id )
{
	$error = new WP_Error( 'cr_rest_course_invalid_id', __( 'Invalid course ID.' ), array( 'status' => 404 ) ); // FIXME: text domain

	if ( (int) $id <= 0 ) {
		return $error;
	}

	$course = get_post( (int) $id );
	if ( empty( $course ) || empty( $course->ID ) || CR_COURSE_TYPE !== $course->post_type ) {
		return $error;
	}

	return $course;
}

/**
 * Get folder by id or error for REST response.
 *
 * @param int $id
 * @return WP_Term|int|WP_Error
 */
function cr_get_parent_folder( $id )
{
	$error = new WP_Error( 'cr_rest_term_invalid_id', __( 'Invalid parent folder ID.' ), array( 'status' => 404 ) ); // FIXME: text domain

	if ( (int) $id == 0 ) {
		return 0;
	}

	if ( (int) $id <= 0 ) {
		return $error;
	}

	$parent = get_term( (int) $id );
	if ( empty( $parent ) || empty( $parent->term_id ) || CR_FOLDER_TAX !== $parent->taxonomy ) {
		return $error;
	}

	return $parent;
}

/**
 * Prepare course data for REST response.
 *
 * The REST response contains the following fields:
 * - id
 * - name
 *
 * @since 0.1.0
 *
 * @param WP_Post $course course custom post
 * @return array
 */
function cr_prepare_course_response( $course ) {
	return array(
		'id' => $course->ID,
		'name' => $course->post_title
	);
}

/**
 * Prepare subfolders data for REST response.
 *
 * @since 0.1.0
 *
 * @param WP_Term[] $subfolders
 * @return array
 */
function cr_prepare_child_folders_response( $subfolders )
{
	$children = array();

	foreach ( $subfolders as $folder ) {
		$updatedAt = ( (int) get_term_meta( $folder->term_id, CR_FOLDER_UPDATED_META, true ) ) * 1000;
		if ( ! isset( $updatedAt ) || $updatedAt === '' ) {
			$updatedAt = 0;
		}

		$children[] = array(
			'type'   => 'folder',
			'id'     => $folder->term_id,
			'name'   => $folder->name,
			'_count' => array( 'children' => $folder->count ),
			'updatedAt' => $updatedAt
		);
	}

	return $children;
}

/**
 * Prepare files data for REST response.
 *
 * @since 0.1.0
 *
 * @param WP_Post[] $files
 * @return array
 */
function cr_prepare_child_files_response( $files )
{
	$children = array();

	foreach ( $files as $file ) {
		$children[] = cr_prepare_file_response( $file );
	}

	return $children;
}

/**
 * Prepare file data for REST response.
 *
 * The rest response contains the following fields:
 * - type: file
 * - id
 * - name
 * - fileData (mimeType, size, path)
 * - updatedAt
 *
 * @since 0.1.0
 *
 * @param WP_Post $file
 * @return array
 */
function cr_prepare_file_response( $file )
{
	$file_url = cr_file_get_url( $file->ID );

	return array(
		'type' => 'file',
		'id'   => $file->ID,
		'name' => "$file->post_title",
		'fileData' => array(
			'mimeType' => $file->post_mime_type,
			'size'     => get_post_meta( $file->ID, CR_FILE_SIZE_META, true ),
			'path'     => $file_url
		),
		'updatedAt' =>  mysql_to_rfc3339( $file->post_modified_gmt )
	);
}
