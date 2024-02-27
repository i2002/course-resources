<?php

use Firebase\JWT\BeforeValidException;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;

define( 'CR_AUTH_COOKIE', 'student-auth-token' );
define( 'CR_AUTH_LINKS_OPTION', 'cr_magic_links' );
define( 'CR_JWT_KEY_ALG', 'HS256' );
define( 'CR_OPTION_AUTH_SECRET', 'cr_auth_secret' );

/**
 * Generate auth secret.
 *
 * @since 0.1.0
 */
function cr_generate_auth_secret( $length = 20 )
{
	$secret = bin2hex( random_bytes( $length ) );
	update_option( CR_OPTION_AUTH_SECRET, $secret );
}

/**
 * Generate JWT token.
 *
 * @since 0.1.0
 *
 * @param string $user_id    the email of the user
 * @param string $secret_key secret used to encrypt JWT
 * @return string
 */
function cr_generate_jwt_token( $user_id, $secret_key )
{
	$issued_at = time();
	$expiration_time = $issued_at + get_option( CR_SETTING_LOGIN_EXP );

	$payload = array(
		'iat' => $issued_at,
		'exp' => $expiration_time,
		'sub' => $user_id
	);

	return JWT::encode( $payload, $secret_key, CR_JWT_KEY_ALG );
}

/**
 * Validate JWT token.
 *
 * @since 0.1.0
 *
 * @param string $jwt_token  the token to be validated
 * @param string $secret_key key used to encrypt JWT
 */
function cr_validate_jwt_token( $jwt_token, $secret_key )
{
	try {
		return JWT::decode( $jwt_token, new Key( $secret_key, CR_JWT_KEY_ALG ) );
	} catch ( ExpiredException $e ) {
		throw new Exception( 'Token expired' );
	} catch ( SignatureInvalidException $e ) {
		throw new Exception( 'Invalid token signature' );
	} catch ( BeforeValidException $e ) {
		throw new Exception( 'Token not valid yet' );
	} catch ( Exception $e ) {
		throw new Exception( 'Invalid token' );
	}
}

/**
 * Get the email of currently logged in student.
 *
 * @since 0.1.0
 *
 * @return string|bool Returns the email of the logged in student, or false if no active login
 */
function cr_get_current_student()
{
	if ( !isset( $_COOKIE[CR_AUTH_COOKIE] ) ) {
		return false;
	}

	$token = $_COOKIE[CR_AUTH_COOKIE];

	try {
		$decoded = cr_validate_jwt_token( $token, get_option( CR_OPTION_AUTH_SECRET ) );
		return $decoded->sub;
	} catch ( Exception $e ) {
		return false;
	}
}

/**
 * Get all courses that a student is enrolled to.
 *
 * @since 0.1.0
 *
 * @param string $email student email
 * @return WP_Post[]
 */
function cr_get_student_courses( $email )
{
	$args = array(
		'post_type' => CR_COURSE_TYPE,
		'posts_per_page' => -1
	);

	// show all courses for admin
	if ( ! current_user_can( 'manage_options' ) ) {
		$args['meta_query'] = array(
			array(
				'key' => CR_COURSE_STUDENTS_META,
				'value' => $email,
				'compare' => 'LIKE',
			),
		);
	}
	$courses = get_posts( $args );

	return $courses;
}

/**
 * Check if student is enrolled to course.
 *
 * @since 0.1.0
 *
 * @param string $email      student email
 * @param int    $course_id  the course to check
 * @return bool|null Returns null if invalid $course_id, or bool whether the student is enrolled to the course or not
 */
function cr_is_student_enrolled( $email, $course_id )
{
	$course = get_post( $course_id );

	if ( ! $course || $course->post_type !== CR_COURSE_TYPE ) {
		return null;
	}

	$students = get_post_meta( $course_id, CR_COURSE_STUDENTS_META );

	if ( $students === false || $students === '' ) {
		return null;
	}

	return in_array( $email,  $students );
}

/**
 * Create student auth cookie.
 *
 * @since 0.1.0
 *
 * @param string $email
 */
function cr_auth_login( $email )
{
	$auth_token = cr_generate_jwt_token( $email, get_option( CR_OPTION_AUTH_SECRET ) );
	setcookie( CR_AUTH_COOKIE, $auth_token, time() + get_option( CR_SETTING_LOGIN_EXP ) );
}

/**
 * Clear student auth cookie.
 *
 * @since 0.1.0
 */
function cr_auth_logout()
{
	if ( isset( $_COOKIE[CR_AUTH_COOKIE] ) ) {
		setcookie( CR_AUTH_COOKIE, '', time() - 1000 );
	}
}

/**
 * Generate and send email with login link.
 *
 * @since 0.1.0
 *
 * @param string $email        user email
 * @param string $redirect_url url to redirect to after successful login
 * @return bool|WP_Error true if the email has been sent successfully, error if not
 */
function cr_auth_login_request( $email, $redirect_url )
{
	$login_token = cr_get_login_link( $email );

	// check if email is enrolled to any course
	if ( empty( cr_get_student_courses( $email ) ) ) {
		return new WP_Error( 'cr_auth_access_denied', 'The provided email address is not enrolled in any course.', array( 'status' => 401 ) );
	}

	// email sending rate limiting
    if ( $login_token && time() < $login_token['created'] + get_option( CR_SETTING_LOGIN_REQUEST_COOLDOWN ) ) {
		return new WP_Error( 'cr_auth_email_timeout', __( 'An email has already been sent.', CR_TEXT_DOMAIN ), array( 'status' => 429 ) );
	}

	$magic_link_token = cr_create_login_link( $email );

	$ret = cr_send_auth_link( $email, $redirect_url, $magic_link_token );

	// sending error
	if ( ! $ret ) {
		cr_unset_login_link( $email );
		return new WP_Error( 'cr_auth_email_error', 'Failed to send email. Please try again later.', array( 'status' => 503 ) );
	}

	return $ret;
}

/**
 * Send email with login link to specified user.
 *
 * @since 0.1.0
 *
 * @param string $email the     receiver email
 * @param string $redirect_url  url to redirect to after successful login
 * @param string $token magic   link token generated for sign in request
 * @return bool whether the email was sent successfully or not
 */
function cr_send_auth_link( $email, $redirect_url, $token )
{
	$login_url = get_site_url() . "?cr_login&code=$token&email=$email&redirect_url=$redirect_url";

	$subject = __( 'Sign in to Course resources requested', CR_TEXT_DOMAIN );
	$headers = array( 'Content-Type: text/html; charset=UTF-8' );
	$message =
		'<p>' . __( 'Hello,', CR_TEXT_DOMAIN ) . '</p>' .
		'<p>' . __( 'We received a request to sign in to Course resources using this email address.', CR_TEXT_DOMAIN ) . '</p>' .
		'<p>' . sprintf( __( 'If you want to sign in with your %s account, click this link:', CR_TEXT_DOMAIN ), $email ) . '</p>' .
		'<p><a href="' . $login_url . '">' . $login_url . '</a></p>' .
		'<p>' . __( 'If you did not request this link, you can safely ignore this email.', CR_TEXT_DOMAIN ) . '</p>';

	add_action( 'phpmailer_init','cr_set_mail_text_body' );
	$ret = wp_mail( $email, $subject, $message, $headers );
	remove_action( 'phpmailer_init', 'cr_set_mail_text_body' );
	return $ret;
}

/**
 * Set mail text/plain alt body.
 *
 * @since 0.1.0
 *
 * @param PHPMailer $phpmailer The PHPMailer instance (passed by reference).
 */
function cr_set_mail_text_body( $phpmailer )
{
	if ( empty( $phpmailer->AltBody ) ) {
		$phpmailer->AltBody = wp_strip_all_tags( $phpmailer->Body );
	}
}

/**
 * Handle magic link requests.
 * Checks if the token is valid and redirects user to app page.
 *
 * @since 0.1.0
 */
function cr_magic_link_handler()
{
    if ( isset( $_GET['cr_login'] ) && isset( $_GET['code'] ) && isset( $_GET['email'] ) && isset( $_GET['redirect_url'] ) ) {
		$email = sanitize_email( $_GET['email'] );
		$token = $_GET['code'];
		$redirect_url = sanitize_url( $_GET['redirect_url'] );

		$login_token = cr_get_login_link( $email );

		if ( $login_token && cr_validate_login_link( $login_token, $token ) ) {
			cr_auth_login( $email );
			cr_unset_login_link( $email );
		} else {
			$redirect_url .= '#/login?error=invalid_code';
		}

		wp_redirect( get_site_url() . $redirect_url );
		exit;
    }
}

/**
 * Get the login token associated with email.
 *
 * @since 0.1.0
 *
 * @param string $email
 * @return array|false returns the login token data if it exists, false otherwise
 */
function cr_get_login_link( $email )
{
	$login_links = get_option( CR_AUTH_LINKS_OPTION, array() );

	if ( ! key_exists( $email, $login_links ) ) {
		return false;
	}

	return $login_links[$email];
}

/**
 * Create and register login link associated with email.
 *
 * @since 0.1.0
 *
 * @param string $email
 * @return string the login token generated
 */
function cr_create_login_link( $email )
{
	$login_links = get_option( CR_AUTH_LINKS_OPTION, array() );

	$magic_link_token = cr_generate_magic_link_token();

	$login_links[$email] = array(
		'token' => $magic_link_token,
		'created' => time()
	);

	update_option( CR_AUTH_LINKS_OPTION, $login_links );

	return $magic_link_token;
}

/**
 * Unset login link associated with email.
 *
 * @since 0.1.0
 *
 * @param string $email
 */
function cr_unset_login_link( $email )
{
	$login_links = get_option( CR_AUTH_LINKS_OPTION, array() );

	if ( key_exists( $email, $login_links ) ) {
		unset( $login_links[$email] );
		update_option( CR_AUTH_LINKS_OPTION, $login_links );
	}
}

/**
 * Clear expired login links.
 *
 * @since 0.1.0
 */
function cr_clean_login_links()
{
	$login_links = get_option( CR_AUTH_LINKS_OPTION, array() );

	$login_links = array_filter( $login_links, function( $login_link ) {
		return ! cr_login_link_expired( $login_link );
	} );

	update_option( CR_AUTH_LINKS_OPTION, $login_links );
}

/**
 * Check if login link is valid.
 *
 * @since 0.1.0
 *
 * @param array  $login_link  stored login link data
 * @param string $token       token sent in the request params
 * @return bool
 */
function cr_validate_login_link( $login_link, $token )
{
	return $login_link['token'] === $token && ! cr_login_link_expired( $login_link );
}

/**
 * Check if login link has expired.
 *
 * @since 0.1.0
 *
 * @param array $login_link  login link data
 * @return bool
 */
function cr_login_link_expired( $login_link )
{
	return time() >= $login_link['created'] + get_option( CR_SETTING_LOGIN_LINK_EXP );
}

/**
 * Generate base64 url random token.
 *
 * @since 0.1.0
 *
 * @param int $length initial random token length (before base64 encode)
 * @return int
 */
function cr_generate_magic_link_token( $length = 20 )
{
	// generate random token
	$randomToken = bin2hex( random_bytes( $length ) );

	// base64 encode url
	return str_replace( ['+', '/', '='], ['-', '_', ''], base64_encode( $randomToken ) );
}
