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
        $('.post').idealize();
    });

}( jQuery, window ));
