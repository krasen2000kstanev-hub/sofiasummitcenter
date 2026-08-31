<?php
$product_presentation = get_field('product_presentation');


?>

<section class="presentation-download pt-50 pb-50">
    <div class="container">
        <div>
            <div class="contact-button-holder d-flex j-content-center c-12">
                <a class="contact-button d-flex a-items-center j-content-center p-10" href="<?= esc_url($product_presentation['url']) ?>" download>Свалете презентацията</a>
            </div>
        </div>
    </div>
</section>