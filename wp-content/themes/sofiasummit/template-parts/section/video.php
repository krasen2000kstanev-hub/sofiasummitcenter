<?php


$upload_video = get_field('upload_video');
$type_upload_video = get_field('type_upload_video');

$video_description_one = get_field('video_description_one');
$video_description_two = get_field('video_description_two');
?>
<?php if ($upload_video): ?>

    <section class="pt-50 pb-50">
        <div class="container">
            <div class="row">

                <?php if ($video_description_one):?>
                    <div class="page-content d-flex j-content-center c-12 pb-15">
                        <p><?= wp_kses_post($video_description_one) ?></p>
                    </div>
                <?php endif; ?>
                <?php if ($upload_video):?>
                    <div class="page-content d-flex j-content-center c-12 pt-15 pb-15">

                        <?php if ($type_upload_video == "you_tube"):?>

                            <div class="video"><?= $upload_video ?></div>
                        <?php endif; ?>
                        <?php if ($type_upload_video == "own–video"):
                            $video = explode(' ', $upload_video);
                            ?>
                            <video id="video" class=" img video"  <?= $video[1] ?>
                                <?= $video[2] ?> controls>
                                <source <?= $video[4] ?> type="video/mp4">
                            </video>
                        <?php endif; ?>

                    </div>
                <?php endif; ?>
                <?php if ($video_description_two):?>
                    <div class="page-content d-flex j-content-center c-12 pt-15">
                        <p><?= wp_kses_post($video_description_two) ?></p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </section>

<?php endif; ?>
