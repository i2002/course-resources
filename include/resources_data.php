<?php

define( 'CR_COURSE_TYPE', 'cr-course' );
define( 'CR_COURSE_STUDENTS_META', 'students' );
define( 'CR_FILE_TYPE', 'cr-file' );
define( 'CR_FILE_MIME_META', 'cr_file_mime_type' );
define( 'CR_FILE_SIZE_META', 'cr_file_size' );
define( 'CR_FILE_NAME_META', 'cr_file_name' );
define( 'CR_FILES_FOLDER', 'cr_files' );
define( 'CR_FOLDER_TAX', 'cr-folder' );
define( 'CR_FOLDER_COURSE_META', 'course' );
define( 'CR_FOLDER_UPDATED_META', 'updatedAt' );

/**
 * Register plugin custom post types.
 *
 * @since 0.1.0
 */
function cr_register_custom_types()
{
	// $capabilities = get_post_type_capabilities( CR_COURSE_TYPE );

    // Change the default capability for viewing the post type
    // $capabilities->read_post = 'read_' . CR_COURSE_TYPE . 's';

	// course
	register_post_type(
		CR_COURSE_TYPE,
		array(
			'labels'               => array(
				'name'                     => __( 'Courses', CR_TEXT_DOMAIN ),
				'singular_name'            => __( 'Course', CR_TEXT_DOMAIN ),
				'add_new'                  => _x( 'Add New', 'course', CR_TEXT_DOMAIN ),
				'add_new_item'             => __( 'Add New Course', CR_TEXT_DOMAIN ),
				'edit_item'                => __( 'Edit Course', CR_TEXT_DOMAIN ),
				'new_item'                 => __( 'New Course', CR_TEXT_DOMAIN ),
				'view_item'                => __( 'View Course', CR_TEXT_DOMAIN ),
				'view_items'               => __( 'View Courses', CR_TEXT_DOMAIN ),
				'search_items'             => __( 'Search Courses', CR_TEXT_DOMAIN ),
				'not_found'                => __( 'No courses found', CR_TEXT_DOMAIN ),
				'not_found_in_trash'       => __( 'No courses found in Trash', CR_TEXT_DOMAIN ),
				// 'all_items'                => __( 'All Courses', CR_TEXT_DOMAIN),
				'archives'                 => __( 'Course Archives', CR_TEXT_DOMAIN ),
				'attributes'               => __( 'Course Attributes', CR_TEXT_DOMAIN ),
				'insert_into_item'         => __( 'Insert into course', CR_TEXT_DOMAIN ),
				'uploaded_to_this_item'    => __( 'Uploaded to this course', CR_TEXT_DOMAIN ),
				'item_published'           => __( 'Course published', CR_TEXT_DOMAIN ),
				'item_published_privately' => __( 'Course published privately', CR_TEXT_DOMAIN ),
				'item_reverted_to_draft'   => __( 'Course reverted to draft', CR_TEXT_DOMAIN ),
				'item_scheduled'           => __( 'Course scheduled', CR_TEXT_DOMAIN ),
				'item_updated'             => __( 'Course updated', CR_TEXT_DOMAIN ),
			),
			'public'               => false,
			'publicly_queryable'   => false,
			'show_ui'              => true,
			'show_in_menu'         => CR_ADMIN_MENU,
			'supports'             => array( 'title', 'custom-fields' ),
			'rewrite'              => array( 'slug' => 'course' ),
			// 'show_in_rest'         => true,
			'show_in_rest'         => current_user_can( 'manage_options' ),
			'has_archive'          => 'courses',
			'query_var'            => 'course',
			'register_meta_box_cb' => 'cr_course_register_metabox',
		)
	);

	register_post_meta( CR_COURSE_TYPE, CR_COURSE_STUDENTS_META, array(
		'type' => 'string',
		'single' => false,
		'show_in_rest' => true,
		'revisions_enabled' => false
	) );

	// file
	register_post_type( CR_FILE_TYPE, array(
		'public'       => false,
		'supports'     => array( 'title'),
		'show_in_rest' => current_user_can( 'manage_options' )
	) );

	register_post_meta( CR_FILE_TYPE, CR_FILE_MIME_META, array(
		'type' => 'string',
		'single' => true,
		'show_in_rest' => true,
		'revisions_enabled' => false
	) );

	register_post_meta( CR_FILE_TYPE, CR_FILE_NAME_META, array(
		'type'              => 'string',
		'single'            => true,
		'show_in_rest'      => true,
		'revisions_enabled' => false
	) );

	register_post_meta( CR_FILE_TYPE, CR_FILE_SIZE_META, array(
		'type'              => 'integer',
		'single'            => true,
		'show_in_rest'      => true,
		'revisions_enabled' => false,
		'default'           => 0
	) );

	// folder
	register_taxonomy( CR_FOLDER_TAX, CR_FILE_TYPE, array(
		'labels'                => array(
			'name'              => __( 'Folders', CR_TEXT_DOMAIN ),
			'singular_name'     => __( 'Folder', CR_TEXT_DOMAIN )
		),
		'description'           => __( 'Allows organizing uploaded files in folders', CR_TEXT_DOMAIN ),
		'hierarchical'          => true,
		'public'                => false,
		'show_ui'               => false,
		'show_in_nav_menus'     => false,
		'show_in_rest'          => current_user_can( 'manage_options' ),
		'rewrite'               => false,
		'show_admin_column'     => 'true',
		'update_count_callback' => 'cr_folder_update_count'
	) );

	register_term_meta(
		CR_FOLDER_TAX,
		CR_FOLDER_COURSE_META,
		array(
			'type'         => 'integer',
			'single'       => true,
			'show_in_rest' => true
		)
	);

	register_term_meta(
		CR_FOLDER_TAX,
		CR_FOLDER_UPDATED_META,
		array(
			'type'         => 'integer',
			'single'       => true,
			'show_in_rest' => true,
			'default'      => 0
		)
	);
}

function wpse237762_set_404() {
	if ( is_attachment() && ! current_user_can( 'manage_options' ) ) {
		global $wp_query;
		$wp_query->set_404();
		status_header(404);
	}
}

// This will show 404 on the attachment page
add_filter('template_redirect', 'wpse237762_set_404');

function cr_file_endpoint()
{
	add_rewrite_rule( '^cr_file/([^/]+)/?', 'index.php?cr_file=$matches[1]', 'top' );
}
add_action( 'init', 'cr_file_endpoint' );

function cr_file_query_var( $vars )
{
	$vars[] = 'cr_file';
	return $vars;
}
add_filter( 'query_vars', 'cr_file_query_var' );

function cr_get_file_dir( $file_id, $create = false )
{
	$file = get_post( $file_id );

	if ( ! $file || $file->post_type !== CR_FILE_TYPE ) {
		return null;
	}

	$upload_dir = wp_get_upload_dir( null, false );

	if ( $upload_dir['error'] || empty( $upload_dir['basedir'] ) ) {
		return null;
	}

	$cr_file_dir = $upload_dir['basedir'] . '/' . $file->post_parent;

	if ( ! file_exists($cr_file_dir) ) {
		if ( ! $create ) {
			return null;
		}

		$ret = wp_mkdir_p( $cr_file_dir );

		if ( ! $ret ) {
			return null;
		}
	}

	return $cr_file_dir;
}

function cr_get_file_path( $file_id )
{
	$file_dir = cr_get_file_dir( $file_id );

	if ( ! $file_dir ) {
		return null;
	}

	$filename = get_post_meta( $file_id, CR_FILE_NAME_META );

	if ( empty( $filename ) ) {
		return null;
	}

	return $file_dir . '/' . $filename;
}

function cr_file_handler2()
{
	$file_id = get_query_var( 'cr_file', false );

	if ( $file_id === false ) {
		return;
	}

	$file = get_post( (int) $file_id );

	if ( ! $file || $file->post_type !== CR_FILE_TYPE ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		$email = cr_get_current_student();

		$course_permission = cr_is_student_enrolled( $email, $file->post_parent );

		if ( $course_permission !== true ) {
			global $wp_query;
			$wp_query->set_404();
			status_header( 404 );
			return;
		}
	}

	$file_path = cr_get_file_path( $file_id );

	if ( ! file_exists( $file_path ) ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		return;
	}

	// set correct headers
	header( 'Content-Type: ' . $file->post_mime_type );
	header( 'Content-Disposition: inline; filename="' . $file->post_title . '"' );
	header( 'Content-Description: File Transfer' );
	header( 'Content-Transfer-Encoding: binary' );
	header( 'Content-Length: ' . filesize( $file_path ) );

	readfile( $file_path );
	exit;
}

function cr_file_handler()
{
	$attachment_id = get_query_var( 'cr_file', false );

	if ( $attachment_id === false ) {
		return;
	}

	$attachment = get_post( (int) $attachment_id );
	$attachment_path = get_attached_file( (int) $attachment_id );

	if ( ! $attachment ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		$email = cr_get_current_student();

		$course_permission = cr_is_student_enrolled( $email, $attachment->post_parent );

		if ( $course_permission === false ) {
			global $wp_query;
			$wp_query->set_404();
			status_header( 404 );
			return;
		}
	}

	header( 'Content-Type: ' . $attachment->post_mime_type );
	header( 'Content-Disposition: inline; filename="' . basename( $attachment_path ) . '"' );
	header( 'Content-Description: File Transfer' );
	header( 'Content-Transfer-Encoding: binary' );
	header( 'Content-Length: ' . filesize( $attachment_path ) );

	readfile( $attachment_path );
	exit;
}
add_action( 'template_redirect', 'cr_file_handler' );


function test2( $args, $request )
{
	$courses = get_posts( array(
		'post_type' => CR_COURSE_TYPE,
		'nopaging' => true,
		'fields' => 'ids'
	) );
	$args['post_parent__not_in'] = $courses;

	return $args;
}

add_filter( 'rest_attachment_query', 'test2', 10, 2);

// function cr_attachment_names( $response, $attachment, $meta )
// {
// 	$response['filename'] = $response['title'];
// 	return $response;
// }

// add_filter( 'wp_prepare_attachment_for_js', 'cr_attachment_names', 10, 3 );

/**
 *
 */
function cr_rest_attachment_hide_path( $response, $post, $request )
{
	// $permission = cr_has_course_permission( $post->post_parent );
	$parent = get_post( $post->parent );

	if ( $parent && $parent->post_type === CR_COURSE_TYPE ) {
		if ( isset( $response->data['guid'] ) ) {
			$response->data['guid'] = array(
				'rendered' => esc_html( home_url( "?cr_file=$post->ID") )
			);
		}

		if ( isset( $response->data['link'] ) ) {
			$response->data['link'] = array(
				'rendered' => esc_html( home_url( "?cr_file=$post->ID") )
			);
		}
	}

	return $response;
}

add_filter( 'rest_prepare_attachment', 'cr_rest_attachment_hide_path', 10, 3 );

/**
 *
 */
function cr_attachment_hide_path( $url, $attachment_id )
{
	// apply only on frontend
	if ( current_user_can( 'manage_options' ) ) {
		return $url;
	}

	// apply only if attached to course
	$attachment = get_post( $attachment_id );

	if ( ! $attachment ) {
		return $url;
	}

	$parent = get_post( $attachment->post_parent );

	if ( $parent && $parent->post_type === CR_COURSE_TYPE ) {
		$file_url = home_url( "?cr_file=$attachment_id");
		return $file_url;
	}

	return $url;
}

add_filter( 'wp_get_attachment_url', 'cr_attachment_hide_path', 10, 2 );

// function cr_randomize_filename( $filename, $filename_raw )
// {
// 	$name = bin2hex( random_bytes( 15 ) );
// 	return $name;
// }

// add_filter( 'sanitize_file_name', 'cr_randomize_filename', 10, 2 );

// add_filter('mod_rewrite_rules', 'custom_htaccess_rules');

// function custom_htaccess_rules($rules) {
//     // Add custom rules to restrict media access for non-logged-in users
//     $custom_rules = "
// # Custom rules added by plugin for restricting media access to logged-in users
// <FilesMatch '\\.(jpg|jpeg|png|gif|pdf|doc|docx|zip|mp3|mp4|flv|wmv|avi)$'>
//     Order deny,allow
//     Deny from all
//     # Allow logged-in users
//     Allow from all
//     # Require valid-user
//     Require valid-user
// </FilesMatch>
// ";

//     // Append custom rules to existing rules
//     // $rules .= $custom_rules;

//     // Return modified rules
//     return $rules;
// }

// function author_cap_filter( $allcaps, $cap, $args, $obj )
// {
// 	if ( $obj->ID === 0 ) {
// 		$test = 1;
// 		if ( $cap[0] === 'unfiltered_html' ) {
// 			$allcaps[$cap[0]] = true;
// 		}
// 	}
// 	return $allcaps;
// }

// add_filter( 'user_has_cap', 'author_cap_filter', 10, 4 );

/**
 * Trigger parent folder count update after inserting folder.
 * Setup initial value for folder updatedAt timestamp.
 *
 * @since 0.1.0
 *
 * @param int   $term_id Term ID.
 * @param int   $tt_id   Term taxonomy ID.
 * @param array $args    Arguments passed to wp_insert_term().
 */
function cr_folder_created( $term_id, $tt_id, $args )
{
	if ( isset( $args['parent'] ) && $args['parent'] != 0 ) {
		// query the term to get corresponding term_taxonomy_id
		$term = get_term( $args['parent'], CR_FOLDER_TAX );
		if ( empty( $term ) || is_wp_error( $term ) ) {
			return;
		}

		wp_update_term_count( $term->term_taxonomy_id, CR_FOLDER_TAX );
	}
	update_term_meta( $term_id, CR_FOLDER_UPDATED_META, time() );
}

/**
 * Update folder updatedAt timestamp.
 *
 * @since 0.1.0
 *
 * @param int   $term_id Term ID.
 * @param int   $tt_id   Term taxonomy ID.
 * @param array $args    Arguments passed to wp_update_term().
 */
function cr_folder_updated( $term_id, $tt_id, $args )
{
	update_term_meta( $term_id, CR_FOLDER_UPDATED_META, time() );
}

/**
 * Trigger parent folder count update after deleting folder.
 *
 * @since 0.1.0
 *
 * @param int     $term_id      Term ID.
 * @param int     $tt_id        Term taxonomy ID.
 * @param WP_Term $deleted_term Copy of the already-deleted term.
 * @param array   $object_ids   List of term object IDs.
 */
function cr_folder_deleted( $term_id, $tt_id, $deleted_term, $object_ids )
{
	if ( $deleted_term->parent !== 0 ) {
		$parent = get_term( $deleted_term->parent, CR_FOLDER_TAX );
		if ( empty( $parent ) || is_wp_error( $parent ) ) {
			return;
		}

		wp_update_term_count( $parent->term_taxonomy_id, CR_FOLDER_TAX );
	}
}

/**
 * Update folder term count based on number of children folders and attachments.
 *
 * @since 0.1.0
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param int[]       $terms    List of term taxonomy IDs.
 * @param WP_Taxonomy $taxonomy Current taxonomy object of terms.
 */
function cr_folder_update_count( $terms, $taxonomy )
{
	global $wpdb;
	foreach ( (array) $terms as $term_taxonomy_id ) {
		// query the term to get corresponding term_id
		$term = get_term_by( 'term_taxonomy_id', $term_taxonomy_id );
		if ( empty( $term ) || is_wp_error( $term ) ) {
			return;
		}

		$subfolders = get_terms( array(
			'taxonomy'   => CR_FOLDER_TAX,
			'hide_empty' => false,
			'parent'     => $term->term_id,
		) );

		$attachments = get_posts( array(
			'post_type' => 'attachment',
			'nopaging'  => true,
			'tax_query' => array(
				array(
					'taxonomy'         => CR_FOLDER_TAX,
					'field'            => 'term_id',
					'terms'            => $term->term_id,
					'include_children' => false
				)
			)
		) );

		if ( is_wp_error( $subfolders ) || is_wp_error( $attachments ) ) {
			return;
		}

		$count = count( $subfolders ) + count( $attachments );

		do_action( 'edit_term_taxonomy', $term_taxonomy_id, $taxonomy->name );
		$wpdb->update( $wpdb->term_taxonomy, array( 'count' => $count ), array( 'term_taxonomy_id' => $term_taxonomy_id ) );
		do_action( 'edited_term_taxonomy', $term_taxonomy_id, $taxonomy->name );

		update_term_meta( $term->term_id, CR_FOLDER_UPDATED_META, time() );
	}
}

/**
 * Recursively delete subfolders and attached files.
 *
 * @since 0.1.0
 *
 * @global bool|null $cr_delete_attachments_flag
 * @param int    $term     Term ID
 * @param string $taxonomy Taxonomy name
 */
function cr_pre_delete_term( $term, $taxonomy )
{
	if ( $taxonomy === CR_FOLDER_TAX ) {
		$term_children = get_term_children( $term, $taxonomy );
		if ( ! empty( $term_children ) ) {
			foreach ( $term_children as $term_child ) {
				wp_delete_term( $term_child, $taxonomy );
			}
		}

		$files = get_posts( array(
			'post_type'   => 'attachment',
			'nopaging'    => true,
			'tax_query'   => array(
				array(
					'taxonomy'         => CR_FOLDER_TAX,
					'field'            => 'term_id',
					'terms'            => $term,
					'include_children' => false
				)
			)
		) );

		global $cr_delete_attachments_flag;
		foreach ( $files as $file ) {
			if ( $cr_delete_attachments_flag ) {
				wp_delete_attachment( $file->ID, true );
			} else {
				wp_update_post( array(
					'ID'          => $file->ID,
					'post_parent' => 0
				) );
			}
		}
    }
}

/**
 * Set permanently delete file flag when deleting folder.
 * Based on request params sets $cr_delete_attachments_flag to true.
 *
 * @since 0.1.0
 *
 * @global bool|null $cr_delete_attachments_flag
 * @param WP_REST_Response  $response  The response object.
 * @param WP_Term           $item      The original term object.
 * @param WP_REST_Request   $request   Request used to generate the response.
 */
function cr_set_file_delete_flag( $response, $item, $request )
{
	$request;
	if ( $request->get_method() === 'DELETE' && $request['deleteAttachments'] ) {
		global $cr_delete_attachments_flag;
		$cr_delete_attachments_flag = true;
	}
	return $response;
}

/**
 * Add course meta REST param.
 *
 * @since 0.1.0
 *
 * @param array       $query_params JSON Schema-formatted collection parameters.
 * @param WP_Taxonomy $taxonomy     Taxonomy object.
 */
function cr_folder_collection_params( $query_params, $taxonomy )
{
	$query_params[CR_FOLDER_COURSE_META] = array(
		'description' => __( 'Limit result set to terms assigned to a specific course.', CR_TEXT_DOMAIN ),
		'type'        => 'integer',
		'default'     => null,
	);

	return $query_params;
}

/**
 * REST filter folders by course meta.
 *
 * @since 0.1.0
 *
 * @param array           $prepared_args Array of arguments for get_terms().
 * @param WP_REST_Request $request       The REST API request.
 */
function cr_folder_course_filter( $prepared_args, $request )
{
	if ( isset( $request[CR_FOLDER_COURSE_META] ) ) {
		$prepared_args['meta_key'] = CR_FOLDER_COURSE_META;
		$prepared_args['meta_value'] = sanitize_text_field( $request[CR_FOLDER_COURSE_META] );
	}

	return $prepared_args;
}

/**
 * Get path from root to folder.
 *
 * @param WP_Term|int $folder folder term or 0 for root folder
 * @return array
 */
function cr_get_folder_path( $folder )
{
	if ( $folder === 0 ) {
		return array();
	}

	$parents = get_ancestors( $folder->term_id, CR_FOLDER_TAX, 'taxonomy' );

	$path = array();

	foreach ( array_reverse( $parents ) as $term_id ) {
		$parent = get_term( $term_id, CR_FOLDER_TAX );

		if ( empty( $parent ) || is_wp_error( $parent ) ) {
			continue;
		}

		$path[] = array(
			'id'   => $parent->term_id,
			'name' => $parent->name
		);
	}

	$path[] = array(
		'id'   => $folder->term_id,
		'name' => $folder->name
	);

	return $path;
}

/**
 * Get subfolders of parent folder.
 *
 * @param WP_Post     $course
 * @param WP_Term|int $parent
 * @return WP_Term[]
 */
function cr_get_child_folders( $course, $parent )
{
	$children = get_terms(
		array(
			'taxonomy'   => CR_FOLDER_TAX,
			'get'        => 'all',
			'orderby'    => 'name',
			'meta_key'   => CR_FOLDER_COURSE_META,
			'meta_value' => $course->ID,
			'parent'     => $parent !== 0 ? $parent->term_id : 0
		)
	);

	return $children;
}

/**
 * Get files in parent folder.
 *
 * @param WP_Post     $course
 * @param WP_Term|int $parent
 * @return WP_Post[]
 */
function cr_get_child_files( $course, $parent )
{
	$tax_query = array(
		'taxonomy' => CR_FOLDER_TAX
	);

	if ( $parent !== 0 ) {
		$tax_query['field'] = 'term_id';
		$tax_query['terms'] = array ( $parent->term_id );
		$tax_query['include_children'] = false;
	} else {
		$tax_query['operator'] = 'NOT EXISTS';
	}

	$args = array(
		'post_parent'    => $course->ID,
		'post_type'      => 'attachment',
		// 'post_mime_type' => $type,
		'posts_per_page' => -1,
		'orderby'        => 'name',
		'order'          => 'ASC',
		'tax_query'      => array ( $tax_query )
	);

	$children = get_children( $args );

	return $children;
}
