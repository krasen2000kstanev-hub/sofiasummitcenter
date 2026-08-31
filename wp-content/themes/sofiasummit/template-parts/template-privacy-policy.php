<?php

/**
 * Template Name: Privacy Policy
 */


$custom_description_one = get_field('custom_description_one');
$custom_description_two = get_field('custom_description_two');
$custom_description_three = get_field('custom_description_three');
$custom_description_four = get_field('custom_description_four');
$custom_description_five = get_field('custom_description_five');
$custom_description_six = get_field('custom_description_six');

get_header();
?>

    <main id="primary" class="site-main privacy-policy-page">
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
                    <?php if ($custom_description_one):?>
                        <div class="page-content d-flex flex-col c-12 gap-20">
                            <p><?= wp_kses_post($custom_description_one) ?></p>
                        </div>
                    <?php endif; ?>
                    <?php if ($custom_description_two):?>
                        <div class="page-content d-flex flex-col c-12 gap-20">
                            <p><?= wp_kses_post($custom_description_two) ?></p>
                        </div>
                    <?php endif; ?>
                    <?php if ($custom_description_three):?>
                        <div class="page-content d-flex flex-col c-12 gap-20">
                            <p><?= wp_kses_post($custom_description_three) ?></p>
                        </div>
                    <?php endif; ?>
                    <?php if ($custom_description_four):?>
                        <div class="page-content d-flex flex-col c-12 gap-20">
                            <p><?= wp_kses_post($custom_description_four) ?></p>
                        </div>
                    <?php endif; ?>
                    <?php if ($custom_description_five):?>
                        <div class="page-content d-flex flex-col c-12 gap-20">
                            <p><?= wp_kses_post($custom_description_five) ?></p>
                        </div>
                    <?php endif; ?>
                    <?php if ($custom_description_six):?>
                        <div class="ppge-content d-flex flex-col c-12 gap-20">
                            <p><?= wp_kses_post($custom_description_six) ?></p>
                        </div>
                    <?php endif; ?>

                </div>
            </div>
        </section>
    </main>

<?php
get_footer();
