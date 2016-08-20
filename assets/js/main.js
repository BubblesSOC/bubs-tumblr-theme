(function( $, window ) {
    'use strict';


    // enable tumblr lightbox for non-panorama photos
    var initLightbox = function( $post ) {
        if ( !$post.hasClass('type-photo') || $post.hasClass('panorama-post') ) return;

        var $photoset = $post.find('.photo-container'),
            images    = [];

        $photoset.children('.photo-link').each(function(index) {
            var image = $(this).data();

            images.push({
                width: image['width'],
                height: image['height'],
                low_res: image['lowres'],
                high_res: image['highres']
            });

            $(this).click(function() {
                Tumblr.Lightbox.init(images, index);
                return false;
            });
        });
    };


    // initialize photoset grid
    var initPhotosetGrid = function( $post ) {
        if ( !$post.hasClass('type-photo') || !$post.hasClass('photoset-post') ) return;

        var $photoset = $post.find('.photo-container'),
            layout    = $photoset.data('layout') || [];

        // wrap the photos in row divs according to the layout array
        // ex: layout = ["2","2"]
        $.each(layout, function(i, columns) {
            $photoset.children('.photo-link').slice(0, columns)
                     .wrapAll('<div class="photoset-row columns-' + columns + '" />');
        });

        var resizePhotoset = function() {
            $photoset.children('.photoset-row').each(function() {

                // equalize the heights of the row's images by setting the height
                // of the row div to the height of the smallest image
                // see: 'Photoset Grid' section in main.css

                var $row  = $(this),
                    $imgs = $row.find('img'),
                    minHeight = Math.min.apply( null, $imgs.map(function() {
                        return $(this).height();
                    }).get() );

                $row.height(minHeight);
                $imgs.each(function() {
                    if ( $(this).height() == minHeight ) return true;

                    // vertically center the larger images within view
                    var top = 0 - Math.ceil( ($(this).height() - minHeight) / 2 );
                    $(this).css('top', top + 'px');
                });
            });
        };

        $photoset.imagesLoaded(function() {
            resizePhotoset();
            $(window).on('resize', resizePhotoset);
        });
    };


    $.fn.idealize = function() {
        return this.each(function() {
            var $post = $(this);

            if ( $post.hasClass('idealized') ) return true;

            initLightbox( $post );
            initPhotosetGrid( $post );

            // mark element with class to prevent duplicate work
            $post.addClass('idealized');
        });
    };


    $(function() {
        var $theGrid = null,
            $infScr  = null,
            $loading = $('#loading'),
            $spinner = $('#spinner');

        $('.post').idealize();


        // initialize the layout grid
        NProgress.configure({
            trickleRate: 0.08,
            trickleSpeed: 400,
            showSpinner: false,
            template: '<div class="progress-bar" role="bar"></div>'
        }).start();

        $theGrid = $('.index #the-posts').imagesLoaded(function() {
            $theGrid.masonry({
                columnWidth: '#grid-sizer',
                percentPosition: true,
                itemSelector: '.post'
            });
            NProgress.done(true);
        });


        // fade-in elements on scroll
        var $elevator   = $('#elevator'),
            spinInit    = $spinner.css('bottom'),
            spinShift   = $elevator.css('bottom'),
            $blogHeader = $('#blog-header'),
            borderColor = $blogHeader.data('border-color');

        $(window).scroll(function() {
            if ( $(this).scrollTop() > 0 ) {
                $blogHeader.css('border-bottom-color', borderColor);
            } else {
                $blogHeader.css('border-bottom-color', 'transparent');
            }

            if ( $(this).scrollTop() > 400 ) {
                if ( $elevator.css('display') == 'none' ) {
                    $spinner.css('bottom', spinInit);
                    $elevator.fadeIn(400, function() {
                        $elevator.css('display', 'inline-block');
                    });
                }
            } else {
                $elevator.fadeOut(400, function() {
                    $spinner.css('bottom', spinShift);
                });
            }
        });

        // animated scroll to top
        $elevator.click(function() {
            $('body,html').animate({
                scrollTop: 0
            }, 500);
            return false;
        });


        // search form toggle and slide
        var $search     = $('#search'),
            $searchCtrl = $('.search-control');

        $searchCtrl.click(function() {
            if ( $search.hasClass('form-open') ) {
                // form is open, close it
                $search.removeClass('form-open');
            } else {
                // form is closed, open it
                $search.addClass('form-open');
                setTimeout(function() {
                    $('#search-field').focus();
                }, 500);
            }
            return false;
        });
    });

}( jQuery, window ));
