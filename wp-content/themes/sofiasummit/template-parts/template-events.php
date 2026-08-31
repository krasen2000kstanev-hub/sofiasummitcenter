<?php

/**
 * Template Name: Events
 */

get_header();
?>

<?php //include 'section/video.php'?>


    <main id="primary" class="site-main events-page">
        <div class="breadcrumbs-holder">
            <div class="container">
                <div class="breadcrumb row a-items-center pt-20 pb-20">
                    <div class="c-12">
                        <?php custom_breadcrumbs(); ?>
                    </div>
                </div>
            </div>
        </div>
        <section class="page-title-wrapper pb-50">
            <div class="container">
                <div class="row">
                    <h1 class="title page-title rel c-12 pb-15"><?= esc_html(get_the_title())?></h1>
                </div>
            </div>
        </section>
        <section class="pb-50">
            <div class="container">
                <div class="row">
                    <div class="page-content d-flex flex-col c-12 c-l-6 gap-20 pb-50">



                    </div>

                </div>
            </div>
        </section>
    </main>

<?php
get_footer();
