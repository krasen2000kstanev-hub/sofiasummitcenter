jQuery(document).ready(function($) {
    $('.slider').slick({
        infinite: true,
        arrow: true,
        dots: true,
        autoplay: true,
        autoplaySpeed: 5000,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    dots: false,
                    arrows: false,
                    centerMode: true,
                    centerPadding: '5',
                    slidesToShow: 1
                }
            },
            {
                breakpoint: 480,
                settings: {
                    dots: false,
                    arrows: false,
                    centerMode: true,
                    centerPadding: '5',
                    slidesToShow: 1
                }
            }
        ]
    });
    $('.sliderplace').slick({
        autoplaySpeed: 2000,
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        autoplay: true,
        responsive: [

            {
                breakpoint: 992,
                settings: {
                    arrows: false,
                    centerMode: true,
                    centerPadding: '0',
                    slidesToShow: 1
                }
            }
        ]
    });

});
