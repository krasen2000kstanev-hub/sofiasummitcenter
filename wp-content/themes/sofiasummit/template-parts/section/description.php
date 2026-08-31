<?php
$custom_description_one = get_field('custom_description_one');
$custom_description_two = get_field('custom_description_two');
$custom_description_three = get_field('custom_description_three');
$custom_description_four = get_field('custom_description_four');
$custom_description_five = get_field('custom_description_five');
$custom_description_six = get_field('custom_description_six');

$custom_title_one = get_field('custom_title_one');
$custom_title_two = get_field('custom_title_two');
$custom_title_three = get_field('custom_title_three');
$custom_title_four = get_field('custom_title_four');
$custom_title_five = get_field('custom_title_five');
$custom_title_six = get_field('custom_title_six');


$custom_image_one = get_field('custom_image_one');
$custom_image_two = get_field('custom_image_two');
$custom_image_three = get_field('custom_image_three');
$custom_image_four = get_field('custom_image_four');
$custom_image_five = get_field('custom_image_five');
$custom_image_six = get_field('custom_image_six');

?>

<?php if ($custom_description_one): ?>
    <section class="pt-50 pb-50 section-custom-template-description">
        <div class="container">
            <div class="row j-content-center">
                <?php if ($custom_description_one):?>
                    <div class="page-content d-flex flex-col c-12 c-l-7 gap-5">
                        <p><?= wp_kses_post($custom_description_one) ?></p>
                    </div>
                <?php endif; ?>
                <?php if ($custom_description_two):?>
                    <div class="page-content d-flex flex-col c-12 c-l-7 gap-5">
                        <p><?= wp_kses_post($custom_description_two) ?></p>
                    </div>
                <?php endif; ?>
                <?php if ($custom_description_three):?>
                    <div class="page-content d-flex flex-col c-12 c-l-7 gap-5">
                        <p><?= wp_kses_post($custom_description_three) ?></p>
                    </div>
                <?php endif; ?>
                <?php if ($custom_description_four):?>
                    <div class="page-content d-flex flex-col c-12 c-l-7 gap-5">
                        <p><?= wp_kses_post($custom_description_four) ?></p>
                    </div>
                <?php endif; ?>
                <?php if ($custom_description_five):?>
                    <div class="page-content d-flex flex-col c-12 c-l-7 gap-5">
                        <p><?= wp_kses_post($custom_description_five) ?></p>
                    </div>
                <?php endif; ?>
                <?php if ($custom_description_six):?>
                    <div class="ppge-content d-flex flex-col c-12 c-l-7 gap-5">
                        <p><?= wp_kses_post($custom_description_six) ?></p>
                    </div>
                <?php endif; ?>

            </div>
        </div>
    </section>
<?php endif; ?>
