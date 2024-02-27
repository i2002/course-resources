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
 *
 */
function cr_rest_get_course( $request )
{
	$course = cr_get_course( $request['course_id'] );

	if ( is_wp_error( $course ) ) {
		return $course;
	}

	return cr_prepare_course_response( $course );
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
 * Get course by id or error for REST response.
 *
 * @param int $id
 * @return WP_Post|WP_Error
 */
function cr_get_course( $id )
{
	$error = new WP_Error( 'cr_rest_course_invalid_id', __( 'Invalid course ID.' ), array( 'status' => 404 ) );

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
	$error = new WP_Error( 'cr_rest_term_invalid_id', __( 'Invalid parent folder ID.' ), array( 'status' => 404 ) );

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
		$meta = wp_get_attachment_metadata( $file->ID );
		// $file_path = wp_get_attachment_url( $file->ID );
		$file_path = get_attached_file( $file->ID );
		$file_url = home_url( "?cr_file=$file->ID");
		// $file_ext = pathinfo( parse_url( $file_path, PHP_URL_PATH ), PATHINFO_EXTENSION );
		$children[] = array(
			'type' => 'file',
			'id'   => $file->ID,
			// 'name' => "$file->post_title.$file_ext",
			'name' => "$file->post_title",
			'fileData' => array(
				'mimeType' => $file->post_mime_type,
				'size'     => isset( $meta ) ? $meta['filesize'] : 0,
				'path'     => $file_url
			),
			'updatedAt' =>  mysql_to_rfc3339( $file->post_modified_gmt )
		);
	}

	return $children;
}
