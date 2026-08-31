<?php

/**
 * Template Name: About Us
 */

$single_image_header = wp_get_attachment_image_src(get_field('single_image_header'),'full');
$single_image_header_tablet = wp_get_attachment_image_src(get_field('single_image_header'),'my_custom_size_full_large');
$single_image_header_mobile = wp_get_attachment_image_src(get_field('single_image_header'),'my_custom_size_large');

$about_us_main_content = get_field('about_us_main_content');
$about_us_content_one = get_field('about_us_content_one');
$about_us_content_two = get_field('about_us_content_two');
$about_us_content_three = get_field('about_us_content_three');
$about_us_content_four = get_field('about_us_content_four');
$about_us_content_five = get_field('about_us_content_five');


get_header();
?>




    <main id="primary" class="site-main about-us-page">
        <div class="breadcrumbs-holder">
            <div class="container">
                <div class="breadcrumb row a-items-center pt-20 pb-20">
                    <div class="c-12">
                        <?php custom_breadcrumbs(); ?>
                    </div>
                </div>
            </div>
        </div>

        <section class="page-title-wrapper page-image-header-wrapper pb-50">
            <div class="page-single-image">
                <img class="img w-100 d-m-block d-none" src="<?= $single_image_header[0] ?>" width="<?= $single_image_header[1] ?>" height="<?= $single_image_header[2] ?>" alt="<?= esc_html(get_the_title())?>">
                <img class="img w-100 d-none d-s-block d-m-none" src="<?= $single_image_header_tablet[0] ?>" width="<?= $single_image_header_tablet[1] ?>" height="<?= $single_image_header_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                <img class="img w-100 d-block d-s-none" src="<?= $single_image_header_mobile[0] ?>" width="<?= $single_image_header_mobile[1] ?>" height="<?= $single_image_header_mobile[2] ?>" alt="<?= esc_html(get_the_title())?>">
            </div>

        </section>
        <section class="rel o-hidden pb-50">
            <div class="container-fluid">
                <div class="row j-content-center">
                    <div class="d-flex c-12">
                        <div class="title-holder row pb-50 pt-50">
                            <h1 class="title page-title rel c-12 pb-15"><?= esc_html(get_the_title())?></h1>
                        </div>
                    </div>
                   <div class="left-side c-12 c-l-6">
                       <?php if ($about_us_main_content):?>
                           <div class="page-content d-flex flex-col gap-5">
                               <p><?= wp_kses_post($about_us_main_content) ?></p>
                           </div>
                       <?php endif;?>
                       <?php if ($about_us_content_one):?>
                           <div class="page-content d-flex flex-col gap-5">
                               <p><?= wp_kses_post($about_us_content_one) ?></p>
                           </div>
                       <?php endif;?>
                       <?php if ($about_us_content_two):?>
                           <div class="page-content d-flex flex-col gap-5 ">
                               <p><?= wp_kses_post($about_us_content_two) ?></p>
                           </div>
                       <?php endif;?>

                   </div>
                    <div class="right-side c-12 c-l-6">
                        <?php if ($about_us_content_three):?>
                            <div class="page-content d-flex flex-col gap-5">
                                <p><?= wp_kses_post($about_us_content_three) ?></p>
                            </div>
                        <?php endif;?>
                        <?php if ($about_us_content_four):?>
                            <div class="page-content d-flex flex-col gap-5">
                                <p><?= wp_kses_post($about_us_content_four) ?></p>
                            </div>
                        <?php endif;?>
                        <?php if ($about_us_content_five):?>
                            <div class="page-content d-flex flex-col gap-5">
                                <p><?= wp_kses_post($about_us_content_five) ?></p>
                            </div>
                        <?php endif;?>
                    </div>

                </div>
            </div>
        </section>
    </main>










<?php
get_footer();
