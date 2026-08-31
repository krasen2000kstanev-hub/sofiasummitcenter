<?php

$single_description = get_field('single_description');
$single_description_second = get_field('single_description_second');

$single_description_image = wp_get_attachment_image_src(get_field('single_description_image'), 'full');

get_header();
?>

    <main id="primary" class="site-main format-page custom-template">

        <section class="page-title-wrapper pt-20 pb-20">
            <div class="container">
                <div class="row">
                    <h1 class="title page-title rel c-12 pb-15"><?= esc_html(get_the_title())?></h1>
                </div>
            </div>
        </section>

        <?php include get_template_directory() . '/template-parts/section/carousel.php'; ?>




        <?php if ($single_description):?>
            <section class="single-description pt-50">
                <div class="container">
                    <div class="row">
                        <?php if ($single_description_image):?>
                            <div class="c-12 c-m-4 py-20 small-image">
                                <img class="img-d img w-100" src="<?= $single_description_image[0] ?>" width="<?= $single_description_image[1] ?>" height="<?= $single_description_image[2] ?>" alt="<?= esc_html(get_the_title())?>">
                            </div>
                            <div class="page-content c-12 c-m-8  ">
                                <p><?= wp_kses_post($single_description)?></p>
                                <p><?= wp_kses_post($single_description_second)?></p>
                            </div>
                        <?php else: ?>
                            <div class="page-content c-12">
                                <p><?= wp_kses_post($single_description)?></p>
                                <p><?= wp_kses_post($single_description_second)?></p>
                            </div>
                        <?php  endif; ?>
                    </div>
                </div>
            </section>

        <?php endif; ?>

        <?php include get_template_directory() . '/template-parts/section/section-services.php'; ?>

        <?php include get_template_directory() . '/template-parts/section/section-contact.php'; ?>



    </main>

<?php
get_footer();
