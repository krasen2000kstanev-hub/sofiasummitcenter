<?php

$carousel_image_one = wp_get_attachment_image_src(get_field('carousel_image_one'), 'full');
$carousel_image_two = wp_get_attachment_image_src(get_field('carousel_image_two'), 'full');
$carousel_image_three = wp_get_attachment_image_src(get_field('carousel_image_three'), 'full');
$carousel_image_four = wp_get_attachment_image_src(get_field('carousel_image_four'), 'full');
$carousel_image_five = wp_get_attachment_image_src(get_field('carousel_image_five'), 'full');
$carousel_image_six = wp_get_attachment_image_src(get_field('carousel_image_six'), 'full');


$carousel_image_one_tablet = wp_get_attachment_image_src(get_field('carousel_image_one'), 'my_custom_size_full_large');
$carousel_image_two_tablet = wp_get_attachment_image_src(get_field('carousel_image_two'), 'my_custom_size_full_large');
$carousel_image_three_tablet = wp_get_attachment_image_src(get_field('carousel_image_three'), 'my_custom_size_full_large');
$carousel_image_four_tablet = wp_get_attachment_image_src(get_field('carousel_image_four'), 'my_custom_size_full_large');
$carousel_image_five_tablet = wp_get_attachment_image_src(get_field('carousel_image_five'), 'my_custom_size_full_large');
$carousel_image_six_tablet = wp_get_attachment_image_src(get_field('carousel_image_six'), 'my_custom_size_full_large');


$carousel_image_one_mobile = wp_get_attachment_image_src(get_field('carousel_image_one'), 'my_custom_size_large');
$carousel_image_two_mobile = wp_get_attachment_image_src(get_field('carousel_image_two'), 'my_custom_size_large');
$carousel_image_three_mobile = wp_get_attachment_image_src(get_field('carousel_image_three'), 'my_custom_size_large');
$carousel_image_four_mobile = wp_get_attachment_image_src(get_field('carousel_image_four'), 'my_custom_size_large');
$carousel_image_five_mobile = wp_get_attachment_image_src(get_field('carousel_image_five'), 'my_custom_size_large');
$carousel_image_six_mobile = wp_get_attachment_image_src(get_field('carousel_image_six'), 'my_custom_size_large');

?>


<section class="carousel-wrapper">
    <div class="container-fluid p-0">
        <div class="d-flex w-100">
            <div class="page-content d-flex flex-col w-100 rel">
                <div class="d-flex a-items-center w-100 carousel-container carousel slider">
                    <?php if ($carousel_image_one):?>
                        <div>
                            <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_one[0] ?>" width="<?= $carousel_image_one[1] ?>" height="<?= $carousel_image_one[2] ?>" alt="<?= esc_html(get_the_title())?>">
                            <img class="img-t img w-100 d-none d-s-block d-m-none" src="<?= $carousel_image_one_tablet[0] ?>" width="<?= $carousel_image_one_tablet[1] ?>" height="<?= $carousel_image_one_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                            <img class="img-m img w-100 d-block d-s-none" src="<?= $carousel_image_one_mobile[0] ?>" width="<?= $carousel_image_one_mobile[1] ?>" height="<?= $carousel_image_one_mobile[2] ?>" alt="<?= esc_html(get_the_title())?>">
                        </div>
                    <?php endif; ?>
                    <?php if ($carousel_image_two):?>
                        <div>
                            <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_two[0] ?>" width="<?= $carousel_image_two[1] ?>" height="<?= $carousel_image_two[2] ?>" alt="<?= esc_html(get_the_title())?>">
                            <img class="img-t img w-100 d-none d-s-block d-m-none" src="<?= $carousel_image_two_tablet[0] ?>" width="<?= $carousel_image_two_tablet[1] ?>" height="<?= $carousel_image_two_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                            <img class="img-m img w-100 d-block d-s-none" src="<?= $carousel_image_two_mobile[0] ?>" width="<?= $carousel_image_two_mobile[1] ?>" height="<?= $carousel_image_two_mobile[2] ?>" alt="<?= esc_html(get_the_title())?>">
                        </div>
                    <?php endif; ?>
                    <?php if ($carousel_image_three):?>
                       <div>
                           <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_three[0] ?>" width="<?= $carousel_image_three[1] ?>" height="<?= $carousel_image_three[2] ?>" alt="<?= esc_html(get_the_title())?>">
                           <img class="img-t img w-100 d-none d-s-block d-m-none" src="<?= $carousel_image_three_tablet[0] ?>" width="<?= $carousel_image_three_tablet[1] ?>" height="<?= $carousel_image_three_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                           <img class="img-m img w-100 d-block d-s-none" src="<?= $carousel_image_three_mobile[0] ?>" width="<?= $carousel_image_three_mobile[1] ?>" height="<?= $carousel_image_three_mobile[2] ?>" alt="<?= esc_html(get_the_title())?>">
                       </div>
                    <?php endif; ?>
                    <?php if ($carousel_image_four):?>
                       <div>
                           <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_four[0] ?>" width="<?= $carousel_image_four[1] ?>" height="<?= $carousel_image_four[2] ?>" alt="<?= esc_html(get_the_title())?>">
                           <img class="img-t img w-100 d-none d-s-block d-m-none" src="<?= $carousel_image_four_tablet[0] ?>" width="<?= $carousel_image_four_tablet[1] ?>" height="<?= $carousel_image_four_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                           <img class="img-m img w-100 d-block d-s-none" src="<?= $carousel_image_four_mobile[0] ?>" width="<?= $carousel_image_four_mobile[1] ?>" height="<?= $carousel_image_four_mobile[2] ?>" alt="<?= esc_html(get_the_title())?>">
                       </div>
                    <?php endif; ?>
                    <?php if ($carousel_image_five):?>
                        <div>
                            <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_five[0] ?>" width="<?= $carousel_image_five[1] ?>" height="<?= $carousel_image_five[2] ?>" alt="<?= esc_html(get_the_title())?>">
                            <img class="img-t img w-100 d-none d-s-block d-m-none" src="<?= $carousel_image_five_tablet[0] ?>" width="<?= $carousel_image_five_tablet[1] ?>" height="<?= $carousel_image_five_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                            <img class="img-m img w-100 d-block d-s-none" src="<?= $carousel_image_five_mobile[0] ?>" width="<?= $carousel_image_five_mobile[1] ?>" height="<?= $carousel_image_five_mobile[2] ?>" alt="<?= esc_html(get_the_title())?>">
                        </div>
                    <?php endif; ?>
                    <?php if ($carousel_image_six):?>
                       <div>
                           <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_six[0] ?>" width="<?= $carousel_image_six[1] ?>" height="<?= $carousel_image_six[2] ?>" alt="<?= esc_html(get_the_title())?>">
                           <img class="img-t img w-100 d-none d-s-block d-m-none" src="<?= $carousel_image_six_tablet[0] ?>" width="<?= $carousel_image_six_tablet[1] ?>" height="<?= $carousel_image_six_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                           <img class="img-m img w-100 d-block d-s-none" src="<?= $carousel_image_six_mobile[0] ?>" width="<?= $carousel_image_six_mobile[1] ?>" height="<?= $carousel_image_six_mobile[2] ?>" alt="<?= esc_html(get_the_title())?>">
                       </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</section>

