<?php

/**
 * Plugin Name: Course resources
 * Plugin URI: https://www.github.com/i2002/course-resources
 * Description: Manage course files and student access.
 * Version: 1.0.0
 * Author: Tudor Butufei
 * Author URI: https://www.github.com/i2002/
 * License: MIT
 * Text Domain: course-resources
 * Domain Path: /lang
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/include/admin.php';
require_once __DIR__ . '/include/auth.php';
require_once __DIR__ . '/include/resources_data.php';
require_once __DIR__ . '/include/rest.php';

// Plugin defines
define( 'CR_ADMIN_MENU', 'course-resources-admin-menu' );

// Plugin activation hook
register_activation_hook( __FILE__, 'cr_plugin_activation' );

add_action( 'cr_clean_login_codes', 'cr_clean_login_codes' );

function cr_plugin_activation()
{
	if ( ! wp_next_scheduled( 'cr_clean_login_codes' ) ) {
		wp_schedule_event( time(), 'daily', 'cr_clean_login_codes' );
	}

	flush_rewrite_rules();
	cr_generate_auth_secret();
}

// Plugin deactivation hook
register_deactivation_hook( __FILE__, 'cr_plugin_deactivation' );

function cr_plugin_deactivation()
{
	wp_clear_scheduled_hook( 'cr_clean_login_codes' );
}

// Load text domain
add_action( 'init', 'cr_load_text_domain' );

// Enqueue assets
add_action( 'init', 'cr_register_assets' );

add_action( 'admin_enqueue_scripts', 'cr_enqueue_admin_assets' );

// Register admin view
add_action( 'admin_menu', 'cr_register_admin_menu' );

add_action( 'admin_init', 'cr_plugin_options_init' );

// Register types
add_action( 'init', 'cr_register_custom_types' );

// Delete course files
add_action( 'before_delete_post', 'cr_before_delete_course', 10, 2);

// File access proxy
add_filter( 'query_vars', 'cr_file_query_var' );

add_action( 'template_redirect', 'cr_file_handler' );

add_filter( 'mod_rewrite_rules', 'cr_file_htaccess_rules' );

// Delete physical file
add_action( 'before_delete_post', 'cr_before_delete_file', 10, 2 );

// Update folder count
add_action( 'created_' . CR_FOLDER_TAX, 'cr_folder_created', 10, 3 );

add_action( 'edited_' . CR_FOLDER_TAX, 'cr_folder_updated', 10, 3 );

add_action( 'delete_' . CR_FOLDER_TAX, 'cr_folder_deleted', 10, 4 );

// Cascade delete
add_action( 'pre_delete_term', 'cr_pre_delete_folder', 10, 2 );

// REST API
add_action( 'rest_api_init', 'cr_rest_init' );

// Register Frontend UI shortcode
add_action( 'init', 'cr_frontend_shortcode' );

/**
 * Load plugin translations.
 *
 * @since 1.0.0
 */
function cr_load_text_domain()
{
	load_plugin_textdomain( 'course-resources', false, dirname( plugin_basename( __FILE__ ) ) . '/lang' );
}

/**
 * Get built assets data.
 *
 * @since 1.0.0
 *
 * @param string $name the name of the asset bundle (without file extension)
 * @return array with the fields:
 * - path (relative path to the bundle from plugin root, without file extension)
 * - deps (array with deps required)
 * - ver (version string)
 */
function cr_get_asset_data( $name )
{
	$script_path = "/build/$name";
	$script_data = require __DIR__ . $script_path . '.asset.php';

	return array(
		'path' => $script_path,
		'deps' => $script_data['dependencies'],
		'ver'  => $script_data['version']
	);
}

/**
 * Register vendor assets to be loaded by frontend / backend.
 *
 * @since 1.0.0
 */
function cr_register_assets()
{
	$script = cr_get_asset_data( 'vendors' );
	wp_register_script( 'cr-vendor-scripts', plugins_url( $script['path'] . ".js", __FILE__ ), $script['deps'], $script['ver'], true );
	wp_register_style( 'cr-vendor-styles', plugins_url( $script['path'] . ".css", __FILE__ ), array(), $script['ver'] );
}

/**
 * Enqueue admin assets.
 *
 * @since 1.0.0
 */
function cr_enqueue_admin_assets()
{
	$screen = get_current_screen();
	if ( $screen->base == 'post' && $screen->post_type == CR_COURSE_TYPE && $screen->action == '' ) {
		$script = cr_get_asset_data( 'backend' );
		$script['deps'][] = 'cr-vendor-scripts';

		wp_enqueue_script( 'cr-admin-scripts', plugins_url( $script['path'] . ".js", __FILE__ ), $script['deps'], $script['ver'], true );
		wp_set_script_translations( 'cr-admin-scripts', 'course-resources', plugin_dir_path( __FILE__ ) . '/lang' );
		wp_enqueue_style( 'cr-admin-styles', plugins_url( $script['path'] . ".css", __FILE__ ), array( 'cr-vendor-styles' ), $script['ver'] );
	}
}

/**
 * Enqueue student interface assets.
 *
 * @since 1.0.0
 */
function cr_enqueue_frontend_assets()
{
	$script = cr_get_asset_data( 'frontend' );
	$script['deps'][] = 'cr-vendor-scripts';

	wp_enqueue_script( 'cr-frontend-scripts', plugins_url( $script['path'] . ".js", __FILE__ ), $script['deps'], $script['ver'], true );
	wp_set_script_translations( 'cr-frontend-scripts', 'course-resources', plugin_dir_path( __FILE__ ) . '/lang' );
	wp_enqueue_style( 'cr-frontend-styles', plugins_url( $script['path'] . ".css", __FILE__ ), array( 'cr-vendor-styles' ), $script['ver'] );
}

/**
 * Register frontend UI shortcode.
 *
 * @since 1.0.0
 */
function cr_frontend_shortcode()
{
	add_shortcode( 'course_resources', 'cr_frontend_render_shortcode' );
}

/**
 * Render frontend UI shortcode.
 *
 * @since 1.0.0
 *
 * @return string rendered HTML
 */
function cr_frontend_render_shortcode()
{
	cr_enqueue_frontend_assets();

	// load initial data
	$student = cr_get_current_student();
	$hydration_data = array();
	if ( $student === false ) {
		if ( current_user_can( 'manage_options' ) ) {
			cr_set_auth_cookie( 'admin' );
			$student = 'admin';
		} else {
			$hydration_data['errors'] = array(
				'root' => array( 'code' => 'cr_rest_unauth' )
			);
		}
	} else {
		$courses = array_map( 'cr_prepare_course_response', cr_get_student_courses( $student ) );
		$hydration_data['loaderData'] = array(
			'root' => array( 'user' => array( 'email' => $student ) ),
			'home' => array( 'courses' => $courses )
		);
	}

	return '<div class="react-root" id="cr-frontend-app" data-initial="'. esc_attr( json_encode( $hydration_data ) ) . '"></div>';
}
