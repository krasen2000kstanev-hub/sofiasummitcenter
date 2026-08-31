/* Scroll to top */

document.addEventListener("DOMContentLoaded", function() {
    var scrollToTopBtn = document.getElementById("scrollToTopBtn");

    window.addEventListener("scroll", function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    });

    scrollToTopBtn.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});



// document.addEventListener('DOMContentLoaded', function() {
//     var header = document.querySelector('header');
//
//     window.addEventListener('scroll', function() {
//         if (window.scrollY > 150) {
//             header.classList.add('scrolled');
//         } else {
//             header.classList.remove('scrolled');
//         }
//     });
// });



/* disable scroll when pagination  */
document.addEventListener('DOMContentLoaded', function() {
    // Намираме всички линкове за пагинация
    var paginationLinks = document.querySelectorAll('.post-pagination-bileti a');

    // Добавяме събитие click към всеки линк
    paginationLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Предотвратяваме стандартното поведение на линка

            var href = this.getAttribute('href'); // Вземаме URL от href атрибута на линка

            // Използваме fetch API за да заредим новата страница без да скролваме
            fetch(href)
                .then(function(response) {
                    return response.text();
                })
                .then(function(html) {
                    // Парсим HTML кода и извличаме новото съдържание
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');

                    // Вземаме новото съдържание
                    var newContent = doc.querySelector('.all-destination-wrapper');

                    // Заменяме старото съдържание с новото
                    document.querySelector('.all-destination-wrapper').innerHTML = newContent.innerHTML;

                    // Обновяваме линковете за пагинация
                    var newPagination = doc.querySelector('.post-pagination-bileti');
                    document.querySelector('.post-pagination-bileti').innerHTML = newPagination.innerHTML;

                    // Повторно добавяме събитията за новите линкове за пагинация
                    var newPaginationLinks = document.querySelectorAll('.post-pagination-bileti a');
                    newPaginationLinks.forEach(function(newLink) {
                        newLink.addEventListener('click', function(event) {
                            event.preventDefault();
                            var newHref = this.getAttribute('href');
                            fetch(newHref)
                                .then(function(newResponse) {
                                    return newResponse.text();
                                })
                                .then(function(newHtml) {
                                    var newDoc = parser.parseFromString(newHtml, 'text/html');
                                    var newContent = newDoc.querySelector('.all-destination-wrapper');
                                    document.querySelector('.all-destination-wrapper').innerHTML = newContent.innerHTML;
                                    var newPagination = newDoc.querySelector('.post-pagination-bileti');
                                    document.querySelector('.post-pagination-bileti').innerHTML = newPagination.innerHTML;
                                });
                        });
                    });
                });
        });
    });
});


/* Add Expanded class on the menu */
document.addEventListener('DOMContentLoaded', function() {
    var menuItems = document.querySelectorAll('.menu-item-has-children');

    menuItems.forEach(function(item) {
        var link = item.querySelector('a');

        link.addEventListener('click', function(event) {
            // Предотвратяване на стандартното поведение на линка
            event.preventDefault();

            // Проверка дали подменюто вече е разширено
            if (item.classList.contains('expanded')) {
                item.classList.remove('expanded');
            } else {
                // Премахване на класа 'expanded' от всички подменюта
                menuItems.forEach(function(menuItem) {
                    menuItem.classList.remove('expanded');
                });

                // Добавяне на класа 'expanded' към текущото подменю
                item.classList.add('expanded');
            }
        });
    });
});


/* Add no-scroll on body level */

document.addEventListener('DOMContentLoaded', function() {
    var menuToggle = document.querySelector('.menu-toggle');
    var body = document.body;

    menuToggle.addEventListener('click', function() {
        body.classList.toggle('no-scroll');
    });
});








