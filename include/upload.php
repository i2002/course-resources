<?php

/**
 * Handles an upload via multipart/form-data ($_FILES).
 *
 * @since 1.0.0
 *
 * @param array $files   Data from the `$_FILES` superglobal.
 * @param array $headers HTTP headers from the request.
 * @return array|WP_Error Data from wp_handle_upload().
 */
function cr_upload_from_file( $files, $headers )
{
	if ( empty( $files ) ) {
		return new WP_Error(
			'rest_upload_no_data',
			__( 'No data supplied.' ),
			array( 'status' => 400 )
		);
	}

	// Verify hash, if given.
	if ( ! empty( $headers['content_md5'] ) ) {
		$content_md5 = array_shift( $headers['content_md5'] );
		$expected    = trim( $content_md5 );
		$actual      = md5_file( $files['file']['tmp_name'] );

		if ( $expected !== $actual ) {
			return new WP_Error(
				'rest_upload_hash_mismatch',
				__( 'Content hash did not match expected.' ),
				array( 'status' => 412 )
			);
		}
	}

	// Pass off to WP to handle the actual upload.
	$overrides = array(
		'test_form' => false,
		'unique_filename_callback' => 'cr_unique_filename'
	);

	$size_check = cr_check_upload_size( $files['file'] );
	if ( is_wp_error( $size_check ) ) {
		return $size_check;
	}

	// Include filesystem functions to get access to wp_handle_upload().
	require_once ABSPATH . 'wp-admin/includes/file.php';

	$file = wp_handle_upload( $files['file'], $overrides );

	if ( isset( $file['error'] ) ) {
		return new WP_Error(
			'rest_upload_unknown_error',
			$file['error'],
			array( 'status' => 500 )
		);
	}

	return $file;
}

/**
 * Handles an upload via raw POST data.
 *
 * @since 1.0.0
 *
 * @param string $data    Supplied file data.
 * @param array  $headers HTTP headers from the request.
 * @return array|WP_Error Data from wp_handle_sideload().
 */
function cr_upload_from_data( $data, $headers )
{
	if ( empty( $data ) ) {
		return new WP_Error(
			'rest_upload_no_data',
			__( 'No data supplied.' ),
			array( 'status' => 400 )
		);
	}

	if ( empty( $headers['content_type'] ) ) {
		return new WP_Error(
			'rest_upload_no_content_type',
			__( 'No Content-Type supplied.' ),
			array( 'status' => 400 )
		);
	}

	if ( empty( $headers['content_disposition'] ) ) {
		return new WP_Error(
			'rest_upload_no_content_disposition',
			__( 'No Content-Disposition supplied.' ),
			array( 'status' => 400 )
		);
	}

	$filename = WP_REST_Attachments_Controller::get_filename_from_disposition( $headers['content_disposition'] );

	if ( empty( $filename ) ) {
		return new WP_Error(
			'rest_upload_invalid_disposition',
			__( 'Invalid Content-Disposition supplied. Content-Disposition needs to be formatted as `attachment; filename="image.png"` or similar.' ),
			array( 'status' => 400 )
		);
	}

	if ( ! empty( $headers['content_md5'] ) ) {
		$content_md5 = array_shift( $headers['content_md5'] );
		$expected    = trim( $content_md5 );
		$actual      = md5( $data );

		if ( $expected !== $actual ) {
			return new WP_Error(
				'rest_upload_hash_mismatch',
				__( 'Content hash did not match expected.' ),
				array( 'status' => 412 )
			);
		}
	}

	// Get the content-type.
	$type = array_shift( $headers['content_type'] );

	// Include filesystem functions to get access to wp_tempnam() and wp_handle_sideload().
	require_once ABSPATH . 'wp-admin/includes/file.php';

	// Save the file.
	$tmpfname = wp_tempnam( $filename );

	$fp = fopen( $tmpfname, 'w+' );

	if ( ! $fp ) {
		return new WP_Error(
			'rest_upload_file_error',
			__( 'Could not open file handle.' ),
			array( 'status' => 500 )
		);
	}

	fwrite( $fp, $data );
	fclose( $fp );

	// Now, sideload it in.
	$file_data = array(
		'error'    => null,
		'tmp_name' => $tmpfname,
		'name'     => $filename,
		'type'     => $type,
	);

	$size_check = cr_check_upload_size( $file_data );
	if ( is_wp_error( $size_check ) ) {
		return $size_check;
	}

	$overrides = array(
		'test_form' => false,
		'unique_filename_callback' => 'cr_unique_filename'
	);

	$sideloaded = wp_handle_sideload( $file_data, $overrides );

	if ( isset( $sideloaded['error'] ) ) {
		@unlink( $tmpfname );

		return new WP_Error(
			'rest_upload_sideload_error',
			$sideloaded['error'],
			array( 'status' => 500 )
		);
	}

	return $sideloaded;
}

/**
 * Determine if uploaded file exceeds space quota on multisite.
 *
 * Replicates check_upload_size().
 *
 * @since 1.0.0
 *
 * @param array $file $_FILES array for a given file.
 * @return true|WP_Error True if can upload, error for errors.
 */
function cr_check_upload_size( $file ) {
	if ( ! is_multisite() ) {
		return true;
	}

	if ( get_site_option( 'upload_space_check_disabled' ) ) {
		return true;
	}

	$space_left = get_upload_space_available();

	$file_size = filesize( $file['tmp_name'] );

	if ( $space_left < $file_size ) {
		return new WP_Error(
			'rest_upload_limited_space',
			/* translators: %s: Required disk space in kilobytes. */
			sprintf( __( 'Not enough space to upload. %s KB needed.' ), number_format( ( $file_size - $space_left ) / KB_IN_BYTES ) ),
			array( 'status' => 400 )
		);
	}

	if ( $file_size > ( KB_IN_BYTES * get_site_option( 'fileupload_maxk', 1500 ) ) ) {
		return new WP_Error(
			'rest_upload_file_too_big',
			/* translators: %s: Maximum allowed file size in kilobytes. */
			sprintf( __( 'This file is too big. Files must be less than %s KB in size.' ), get_site_option( 'fileupload_maxk', 1500 ) ),
			array( 'status' => 400 )
		);
	}

	// Include multisite admin functions to get access to upload_is_user_over_quota().
	require_once ABSPATH . 'wp-admin/includes/ms.php';

	if ( upload_is_user_over_quota( false ) ) {
		return new WP_Error(
			'rest_upload_user_quota_exceeded',
			__( 'You have used your space quota. Please delete files before uploading.' ),
			array( 'status' => 400 )
		);
	}

	return true;
}

/**
 * Random unique filename for uploaded files.
 *
 * @param string $dir   upload dir
 * @param string $name  file name
 * @param string $ext   file extension
 * @return string
 */
function cr_unique_filename( $dir, $name, $ext )
{
	$rand = bin2hex( random_bytes( 16 ) );
	$name = $rand . $ext;

	$nr = 0;
	while ( file_exists( $dir . '/' . $name ) ) {
		$nr++;
		$name = "{$rand}_{$nr}{$ext}";
	}

	return $name;
}
