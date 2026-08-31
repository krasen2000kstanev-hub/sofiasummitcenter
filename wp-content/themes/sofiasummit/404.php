<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package SofiaSummit
 */

get_header();
?>

	<main id="primary" class="site-main pb-50">

		<section class="error-404 not-found">
			<div class="container">
                <div class="row">
                    <header class="page-header pt-50">
                        <h1 class="title page-title rel c-12 pb-15"><?php esc_html_e( 'Тази страница не е намерена.', 'sofiasummit' ); ?></h1>
                    </header>


                    <div class="page-content-not-found pb-50 rel">
                        <a href="/" class="button abs">Начало</a>

                    </div>
                </div>
            </div>
		</section>

	</main>

<?php
get_footer();
