<?php get_header(); ?>

<div class="container">
    <h1><?php post_type_archive_title(); ?></h1>
    <?php if ( have_posts() ) : ?>
        <div class="service-archive">
            <?php while ( have_posts() ) : the_post(); ?>
                <div class="service-item">
                    <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                    <?php the_excerpt(); ?>
                </div>
            <?php endwhile; ?>
        </div>
    <?php else : ?>
        <p><?php _e('No services found'); ?></p>
    <?php endif; ?>
</div>

<?php get_footer(); ?>
