<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package SofiaSummit
 */

?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="theme-color" content="#ffffff">
    <meta name="apple-mobile-web-app-status-bar-style" content="#ffffff-translucent">

	<link rel="profile" href="https://gmpg.org/xfn/11">

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="theme/sofiasummit/assets/js/custom.js"></script>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick-theme.min.css" integrity="sha512-17EgCFERpgZKcm0j0fEq1YCJuyAWdz9KUtv1EjVuaOz8pDnh/0nZxmU6BBXwaaxqoi9PQXnRWqlcDB027hgv9A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css" integrity="sha512-yHknP1/AwR+yx26cB1y0cjvQUMvEa2PFzt1c9LlS4pRQ5NOTZFWbhBig+X9G9eYW/8m0/4OXNx8pxJ6z57x0dw==" crossorigin="anonymous" referrerpolicy="no-referrer" />



    <?php wp_head(); ?>
    <button id="scrollToTopBtn" class="scroll-to-top-btn rel" title="Scroll to Top">
        <p class="scroll-to-top-icon abs"></p>
    </button>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'sofiasummit' ); ?></a>

	<header id="masthead" class="site-header ">
		<div class="container-fluid">
            <div class="bg-holder d-flex a-items-center j-content-space-btw">
                <div class="site-branding pl-15 pr-15">
                    <?php
                    the_custom_logo();
                    if ( is_front_page() && is_home() ) :
                        ?>
                        <h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
                    <?php
                    else :
                        ?>
                        <p class="site-title d-none"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></p>
                    <?php
                    endif;
                    $sofiasummit_description = get_bloginfo( 'description', 'display' );
                    if ( $sofiasummit_description || is_customize_preview() ) :
                        ?>
                        <p class="site-description d-none"><?php echo $sofiasummit_description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></p>
                    <?php endif; ?>
                </div>

                <nav id="site-navigation" class="main-navigation pl-15 pr-15">

                    <button class="menu-toggle d-flex d-l-none" aria-controls="primary-menu" aria-expanded="false"><?php esc_html_e( 'Primary Menu', 'sofiasummit' ); ?>
                        <div class="menu-icon-wrapper d-flex flex-col a-items-end gap-10">
                            <div class="menu-icon icon-one"></div>
                            <div class="menu-icon icon-two"></div>
                            <div class="menu-icon icon-three"></div>

                        </div>

                    </button>
                    <?php
                    wp_nav_menu(
                        array(
                            'theme_location' => 'menu-1',
                            'menu_id'        => 'primary-menu',
                        )
                    );
                    ?>
                </nav>
            </div>
        </div>
	</header>
