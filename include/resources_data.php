<?php

define( 'CR_COURSE_TYPE', 'cr-course' );
define( 'CR_COURSE_STUDENTS_META', 'cr_course_students' );
define( 'CR_FILE_TYPE', 'cr-file' );
define( 'CR_FILE_MIME_META', 'cr_file_mime_type' );
define( 'CR_FILE_SIZE_META', 'cr_file_size' );
define( 'CR_FILE_NAME_META', 'cr_file_name' );
define( 'CR_FILES_FOLDER', 'cr_files' );
define( 'CR_FOLDER_TAX', 'cr-folder' );
define( 'CR_FOLDER_COURSE_META', 'cr_folder_course' );
define( 'CR_FOLDER_UPDATED_META', 'cr_folder_updated_at' );

/**
 * Register plugin custom post types.
 *
 * @since 0.1.0
 */
function cr_register_custom_types()
{
	// course
	register_post_type(
		CR_COURSE_TYPE,
		array(
			'labels'               => array(
				'name'                     => __( 'Courses', 'course-resources' ),
				'singular_name'            => __( 'Course', 'course-resources' ),
				'add_new'                  => _x( 'Add New', 'course', 'course-resources' ),
				'add_new_item'             => __( 'Add New Course', 'course-resources' ),
				'edit_item'                => __( 'Edit Course', 'course-resources' ),
				'new_item'                 => __( 'New Course', 'course-resources' ),
				'view_item'                => __( 'View Course', 'course-resources' ),
				'view_items'               => __( 'View Courses', 'course-resources' ),
				'search_items'             => __( 'Search Courses', 'course-resources' ),
				'not_found'                => __( 'No courses found', 'course-resources' ),
				'not_found_in_trash'       => __( 'No courses found in Trash', 'course-resources' ),
				// 'all_items'                => __( 'All Courses', 'course-resources'),
				'archives'                 => __( 'Course Archives', 'course-resources' ),
				'attributes'               => __( 'Course Attributes', 'course-resources' ),
				'insert_into_item'         => __( 'Insert into course', 'course-resources' ),
				'uploaded_to_this_item'    => __( 'Uploaded to this course', 'course-resources' ),
				'item_published'           => __( 'Course published', 'course-resources' ),
				'item_published_privately' => __( 'Course published privately', 'course-resources' ),
				'item_reverted_to_draft'   => __( 'Course reverted to draft', 'course-resources' ),
				'item_scheduled'           => __( 'Course scheduled', 'course-resources' ),
				'item_updated'             => __( 'Course updated', 'course-resources' ),
			),
			'public'               => false,
			'publicly_queryable'   => false,
			'show_ui'              => true,
			'show_in_menu'         => CR_ADMIN_MENU,
			'supports'             => array( 'title', 'custom-fields' ),
			'show_in_rest'         => current_user_can( 'manage_options' ),
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
		'supports'     => array( 'title', 'custom-fields' ),
		'show_in_rest' => current_user_can( 'manage_options' )
	) );

	register_post_meta( CR_FILE_TYPE, CR_FILE_MIME_META, array(
		'type'              => 'string',
		'single'            => true,
		'show_in_rest'      => true,
		'revisions_enabled' => false
	) );

	register_post_meta( CR_FILE_TYPE, CR_FILE_NAME_META, array(
		'type'              => 'string',
		'single'            => true,
		'revisions_enabled' => false
	) );

	register_post_meta( CR_FILE_TYPE, CR_FILE_SIZE_META, array(
		'type'              => 'integer',
		'single'            => true,
		'show_in_rest'      => true,
		'revisions_enabled' => false,
		'default'           => 0
	) );

	// - register file endpoint
	add_rewrite_rule( '^cr_file/([^/]+)/?', 'index.php?cr_file=$matches[1]', 'top' );

	// folder
	register_taxonomy( CR_FOLDER_TAX, CR_FILE_TYPE, array(
		'labels'                => array(
			'name'              => __( 'Folders', 'course-resources' ),
			'singular_name'     => __( 'Folder', 'course-resources' )
		),
		'description'           => __( 'Allows organizing uploaded files in folders', 'course-resources' ),
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

/**
 * Delete its files and folders when deleting a course.
 *
 * @since 0.1.0
 *
 * @param int $course_id
 * @param WP_Post $course
 */
function cr_before_delete_course( $course_id, $course )
{
	if ( $course->post_type !== CR_COURSE_TYPE ) {
		return;
	}

	// delete top level folders
	$folders = cr_get_child_folders( $course, 0 );
	foreach ( $folders as $folder ) {
		wp_delete_term( $folder->term_id, CR_FOLDER_TAX );
	}

	// delete files in root folder
	$files = cr_get_child_files( $course, 0 );
	foreach ( $files as $file ) {
		wp_delete_post( $file->ID, true );
	}
}

/**
 * Get upload path relative to uploads directory.
 *
 * @since 0.1.0
 *
 * @param int $course_id the id of the parent course
 * @return string
 */
function cr_file_get_upload_path( $course_id )
{
	return CR_FILES_FOLDER . '/' . $course_id;
}

/**
 * Get server path of a file.
 *
 * Returns the physical path or null if errors.
 *
 * @since 0.1.0
 *
 * @param int $file_id
 * @return string|null
 */
function cr_file_get_path( $file_id )
{
	$file = get_post( $file_id );

	if ( ! $file || $file->post_type !== CR_FILE_TYPE ) {
		return null;
	}

	$upload_dir = wp_get_upload_dir( null, false );

	if ( $upload_dir['error'] || empty( $upload_dir['basedir'] ) ) {
		return null;
	}

	$file_dir = $upload_dir['basedir'] . '/' . cr_file_get_upload_path( $file->post_parent );

	$file_name = get_post_meta( $file_id, CR_FILE_NAME_META, true );

	if ( empty( $file_name ) ) {
		return null;
	}

	return $file_dir . '/' . $file_name;
}

/**
 * Get URL of a file.
 *
 * @since 0.1.0
 *
 * @param int $file_id
 * @return string
 */
function cr_file_get_url( $file_id )
{
	return home_url( "?cr_file=$file_id" );
}

/**
 * Delete physical file associated with file post type.
 *
 * @since 0.1.0
 *
 * @param int     $file_id
 * @param WP_Post $file
 */
function cr_before_delete_file( $file_id, $file )
{
	if ( $file->post_type !== CR_FILE_TYPE ) {
		return;
	}

	$upload_dir = wp_get_upload_dir( null, false );
	$file_path = cr_file_get_path( $file_id );
	$file_dir = $upload_dir['basedir'] . '/' . cr_file_get_upload_path( $file->post_parent );

	wp_delete_file_from_directory( $file_path, $file_dir );
}

/**
 * Register file query var.
 *
 * @since 0.1.0
 *
 * @param array $vars
 * @return array
 */
function cr_file_query_var( $vars )
{
	$vars[] = 'cr_file';
	return $vars;
}

/**
 * Proxy file requests and check access permissions.
 *
 * @since 0.1.0
 */
function cr_file_handler()
{
	$file_id = get_query_var( 'cr_file', false );

	if ( $file_id === false ) {
		return;
	}

	$file = get_post( (int) $file_id );

	// not a valid file
	if ( ! $file || $file->post_type !== CR_FILE_TYPE ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		return;
	}

	// permit requests from admin interface
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

	$file_path = cr_file_get_path( $file_id );

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

/**
 * Modify htaccess rules to forbid direct access to files upload folder.
 *
 * @since 0.1.0
 *
 * @param string $rules
 * @return string
 */
function cr_file_htaccess_rules( $rules )
{
	$file_dir = 'wp-content/uploads/' . CR_FILES_FOLDER;
	$file_rules = "
<IfModule mod_rewrite.c>
RewriteEngine on
RewriteCond %{REQUEST_URI} ^/$file_dir
RewriteRule .*$ - [F]
</IfModule>
	";

	$rules .= $file_rules;

	return $rules;
}

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

		$files = get_posts( array(
			'post_type' => CR_FILE_TYPE,
			'nopaging'  => true,
			'post_status' => 'inherit',
			'tax_query' => array(
				array(
					'taxonomy'         => CR_FOLDER_TAX,
					'field'            => 'term_id',
					'terms'            => $term->term_id,
					'include_children' => false
				)
			)
		) );

		if ( is_wp_error( $subfolders ) || is_wp_error( $files ) ) {
			return;
		}

		$count = count( $subfolders ) + count( $files );

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
 * @param int    $term     Term ID
 * @param string $taxonomy Taxonomy name
 */
function cr_pre_delete_folder( $term, $taxonomy )
{
	if ( $taxonomy === CR_FOLDER_TAX ) {
		$term_children = get_term_children( $term, $taxonomy );
		if ( ! empty( $term_children ) ) {
			foreach ( $term_children as $term_child ) {
				wp_delete_term( $term_child, $taxonomy );
			}
		}

		$files = get_posts( array(
			'post_type'   => CR_FILE_TYPE,
			'nopaging'    => true,
			'post_status' => 'inherit',
			'tax_query'   => array(
				array(
					'taxonomy'         => CR_FOLDER_TAX,
					'field'            => 'term_id',
					'terms'            => $term,
					'include_children' => false
				)
			),
			'orderby'     => 'title',
			'order'       => 'ASC',
		) );

		foreach ( $files as $file ) {
			wp_delete_post( $file->ID, true );
		}
    }
}

/**
 * Get path from root to folder.
 *
 * @since 0.1.0
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
 * @since 0.1.0
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
 * @since 0.1.0
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
		'post_parent' => $course->ID,
		'post_type'   => CR_FILE_TYPE,
		'post_status' => 'inherit',
		'nopaging'    => true,
		'orderby'     => 'title',
		'order'       => 'ASC',
		'tax_query'   => array ( $tax_query )
	);

	$children = get_children( $args );

	return $children;
}
