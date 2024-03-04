<?php

define( 'CR_SETTING_LOGIN_EXP', 'cr_login_expiration' );
define( 'CR_SETTING_LOGIN_EXP_DEFAULT', 30 * 24 * 3600); // 30 days
define( 'CR_SETTING_LOGIN_LINK_EXP', 'cr_login_link_expiration' );
define( 'CR_SETTING_LOGIN_LINK_EXP_DEFAULT', 3 * 3600 ); // 3 hours
define( 'CR_SETTING_LOGIN_REQUEST_COOLDOWN', 'cr_login_request_cooldown' );
define( 'CR_SETTING_LOGIN_REQUEST_COOLDOWN_DEFAULT', 60 ); // 1 minute

/**
 * Register course resources menu with options submenu.
 *
 * @since 0.1.0
 */
function cr_register_admin_menu()
{
	add_menu_page(
		__( 'Course resources', 'course-resources' ),
		__( 'Course resources', 'course-resources' ),
		'manage_options',
		CR_ADMIN_MENU,
		'',
		'',
		20
	);

	add_submenu_page(
		CR_ADMIN_MENU,
		__( 'Course resources - Options', 'course-resources' ),
		__( 'Options', 'course-resources' ),
		'manage_options',
		CR_ADMIN_MENU,
		'cr_plugin_options'
	);
}

/**
 * Register file manager metabox for course post type.
 *
 * @since 0.1.0
 */
function cr_course_register_metabox()
{
	remove_meta_box( 'postcustom', CR_COURSE_TYPE, 'normal' );

	// show only on edit screens
	$screen = get_current_screen();
    if( $screen->action === 'add' ) {
		return;
	}

	add_meta_box(
		'cr_file_manager_metabox',
		__( 'Course files', 'course-resources' ),
		function ( $post ) { echo '<div id="course-files-app" class="react-root" data-course-id="' . $post->ID . '"></div>'; },
		CR_COURSE_TYPE,
		'normal'
	);

	add_meta_box(
		'cr_student_enrolment_metabox',
		__( 'Student enrolment', 'course-resources' ),
		function ( $post ) { echo '<div id="student-enrolment-app" class="react-root" data-course-id="' . $post->ID . '"></div>'; },
		CR_COURSE_TYPE,
		'side'
	);
}

/**
 * Register plugin settings and fields.
 *
 * @since 0.1.0
 */
function cr_plugin_options_init()
{
	// Register settings
	register_setting( 'cr_options', CR_SETTING_LOGIN_EXP, array(
		'type'              => 'integer',
		'description'       => __( 'Duration in seconds of login token validity', 'course-resources' ),
		'sanitize_callback' => null,
		'default'           => CR_SETTING_LOGIN_EXP_DEFAULT
	) );

	register_setting( 'cr_options', CR_SETTING_LOGIN_LINK_EXP, array(
		'type'              => 'integer',
		'description'       => __( 'Duration in seconds of validation code validity', 'course-resources' ),
		'sanitize_callback' => null,
		'default'           => CR_SETTING_LOGIN_LINK_EXP_DEFAULT
	) );

	register_setting( 'cr_options', CR_SETTING_LOGIN_REQUEST_COOLDOWN, array(
		'type'              => 'integer',
		'description'       => __( 'Duration in seconds before requesting another login email', 'course-resources' ),
		'sanitize_callback' => null,
		'default'           => CR_SETTING_LOGIN_REQUEST_COOLDOWN_DEFAULT
	) );

	// Register setting sections
	add_settings_section(
		'cr_section_security',
		__( 'Security', 'course-resources' ),
		'cr_section_security_cb',
		'cr_options'
	);

	// Register setting fields
	add_settings_field(
		'cr_field_login_expiration',
		__( 'Login expiration time', 'course-resources' ),
		'cr_field_numeric_cb',
		'cr_options',
		'cr_section_security',
		array(
			'label_for'   => 'cr_field_login_expiration',
			'name'        => CR_SETTING_LOGIN_EXP,
			'description' => __( 'How long is a session remembered untill a new sign in is required (value in seconds)', 'course-resources' )
		)
	);

	add_settings_field(
		'cr_field_revoke_logins',
		__(  'Revoke login tokens', 'course-resources' ),
		'cr_field_revoke_logins_cb',
		'cr_options',
		'cr_section_security',
		array(
			'label_for' => 'cr_field_revoke_logins'
		)
	);

	add_settings_field(
		'cr_field_login_link_expiration',
		__( 'Login email expiration time', 'course-resources' ),
		'cr_field_numeric_cb',
		'cr_options',
		'cr_section_security',
		array(
			'label_for' => 'cr_field_login_link_expiration',
			'name' => CR_SETTING_LOGIN_LINK_EXP,
			'description' => __( 'How long is the verificaton code valid (value in seconds)', 'course-resources' )
		)
	);

	add_settings_field(
		'cr_field_login_request_cooldown',
		__( 'Login request cooldown', 'course-resources' ),
		'cr_field_numeric_cb',
		'cr_options',
		'cr_section_security',
		array(
			'label_for' => 'cr_field_login_request_cooldown',
			'name' => CR_SETTING_LOGIN_REQUEST_COOLDOWN,
			'description' => __( 'Minimum time between two consecutive verification code emails sent (value in seconds)', 'course-resources' )
		)
	);

	add_settings_field(
		'cr_field_revoke_login_links',
		__( 'Revoke sent login links', 'course-resources' ),
		'cr_field_revoke_login_links_cb',
		'cr_options',
		'cr_section_security',
		array(
			'label_for' => 'cr_field_revoke_login_links'
		)
	);

	add_action( 'admin_post_cr_action_revoke_login_tokens', 'cr_action_revoke_login_tokens' );

	add_action( 'admin_post_cr_action_revoke_login_links', 'cr_action_revoke_login_links' );
}

/**
 * Security section details callback.
 *
 * @since 0.1.0
 *
 * @param array $args  The settings array (title, id, callback)
 */
function cr_section_security_cb( $args )
{
	echo '<p id="' . esc_attr( $args['id'] ) . '">' . __( 'Settings related to student login', 'course-resources' ) .'</p>';
}

/**
 * Numeric field callback.
 *
 * @since 0.1.0
 *
 * @param array $args field args
 */
function cr_field_numeric_cb( $args )
{
	$expiration = get_option( $args['name'] );
	?>
	<input
		id="<?php echo esc_attr( $args['label_for'] ); ?>"
		name="<?php echo esc_attr( $args['name'] ); ?>"
		type="number"
		min="0"
		step="1"
		value="<?php echo esc_attr( $expiration ); ?>"
	>
	<p class="description">
		<?php echo esc_html( $args['description'] ); ?>
	</p>
	<?php
}

/**
 * Revoke logins action button callback.
 *
 * @since 0.1.0
 *
 * @param array $args field args
 */
function cr_field_revoke_logins_cb( $args )
{
	?>
	<button
		type="submit"
		formaction="<?php echo admin_url('admin-post.php') ?>"
		name="action"
		value="cr_action_revoke_login_tokens"
		id="<?php echo esc_attr( $args['label_for'] ); ?>"
		class="button button-secondary"
	>
		<?php _e( 'Reset', 'course-resources' ) ?>
	</button>
	<p class="description">
		<?php _e( 'Force logout all connected users', 'course-resources' ) ?>
	</p>
	<?php
}

/**
 * Revoke login links button callback.
 *
 * @since 0.1.0
 *
 * @param array $args field args
 */
function cr_field_revoke_login_links_cb( $args )
{
	?>
	<button
		type="submit"
		formaction="<?php echo admin_url('admin-post.php') ?>"
		name="action"
		value="cr_action_revoke_login_links"
		id="<?php echo esc_attr( $args['label_for'] ); ?>"
		class="button button-secondary"
	>
		<?php _e( 'Reset', 'course-resources' ) ?>
	</button>
	<p class="description">
		<?php _e( 'Invalidate all verification codes', 'course-resources' ) ?>
	</p>
	<?php
}

/**
 * Revoke login tokens action callback.
 *
 * @since 0.1.0
 */
function cr_action_revoke_login_tokens()
{
	cr_generate_auth_secret();
	wp_safe_redirect( admin_url('admin.php?page=course-resources-admin-menu&settings-updated') );
}

/**
 * Revoke login links action callback.
 *
 * @since 0.1.0
 */
function cr_action_revoke_login_links()
{
	update_option( CR_AUTH_CODES_OPTION, array() );
	wp_safe_redirect( admin_url('admin.php?page=course-resources-admin-menu&settings-updated') );
}

/**
 * Render plugin options page callback.
 *
 * @since 0.1.0
 */
function cr_plugin_options() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( isset( $_GET['settings-updated'] ) ) {
		add_settings_error( 'wporg_messages', 'wporg_message', __( 'Settings updated', 'course-resources' ), 'info' );
	}

	settings_errors( 'wporg_messages' );
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<form action="options.php" method="post">
			<?php
			settings_fields( 'cr_options' );
			do_settings_sections( 'cr_options' );
			submit_button( __( 'Save Settings', 'course-resources' ), 'primary', 'submit', false );
			?>
		</form>
	</div>
	<?php
}
