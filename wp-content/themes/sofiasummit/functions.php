<?php
/**
 * SofiaSummit functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package SofiaSummit
 */

if ( ! defined( '_S_VERSION' ) ) {
	// Replace the version number of the theme on each release.
	define( '_S_VERSION', '1.0.0' );
}

/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which
 * runs before the init hook. The init hook is too late for some features, such
 * as indicating support for post thumbnails.
 */
function sofiasummit_setup() {
	/*
		* Make theme available for translation.
		* Translations can be filed in the /languages/ directory.
		* If you're building a theme based on SofiaSummit, use a find and replace
		* to change 'sofiasummit' to the name of your theme in all the template files.
		*/
	load_theme_textdomain( 'sofiasummit', get_template_directory() . '/languages' );

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	/*
		* Let WordPress manage the document title.
		* By adding theme support, we declare that this theme does not use a
		* hard-coded <title> tag in the document head, and expect WordPress to
		* provide it for us.
		*/
	add_theme_support( 'title-tag' );

	/*
		* Enable support for Post Thumbnails on posts and pages.
		*
		* @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
		*/
	add_theme_support( 'post-thumbnails' );

	// This theme uses wp_nav_menu() in one location.
	register_nav_menus(
		array(
			'menu-1' => esc_html__( 'Primary', 'sofiasummit' ),
		)
	);

	/*
		* Switch default core markup for search form, comment form, and comments
		* to output valid HTML5.
		*/
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	// Set up the WordPress core custom background feature.
	add_theme_support(
		'custom-background',
		apply_filters(
			'sofiasummit_custom_background_args',
			array(
				'default-color' => 'ffffff',
				'default-image' => '',
			)
		)
	);

	// Add theme support for selective refresh for widgets.
	add_theme_support( 'customize-selective-refresh-widgets' );

	/**
	 * Add support for core custom logo.
	 *
	 * @link https://codex.wordpress.org/Theme_Logo
	 */
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);
}
add_action( 'after_setup_theme', 'sofiasummit_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function sofiasummit_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'sofiasummit_content_width', 640 );
}
add_action( 'after_setup_theme', 'sofiasummit_content_width', 0 );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function sofiasummit_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'sofiasummit' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'sofiasummit' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'sofiasummit_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function sofiasummit_scripts() {
	wp_enqueue_style( 'sofiasummit-style', get_stylesheet_uri(), array(), _S_VERSION );
	wp_style_add_data( 'sofiasummit-style', 'rtl', 'replace' );

    wp_register_style( 'variables', get_template_directory_uri() . '/assets/css/variables.css', array(), _S_VERSION);
    wp_register_style( 'main', get_template_directory_uri() . '/assets/css/main.css', array(), _S_VERSION);
    wp_register_style( 'custom', get_template_directory_uri() . '/assets/css/custom.css', array(), _S_VERSION);
    wp_register_style( 'responsive', get_template_directory_uri() . '/assets/css/responsive.css', array(), _S_VERSION);

    wp_enqueue_style( 'variables' );
    wp_enqueue_style( 'main' );
    wp_enqueue_style( 'custom' );
    wp_enqueue_style( 'responsive' );


	wp_enqueue_script( 'sofiasummit-navigation', get_template_directory_uri() . '/js/navigation.js', array(), _S_VERSION, true );

    wp_enqueue_script( 'custom.js', get_template_directory_uri() . '/assets/js/custom.js', array(), _S_VERSION, true );

    wp_enqueue_script('jquery');
    wp_enqueue_script('slick-carousel', 'https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.js', array('jquery'), '1.9.0', true);

    wp_enqueue_script( 'slick-carousel.js', get_template_directory_uri() . '/assets/js/slick-carousel.js', array(), _S_VERSION, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'sofiasummit_scripts' );

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load Jetpack compatibility file.
 */
if ( defined( 'JETPACK__VERSION' ) ) {
	require get_template_directory() . '/inc/jetpack.php';
}


/**
 *  Add categories and Tags to Pages
 */


function add_tags_and_categories_to_pages() {

    register_taxonomy_for_object_type('category', 'page');

    register_taxonomy_for_object_type('post_tag', 'page');
}


add_action('init', 'add_tags_and_categories_to_pages');


/**
 * Custom Post type
 */


function create_service_post_type() {
    $labels = array(
        'name' => __('Услуги', 'textdomain'),
        'singular_name' => __('Услуга', 'textdomain'),
        'menu_name' => __('Услуги', 'textdomain'),
        'name_admin_bar' => __('Услуга', 'textdomain'),
        'add_new' => __('Добави нова', 'textdomain'),
        'add_new_item' => __('Добави нова услуга', 'textdomain'),
        'new_item' => __('Нова услуга', 'textdomain'),
        'edit_item' => __('Редактирай услуга', 'textdomain'),
        'view_item' => __('Виж услуга', 'textdomain'),
        'all_items' => __('Всички услуги', 'textdomain'),
        'search_items' => __('Търси услуги', 'textdomain'),
        'parent_item_colon' => __('Родителски услуги:', 'textdomain'),
        'not_found' => __('Не са намерени услуги', 'textdomain'),
        'not_found_in_trash' => __('Не са намерени услуги в кошчето', 'textdomain')
    );

    $args = array(
        'labels' => $labels,
        'hierarchical' => false,
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'услуги'),
        'show_in_rest' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes'),
        'taxonomies' => array('category', 'post_tag'),
    );

    register_post_type('service', $args);
}
add_action('init', 'create_service_post_type');



function create_hall_post_type() {
    $labels = array(
        'name' => __('Зали', 'textdomain'),
        'singular_name' => __('Зала', 'textdomain'),
        'menu_name' => __('Зали', 'textdomain'),
        'name_admin_bar' => __('Зала', 'textdomain'),
        'add_new' => __('Добави нова', 'textdomain'),
        'add_new_item' => __('Добави нова зала', 'textdomain'),
        'new_item' => __('Нова зала', 'textdomain'),
        'edit_item' => __('Редактирай зала', 'textdomain'),
        'view_item' => __('Виж зала', 'textdomain'),
        'all_items' => __('Всички зали', 'textdomain'),
        'search_items' => __('Търси зали', 'textdomain'),
        'parent_item_colon' => __('Родителски зали:', 'textdomain'),
        'not_found' => __('Не са намерени зали', 'textdomain'),
        'not_found_in_trash' => __('Не са намерени зали в кошчето', 'textdomain')
    );

    $args = array(
        'labels' => $labels,
        'hierarchical' => false,
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'зали'),
        'show_in_rest' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes'),
        'taxonomies' => array('category', 'post_tag'),
    );

    register_post_type('hall', $args);
}
add_action('init', 'create_hall_post_type');

function create_format_post_type() {
    $labels = array(
        'name' => __('Формати', 'textdomain'),
        'singular_name' => __('Формат', 'textdomain'),
        'menu_name' => __('Формати', 'textdomain'),
        'name_admin_bar' => __('Формат', 'textdomain'),
        'add_new' => __('Добави нов', 'textdomain'),
        'add_new_item' => __('Добави нов формат', 'textdomain'),
        'new_item' => __('Нов формат', 'textdomain'),
        'edit_item' => __('Редактирай формат', 'textdomain'),
        'view_item' => __('Виж формат', 'textdomain'),
        'all_items' => __('Всички формати', 'textdomain'),
        'search_items' => __('Търси формати', 'textdomain'),
        'parent_item_colon' => __('Родителски формати:', 'textdomain'),
        'not_found' => __('Не са намерени формати', 'textdomain'),
        'not_found_in_trash' => __('Не са намерени формати в кошчето', 'textdomain')
    );

    $args = array(
        'labels' => $labels,
        'hierarchical' => false,
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'формати'),
        'show_in_rest' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes'),
        'taxonomies' => array('category', 'post_tag'),
    );

    register_post_type('format', $args);
}
add_action('init', 'create_format_post_type');









/**
 * Image Sizes
 */
add_image_size('my_custom_size_small', 240, 240, false );

add_image_size('my_custom_size_middle', 310, 310, false );

add_image_size('my_custom_size_large', 420, 420, false );

add_image_size('my_custom_size_full_large', 720, 720, false );

add_image_size('my_custom_full', 1920, 1920, false );

/**
 * Default  Image
 */

add_action('acf/render_field_settings/type=image', 'add_defult_image_field');
function add_defult_image_field($field) {
    acf_render_field_setting( $field, array(
        'label'         => 'Defult Image',
        'instructions'      => 'Appears when creating a new post',
        'type'          => 'image',
        'name'          => 'defult_value',
    ));
}

//function add_lazy_load_to_images($content) {
//    $content = preg_replace('/<img(.*?)src=/i', '<img$1 loading="lazy" src=', $content);
//    return $content;
//}
//add_filter('the_content', 'add_lazy_load_to_images');



function cutText($string, $wordCount) {
    $string = strip_tags($string); // Премахване на всички HTML тагове
    $parts = preg_split('/([\s\n\r]+)/', $string, null, PREG_SPLIT_DELIM_CAPTURE);
    $parts_count = count($parts);

    $length = 0;
    $last_part = 0;
    for (; $last_part < $parts_count; ++$last_part) {
        $length += strlen($parts[$last_part]);
        if ($length > $wordCount) { break; }
    }

    return implode(array_slice($parts, 0, $last_part));
}


/**
 * Pagination
 */



function sofia_summit_pagination($my_wp_query = null) {
    if (!$my_wp_query) {
        global $wp_query;
        $my_wp_query = $wp_query;
    }
    $big = 999999999;
    echo paginate_links(array(
        'base' => str_replace($big, '%#%', esc_url(get_pagenum_link($big))),
        'format' => '/page/%#%', // Определя формата на URL за страници
        'current' => max(1, get_query_var('paged')),
        'total' => $my_wp_query->max_num_pages,
        'prev_text' => __('« Prev'),
        'next_text' => __('Next »'),
    ));
}





/**
 * @param $post_id
 * @return string
 * Post Views Counter
 */
/*
 * Set post views count using post meta
 */
function setPostViews($postID) {
    $countKey = 'post_views_count';
    $count = get_post_meta($postID, $countKey, true);
    if($count == ''){
        $count = 0;
        delete_post_meta($postID, $countKey);
        add_post_meta($postID, $countKey, '0');
    } else {
        $count++;
        update_post_meta($postID, $countKey, $count);
    }
}

function track_post_views() {
    if (is_page()) {
        setPostViews(get_the_ID());
    }
}
add_action('wp_head', 'track_post_views');



/**
 * Allow translating numbers
 *
 * @see https://wpml.org/forums/topic/wpbakery-post-grid-element-exclude-from-filter-list-category-reappears
 */
function wpmlsupp_7499_allow_translating_numbers( $is_translatable, $job_translate ) {
    $data = $job_translate['field_data'];

    if ( 'base64' === $job_translate['field_format'] ) {
        $data = base64_decode( $data );
    }

    if ( is_numeric( $data ) ) {
        return true;
    }

    return $is_translatable;
}
add_filter( 'wpml_tm_job_field_is_translatable', 'wpmlsupp_7499_allow_translating_numbers', 10, 2 );




/**
 *  Custom Breadcrumbs
 */
function custom_breadcrumbs() {

    $delimiter = '&raquo;';
    $home = 'Начало';
    $before = '<span class="current">';
    $after = '</span>';


    echo '<div id="breadcrumbs"><a href="' . get_home_url() . '/">' . $home . '</a> ' . $delimiter . ' ';


    if (!is_front_page() && !is_home()) {

        if (is_category()) {

            $current_category = get_queried_object();
            if ($current_category->parent != 0) {
                $parent_categories = get_category_parents($current_category->parent, true, ' ' . $delimiter . ' ');
                echo trim($parent_categories, ' ' . $delimiter . ' ');
            }
            echo $before . single_cat_title('', false) . $after;
        } elseif (is_single()) {
            // Показване на маршрута за публикации
            $category = get_the_category();
            if ($category) {
                $category_link = get_category_link($category[0]->term_id);
                echo '<a href="' . esc_url($category_link) . '">' . $category[0]->name . '</a> ' . $delimiter . ' ';
            }
            echo $before . get_the_title() . $after;
        } elseif (is_page()) {

            global $post;
            if ($post->post_parent) {
                $parent_id = $post->post_parent;
                $breadcrumbs = [];
                while ($parent_id) {
                    $page = get_page($parent_id);
                    $breadcrumbs[] = '<a href="' . get_permalink($page->ID) . '">' . get_the_title($page->ID) . '</a>';
                    $parent_id = $page->post_parent;
                }
                $breadcrumbs = array_reverse($breadcrumbs);
                echo join(' ' . $delimiter . ' ', $breadcrumbs) . ' ' . $delimiter . ' ';
            }
            echo $before . get_the_title() . $after;
        }
    }

    // Завършване на Breadcrumbs
    echo '</div>';
}



/**
 * remove editor
 */

function hide_classic_editor() {
    remove_post_type_support('page', 'editor');
    remove_post_type_support('post', 'editor');
}
add_action('admin_init', 'hide_classic_editor');



/**
 * Screen width
 */

function save_screen_width() {
    session_start();

    if (isset($_POST['screen_width'])) {
        $screenWidth = intval($_POST['screen_width']);
        $_SESSION['screen_width'] = $screenWidth;

        if ($screenWidth < 600) {
            echo "Content for small screens.";
        } else {
            echo "Content for large screens.";
        }
    } else {
        echo "No screen width data received.";
    }

    wp_die(); // Важно за завършване на AJAX заявката в WordPress
}
add_action('wp_ajax_save_screen_width', 'save_screen_width');
add_action('wp_ajax_nopriv_save_screen_width', 'save_screen_width');

