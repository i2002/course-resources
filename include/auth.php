<?php

use Firebase\JWT\BeforeValidException;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;

define( 'CR_AUTH_COOKIE', 'student-auth-token' );
define( 'CR_AUTH_CODES_OPTION', 'cr_login_codes' );
define( 'CR_JWT_KEY_ALG', 'HS256' );
define( 'CR_OPTION_AUTH_SECRET', 'cr_auth_secret' );

/**
 * Generate auth secret.
 *
 * @since 1.0.0
 */
function cr_generate_auth_secret( $length = 20 )
{
	$secret = bin2hex( random_bytes( $length ) );
	update_option( CR_OPTION_AUTH_SECRET, $secret );
}

/**
 * Generate JWT token.
 *
 * @since 1.0.0
 *
 * @param string $user_id    the email of the user
 * @param string $secret_key secret used to encrypt JWT
 * @return string
 */
function cr_generate_jwt_token( $user_id, $secret_key )
{
	$issued_at = time();
	$expiration_time = $issued_at + get_option( CR_SETTING_LOGIN_EXP, CR_SETTING_LOGIN_EXP_DEFAULT );

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
 * @since 1.0.0
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
 * @since 1.0.0
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
 * @since 1.0.0
 *
 * @param string $email student email
 * @return WP_Post[]
 */
function cr_get_student_courses( $email )
{
	$args = array(
		'post_type'      => CR_COURSE_TYPE,
		'posts_per_page' => -1
	);

	// show all courses for admin
	if ( ! current_user_can( 'manage_options' ) ) {
		$args['meta_query'] = array(
			array(
				'key'     => CR_COURSE_STUDENTS_META,
				'value'   => $email,
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
 * @since 1.0.0
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
 * Verify login using code.
 *
 * @since 1.0.0
 *
 * @param string $email
 * @param string $code   login code
 * @return bool|WP_Error true on success or WP_Error
 */
function cr_auth_login( $email, $code )
{
	$login_code = cr_get_login_code( $email );

	if ( $code && cr_validate_login_code( $login_code, $code ) ) {
		cr_unset_login_code( $email );
		cr_set_auth_cookie( $email );
		return true;
	}

	return new WP_Error( 'cr_invalid_auth_code', __( 'Invalid user login code', 'course-resources' ), array( 'state' => 401 ) );
}

/**
 * Set user auth cookie.
 *
 * @since 1.0.0
 *
 * @param string $email
 */
function cr_set_auth_cookie( $email )
{
	$auth_token = cr_generate_jwt_token( $email, get_option( CR_OPTION_AUTH_SECRET ) );
	setcookie( CR_AUTH_COOKIE, $auth_token, time() + get_option( CR_SETTING_LOGIN_EXP, CR_SETTING_LOGIN_EXP_DEFAULT ) );
}

/**
 * Clear student auth cookie.
 *
 * @since 1.0.0
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
 * @since 1.0.0
 *
 * @param string $email   user email
 * @param bool   $resend  whether to resend login code if another one still active
 * @return bool|WP_Error true if the email has been sent successfully, error if not
 */
function cr_auth_login_request( $email, $resend )
{
	$login_code = cr_get_login_code( $email );

	// check if email is enrolled to any course
	if ( ! cr_get_student_courses( $email ) ) {
		return new WP_Error( 'cr_auth_access_denied', __( 'The provided email address is not enrolled in any course.', 'course-resources' ), array( 'status' => 401 ) );
	}

	// valid code exists
	if ( $login_code && ! cr_login_code_expired( $login_code ) ) {
		if ( ! $resend ) {
			// do not resend if active code exists
			return true;
		} else if ( time() < $login_code['created'] + get_option( CR_SETTING_LOGIN_REQUEST_COOLDOWN, CR_SETTING_LOGIN_REQUEST_COOLDOWN_DEFAULT ) ) {
			// email sending cooldown
			return new WP_Error( 'cr_auth_email_timeout', __( 'An email has already been sent.', 'course-resources' ), array( 'status' => 429 ) );
		}
	}

	$code = cr_create_login_code( $email );

	$ret = cr_send_auth_code( $email, $code );

	// sending error
	if ( ! $ret ) {
		cr_unset_login_code( $email );
		return new WP_Error( 'cr_auth_email_error', __( 'Failed to send email. Please try again later.', 'course-resources' ), array( 'status' => 503 ) );
	}

	return $ret;
}

/**
 * Send email with login code to specified user.
 *
 * @since 1.0.0
 *
 * @param string $email the  receiver email
 * @param string $code       login code generated for sign in request
 * @return bool whether the email was sent successfully or not
 */
function cr_send_auth_code( $email, $code )
{
	$subject = __( 'Sign in to Course resources requested', 'course-resources' );
	$headers = array( 'Content-Type: text/html; charset=UTF-8' );
	$message =
		'<p>' . __( 'Hello,', 'course-resources' ) . "</p>\n" .
		'<p>' . __( 'We received a request to sign in to Course resources using this email address.', 'course-resources' ) . "</p>\n" .
		/* translators: %s: User email address */
		'<p>' . sprintf( __( 'If you want to sign in with your %s account, use this code:', 'course-resources' ), $email ) . "</p>\n" .
		'<p><strong>' . $code . "</strong></p>\n" .
		'<p>' . __( 'If you did not request this, you can safely ignore this email.', 'course-resources' ) . "</p>\n";

	add_action( 'phpmailer_init','cr_set_mail_text_body' );
	$ret = wp_mail( $email, $subject, $message, $headers );
	remove_action( 'phpmailer_init', 'cr_set_mail_text_body' );
	return $ret;
}

/**
 * Set mail text/plain alt body.
 *
 * @since 1.0.0
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
 * Get the login code associated with email.
 *
 * @since 1.0.0
 *
 * @param string $email
 * @return array|false returns the login code data if it exists, false otherwise
 */
function cr_get_login_code( $email )
{
	$login_codes = get_option( CR_AUTH_CODES_OPTION, array() );

	if ( ! key_exists( $email, $login_codes ) ) {
		return false;
	}

	return $login_codes[$email];
}

/**
 * Create and register login code associated with email.
 *
 * @since 1.0.0
 *
 * @param string $email
 * @return string the login code generated
 */
function cr_create_login_code( $email )
{
	$login_codes = get_option( CR_AUTH_CODES_OPTION, array() );

	$code = cr_generate_login_code();

	$login_codes[$email] = array(
		'code' => $code,
		'created' => time()
	);

	update_option( CR_AUTH_CODES_OPTION, $login_codes );

	return $code;
}

/**
 * Unset login code associated with email.
 *
 * @since 1.0.0
 *
 * @param string $email
 */
function cr_unset_login_code( $email )
{
	$login_codes = get_option( CR_AUTH_CODES_OPTION, array() );

	if ( key_exists( $email, $login_codes ) ) {
		unset( $login_codes[$email] );
		update_option( CR_AUTH_CODES_OPTION, $login_codes );
	}
}

/**
 * Clear expired login codes.
 *
 * @since 1.0.0
 */
function cr_clean_login_codes()
{
	$login_codes = get_option( CR_AUTH_CODES_OPTION, array() );

	$login_codes = array_filter( $login_codes, function( $login_code ) {
		return ! cr_login_code_expired( $login_code );
	} );

	update_option( CR_AUTH_CODES_OPTION, $login_codes );
}

/**
 * Check if login code is valid.
 *
 * @since 1.0.0
 *
 * @param array  $login_code  stored login code data
 * @param string $code        code sent in the request params
 * @return bool
 */
function cr_validate_login_code( $login_code, $code )
{
	return $login_code['code'] === $code && ! cr_login_code_expired( $login_code );
}

/**
 * Check if login code has expired.
 *
 * @since 1.0.0
 *
 * @param array $login_code  login code data
 * @return bool
 */
function cr_login_code_expired( $login_code )
{
	return time() >= $login_code['created'] + get_option( CR_SETTING_LOGIN_LINK_EXP, CR_SETTING_LOGIN_LINK_EXP_DEFAULT );
}

/**
 * Generate login code
 *
 * @since 1.0.0
 *
 * @param int $length code length
 * @return int
 */
function cr_generate_login_code( $length = 6 )
{
	// generate random code
	$randomCode = bin2hex( random_bytes( $length ) );
	$randomCode = substr( $randomCode, 0, $length );

	return $randomCode;
}
