<?php
$title = get_field('title');
$content = get_field('content');
?>

<section class="section-contact-us">
    <div class="container-fluid pt-50 pb-50 rel">
        <div class="d-flex flex-col gap-20">
            <div class="section-contact-us-description d-flex flex-col a-items-center c-12 gap-10">
                <h2 class="title t-center"><?=esc_html($title) ?></h2>
                <p><?= wp_kses_post($content) ?></p>
            </div>
            <div class="contact-button-holder d-flex j-content-center c-12">
                <a class="contact-button d-flex a-items-center j-content-center p-10" href="><?php echo get_home_url(); ?></контакти">Свържете се с нас</a>
            </div>
        </div>
        <div class="menu-overlay abs w-100 h-100"></div>

    </div>
</section>