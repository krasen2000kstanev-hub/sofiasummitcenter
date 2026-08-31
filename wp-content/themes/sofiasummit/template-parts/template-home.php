<?php

/**
 * Template Name: Home
 */

session_start();
$screenWidth = isset($_SESSION['screen_width']) ? $_SESSION['screen_width'] : null;



// Carousel image size

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


// Carousel descriptions

$carousel_title_one = get_field('carousel_title_one');
$carousel_description_one = get_field('carousel_description_one');

$carousel_title_two = get_field('carousel_title_two');
$carousel_description_two = get_field('carousel_description_two');

$carousel_title_three = get_field('carousel_title_three');
$carousel_description_three = get_field('carousel_description_three');

$carousel_title_four = get_field('carousel_title_four');
$carousel_description_four = get_field('carousel_description_four');

$carousel_title_five = get_field('carousel_title_five');
$carousel_description_five = get_field('carousel_description_five');

$carousel_title_six = get_field('carousel_title_six');
$carousel_description_six = get_field('carousel_description_six');

// Description

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


$custom_image_one = wp_get_attachment_image_src(get_field('custom_image_one'), 'my_custom_full');
$custom_image_two = wp_get_attachment_image_src(get_field('custom_image_two'), 'my_custom_full');
$custom_image_three = wp_get_attachment_image_src(get_field('custom_image_three'), 'my_custom_full');
$custom_image_four = wp_get_attachment_image_src(get_field('custom_image_four'), 'my_custom_full');
$custom_image_five = wp_get_attachment_image_src(get_field('custom_image_five'), 'my_custom_full');
$custom_image_six = wp_get_attachment_image_src(get_field('custom_image_six'), 'my_custom_full');

get_header();
?>
    <main id="primary" class="site-main home-page">
        <section class="carousel-wrapper rel">
            <div class="">
                <div class="d-flex w-100">
                    <div class="page-content d-flex flex-col w-100 rel">

                        <div class="d-flex a-items-center w-100 carousel-container carousel slider">
                            <?php if ($carousel_image_one):?>
                                <div class="rel">
                                    <div class="carousel-main-title abs c-12">
                                        <h1 class="title"><?=esc_html($carousel_title_one)?></h1>
                                        <p><?= wp_kses_post($carousel_description_one) ?></p>
                                    </div>

                                    <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_one[0] ?>" width="<?= $carousel_image_one[1] ?>" height="<?= $carousel_image_one[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <img class="img-t img w-100 d-block d-m-none" src="<?= $carousel_image_one_tablet[0] ?>" width="<?= $carousel_image_one_tablet[1] ?>" height="<?= $carousel_image_one_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <div class="menu-overlay abs w-100 h-100"></div>
                                </div>
                            <?php endif; ?>
                            <?php if ($carousel_image_two):?>
                                <div class="rel">
                                    <div class="carousel-main-title abs c-12">
                                        <h1 class="title"><?=esc_html($carousel_title_two)?></h1>
                                        <p><?= wp_kses_post($carousel_description_two) ?></p>
                                        <a class="main-button" href="><?php echo get_home_url(); ?></зали/конферентна-зали">Виж още</a>
                                    </div>
                                    <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_two[0] ?>" width="<?= $carousel_image_two[1] ?>" height="<?= $carousel_image_two[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <img class="img-t img w-100 d-block d-m-none" src="<?= $carousel_image_two_tablet[0] ?>" width="<?= $carousel_image_two_tablet[1] ?>" height="<?= $carousel_image_two_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <div class="menu-overlay abs w-100 h-100"></div>
                                </div>
                            <?php endif; ?>
                            <?php if ($carousel_image_three):?>
                                <div class="rel">
                                    <div class="carousel-main-title abs c-12">
                                        <h1 class="title"><?=esc_html($carousel_title_three)?></h1>
                                        <p><?= wp_kses_post($carousel_description_three) ?></p>
                                        <a class="main-button" href="><?php echo get_home_url(); ?></зали/заседателна-зала">Виж още</a>
                                    </div>
                                    <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_three[0] ?>" width="<?= $carousel_image_three[1] ?>" height="<?= $carousel_image_three[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <img class="img-t img w-100 d-block d-m-none" src="<?= $carousel_image_three_tablet[0] ?>" width="<?= $carousel_image_three_tablet[1] ?>" height="<?= $carousel_image_three_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <div class="menu-overlay abs w-100 h-100"></div>
                                </div>
                            <?php endif; ?>
                            <?php if ($carousel_image_four):?>
                                <div class="rel">
                                    <div class="carousel-main-title abs c-12">
                                        <h1 class="title"><?=esc_html($carousel_title_four)?></h1>
                                        <p><?= wp_kses_post($carousel_description_four) ?></p>
                                        <a class="main-button" href="><?php echo get_home_url(); ?></зали/временен-офис">Виж още</a>

                                    </div>
                                    <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_four[0] ?>" width="<?= $carousel_image_four[1] ?>" height="<?= $carousel_image_four[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <img class="img-t img w-100 d-block d-m-none" src="<?= $carousel_image_four_tablet[0] ?>" width="<?= $carousel_image_four_tablet[1] ?>" height="<?= $carousel_image_four_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <div class="menu-overlay abs w-100 h-100"></div>
                                </div>
                            <?php endif; ?>
                            <?php if ($carousel_image_five):?>
                                <div class="rel">
                                    <div class="carousel-main-title abs c-12">
                                        <h1 class="title"><?=esc_html($carousel_title_five)?></h1>
                                        <p><?= wp_kses_post($carousel_description_five) ?></p>
                                    </div>
                                    <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_five[0] ?>" width="<?= $carousel_image_five[1] ?>" height="<?= $carousel_image_five[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <img class="img-t img w-100 d-block d-m-none" src="<?= $carousel_image_five_tablet[0] ?>" width="<?= $carousel_image_five_tablet[1] ?>" height="<?= $carousel_image_five_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <div class="menu-overlay abs w-100 h-100"></div>
                                </div>
                            <?php endif; ?>
                            <?php if ($carousel_image_six):?>
                                <div class="rel">
                                    <div class="carousel-main-title abs c-12">
                                        <h1 class="title"><?=esc_html($carousel_title_six)?></h1>
                                        <p><?= wp_kses_post($carousel_description_six) ?></p>
                                    </div>
                                    <img class="img-d img w-100 d-m-block d-none" src="<?= $carousel_image_six[0] ?>" width="<?= $carousel_image_six[1] ?>" height="<?= $carousel_image_six[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <img class="img-t img w-100 d-block d-m-none" src="<?= $carousel_image_six_tablet[0] ?>" width="<?= $carousel_image_six_tablet[1] ?>" height="<?= $carousel_image_six_tablet[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                    <div class="menu-overlay abs w-100 h-100"></div>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <script>
            document.addEventListener('DOMContentLoaded', function() {
                if ('IntersectionObserver' in window) {
                    const observerOptions = {
                        root: null,
                        rootMargin: '0px',
                        threshold: 0.5 // Change this value to adjust when the animation starts
                    };

                    const observer = new IntersectionObserver((entries, observer) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.querySelector('.carousel-main-title').classList.add('show');
                            } else {
                                entry.target.querySelector('.carousel-main-title').classList.remove('show');
                            }
                        });
                    }, observerOptions);

                    const carouselItems = document.querySelectorAll('.carousel-container > div');
                    carouselItems.forEach(item => {
                        observer.observe(item);
                    });
                } else {
                    // Fallback for browsers that do not support IntersectionObserver
                    const carouselItems = document.querySelectorAll('.carousel-container > div');
                    window.addEventListener('scroll', function() {
                        carouselItems.forEach(item => {
                            const rect = item.getBoundingClientRect();
                            if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
                                item.querySelector('.carousel-main-title').classList.add('show');
                            } else {
                                item.querySelector('.carousel-main-title').classList.remove('show');
                            }
                        });
                    });
                }
            });
        </script>


        <section class="section-custom-template-description">
            <div class="container-fluid">
                <div class="d-flex flex-col">

                    <?php if ($custom_description_one):?>
                            <div class="row-position row">
                                <div class="c-12 c-l-6 pb-20 d-flex flex-col a-items-center j-content-center">
                                    <h2 class="title"><?=esc_html($custom_title_one)?></h2>
                                    <div class="description-holder">
                                        <p><?= wp_kses_post($custom_description_one) ?></p>
                                    </div>
                                    <a class="main-button" href="><?php echo get_home_url(); ?></зали/конферентна-зали">Прочети още</a>
                                </div>
                                <div class="image-holder c-12 c-l-6">
                                    <img class="img-d img w-100" src="<?= $custom_image_one[0] ?>" width="<?= $custom_image_one[1] ?>" height="<?= $custom_image_one[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                </div>
                            </div>


                    <?php endif; ?>

                    <?php if ($custom_description_two):?>
                            <div class="row-position row ">

                                <div class="image-holder c-12 c-l-6">
                                    <img class="img-d img w-100" src="<?= $custom_image_two[0] ?>" width="<?= $custom_image_two[1] ?>" height="<?= $custom_image_two[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                </div>
                                <div class="c-12 c-l-6 pb-20 d-flex flex-col a-items-center j-content-center">
                                    <h2 class="title"><?=esc_html($custom_title_two)?></h2>
                                    <div class="description-holder">
                                        <p><?= wp_kses_post($custom_description_two) ?></p>
                                    </div>
                                    <a class="main-button" href="><?php echo get_home_url(); ?></зали/заседателна-зала">Прочети още</a>
                                </div>
                            </div>


                    <?php endif; ?>

                    <?php if ($custom_description_three):?>

                            <div class="row-position row ">
                                <div class="c-12 c-l-6 pb-20 d-flex flex-col a-items-center j-content-center">
                                    <h2 class="title"><?=esc_html($custom_title_three)?></h2>
                                    <div class="description-holder">
                                        <p><?= wp_kses_post($custom_description_three) ?></p>

                                    </div>
                                    <a class="main-button" href="><?php echo get_home_url(); ?></">Прочети още</a>
                                </div>
                                <div class="image-holder c-12 c-l-6">
                                    <img class="img-d img w-100" src="<?= $custom_image_three[0] ?>" width="<?= $custom_image_three[1] ?>" height="<?= $custom_image_three[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                </div>
                            </div>


                    <?php endif; ?>

                    <?php if ($custom_description_four):?>

                            <div class="row-position row">

                                <div class="image-holder c-12 c-l-6">
                                    <img class="img-d img w-100" src="<?= $custom_image_four[0] ?>" width="<?= $custom_image_four[1] ?>" height="<?= $custom_image_four[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                </div>
                                <div class="c-12 c-l-6 pb-20 d-flex flex-col a-items-center j-content-center">
                                    <h2 class="title"><?=esc_html($custom_title_four)?></h2>
                                    <div class="description-holder">
                                        <p><?= wp_kses_post($custom_description_four) ?></p>
                                    </div>
                                    <a class="main-button" href="><?php echo get_home_url(); ?></">Прочети още</a>
                                </div>

                            </div>


                    <?php endif; ?>

                    <?php if ($custom_description_five):?>

                            <div class="row-position row">
                                <div class="c-12 c-l-6 pb-20 d-flex flex-col a-items-center j-content-center">
                                    <h2 class="title"><?=esc_html($custom_title_five)?></h2>
                                    <div class="description-holder">
                                        <p><?= wp_kses_post($custom_description_five) ?></p>
                                    </div>
                                    <a class="main-button" href="><?php echo get_home_url(); ?></">Прочети още</a>
                                </div>
                                <div class="image-holder c-12 c-l-6">
                                    <img class="img-d img w-100" src="<?= $custom_image_five[0] ?>" width="<?= $custom_image_five[1] ?>" height="<?= $custom_image_five[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                </div>
                            </div>


                    <?php endif; ?>

                    <?php if ($custom_description_six):?>

                            <div class="row-position row">

                                <div class="image-holder c-12 c-l-6">
                                    <img class="img-d img w-100" src="<?= $custom_image_six[0] ?>" width="<?= $custom_image_six[1] ?>" height="<?= $custom_image_six[2] ?>" alt="<?= esc_html(get_the_title())?>">
                                </div>
                                <div class="c-12 c-l-6 pb-20 d-flex flex-col a-items-center j-content-center">
                                    <h2 class="title"><?=esc_html($custom_title_six)?></h2>
                                    <div class="description-holder">
                                        <p><?= wp_kses_post($custom_description_six) ?></p>
                                    </div>
                                    <a class="main-button" href="><?php echo get_home_url(); ?></">Прочети още</a>
                                </div>

                            </div>

                       
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <?php include get_template_directory() . '/template-parts/section/presentation-download.php'; ?>

        <?php include get_template_directory() . '/template-parts/section/section-services.php'; ?>

        <?php include get_template_directory() . '/template-parts/section/section-contact.php'; ?>



    </main>
<?php
get_footer();
