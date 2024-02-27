<?php

/**
 * Plugin Name: Course resources
 * Plugin URI: https://www.github.com/i2002/course-resources
 * Description: Manage course files and student access.
 * Version: 0.1.0
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
define( 'CR_TEXT_DOMAIN', 'course-resources' );
define( 'CR_ADMIN_MENU', 'course-resources-admin-menu' );

// Plugin activation hook
register_activation_hook( __FILE__, 'cr_plugin_activation' );

function cr_plugin_activation()
{
	if ( ! wp_next_scheduled( 'cr_clean_login_links' ) ) {
		wp_schedule_event( time(), 'daily', 'cr_clean_login_links' );
	}

	flush_rewrite_rules();
	cr_generate_auth_secret();
}

// Plugin deactivation hook
register_deactivation_hook( __FILE__, 'cr_plugin_deactivation' );

function cr_plugin_deactivation()
{
	wp_clear_scheduled_hook( 'cr_clean_login_links' );
}

// Enqueue assets
add_action( 'admin_enqueue_scripts', 'cr_enqueue_admin_assets' );

// Register admin view
add_action( 'admin_menu', 'cr_register_admin_menu' );

add_action( 'admin_init', 'cr_plugin_options_init' );

// Register types
add_action( 'init', 'cr_register_custom_types' );

// Update folder count
add_action( 'created_' . CR_FOLDER_TAX, 'cr_folder_created', 10, 3 );

add_action( 'edited_' . CR_FOLDER_TAX, 'cr_folder_updated', 10, 3 );

add_action( 'delete_' . CR_FOLDER_TAX, 'cr_folder_deleted', 10, 4 );

// Cascade delete
add_action( 'pre_delete_term', 'cr_pre_delete_term', 10, 2 );

add_filter( 'rest_prepare_' . CR_FOLDER_TAX, 'cr_set_file_delete_flag', 10, 3 );

// Add REST filter
add_filter( 'rest_' . CR_FOLDER_TAX . '_collection_params', 'cr_folder_collection_params', 10, 2 );

add_filter( 'rest_' . CR_FOLDER_TAX . '_query', 'cr_folder_course_filter', 10, 2 );

// Magic link handler
add_action( 'init', 'cr_magic_link_handler' );

// REST API
add_action( 'rest_api_init', 'cr_rest_init' );

// Register Frontend UI shortcode
add_action( 'init', 'cr_frontend_shortcode' );

/**
 * Enqueue admin assets.
 *
 * @since 0.1.0
 */
function cr_enqueue_admin_assets()
{
	$screen = get_current_screen();

	$plugin_url = plugin_dir_url( __FILE__ );
	$assets = require __DIR__ . '/build/backend.asset.php';

	if ( $screen->base == 'post' && $screen->post_type == CR_COURSE_TYPE && $screen->action == '' ) {
		wp_enqueue_script( 'cr-admin-scripts', $plugin_url . '/build/backend.js', $assets['dependencies'], $assets['version'], true );
		wp_enqueue_style( 'cr-admin-styles', $plugin_url . '/build/backend.css', 0 );
		wp_enqueue_media();
	}
}

/**
 * Enqueue student interface assets.
 *
 * @since 0.1.0
 */
function cr_enqueue_frontend_assets()
{
	$plugin_url = plugin_dir_url( __FILE__ );
	$assets = require __DIR__ . '/build/frontend.asset.php';
	wp_enqueue_script( 'cr-admin-scripts', $plugin_url . '/build/frontend.js', $assets['dependencies'], $assets['version'], true );
	wp_enqueue_style( 'cr-admin-styles', $plugin_url . '/build/frontend.css', 0 );
}

/**
 * Register frontend UI shortcode.
 *
 * @since 0.1.0
 */
function cr_frontend_shortcode()
{
	add_shortcode( 'course_resources', 'cr_frontend_render_shortcode' );
}

/**
 * Render frontend UI shortcode.
 *
 * @since 0.1.0
 */
function cr_frontend_render_shortcode()
{
	cr_enqueue_frontend_assets();
	return '<div class="react-root" id="cr-frontend-app"></div>';
}
