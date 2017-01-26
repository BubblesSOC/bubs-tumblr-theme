(function( $, window ) {
    'use strict';


    // enable tumblr lightbox for non-panorama photos
    var initLightbox = function( $post ) {
        if ( !$post.hasClass('type-photo') || $post.hasClass('panorama-post') ) return;

        var postId    = $post.attr('id'),
            $photoset = $('#photoset_' + postId),
            images    = [];

        $photoset.children('.photo-link').each(function(index) {
            var image = $(this).data(),
                psIdx = index + 1;

            images.push({
                width: image['width'],
                height: image['height'],
                low_res: image['lowres'],
                high_res: image['highres']
            });

            $(this).attr('id', 'photoset_link_' + postId + '_' + psIdx)
                   .attr('data-enable-lightbox', 1)
                   .attr('data-photoset-index', psIdx)
                   .click(function() {
                       Tumblr.Lightbox.init(images, psIdx);
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
            var $cols = $photoset.children('.photo-link').slice(0, columns);

            $cols.wrapAll('<div class="photoset-row columns-' + columns + '" />')
                 .css({
                    'display': 'block',
                    'padding-left': '5px',
                    'float': 'left',
                    'overflow': 'hidden',
                    '-webkit-box-sizing': 'border-box',
                    '-moz-box-sizing': 'border-box',
                    '-o-box-sizing': 'border-box',
                    'box-sizing': 'border-box'
                 }).filter(':first-child').css({
                    'padding-left': '0'
                 });

            if ( columns == '1' ) {
                $cols.css('width', '100%');
            } else if ( columns == '2' ) {
                $cols.css('width', '50%');
            } else if ( columns == '3' ) {
                $cols.css('width', '33%')
                     .filter(':nth-child(2)')
                     .css('width', '34%');
            } else if ( columns == '4' ) {
                $cols.css('width', '25%');
            } else if ( columns == '5' ) {
                $cols.css('width', '20%');
            }
        });

        $photoset.children('.photoset-row').css({
            'overflow': 'hidden',
            'clear': 'left',
            'margin-top': '5px',
            'max-width': '1280px',
        }).each(function( rowIdx ) {
            var $row = $(this);

            // equalize the heights of the row's images by setting the height
            // of the row div to the height of the smallest image
            var resizePhotosetRow = function( rowImages ) {
                var minHeight = Math.min.apply(null, $.map(rowImages, function(image) {
                    return image.img.height;
                }));

                $row.height(minHeight);
                $.each(rowImages, function(i, image) {
                    if ( image.img.height == minHeight ) return true;

                    // vertically center the larger images within view
                    var top = 0 - Math.ceil( (image.img.height - minHeight) / 2 );
                    $(image.img).css({
                        'position': 'relative',
                        'top': top + 'px'
                    });
                });
            };

            if ( rowIdx == 0 ) $row.css('margin-top', '0');

            $row.imagesLoaded().done(function( instance ) {
                // all images successfully loaded
                resizePhotosetRow( instance.images );
                $(window).on('resize', function() {
                    resizePhotosetRow( instance.images );
                });
            }).fail(function() {
                console.log('all images loaded, at least one is broken');
            });
        });
    };


    // remove '(via username)' from quote source
    var removeQuoteVia = function( $post ) {
        if ( !$post.hasClass('type-quote') || !$('body').hasClass('index') ) return;

        var $src = $post.find('.quote-source');
        if ( $src.length < 1 ) return;

        var html = $src.html().replace(/&nbsp;/g, ' ');
        html = html.replace(/(\s*)\(via\s+[^\)]+\)/gi, "$1");
        $src.html(html);
    };


    // stretch tumblr gifs beyond the margins of .post-body
    // see: '.tmblr-full.stretched' in main.css
    var fixTumblrGifs = function( $post ) {
        var $gifs = $post.find('.post-body figure.tmblr-full');
        if ( $gifs.length < 1 ) return;

        var fixer = function() {
            var width = $post.children('.post-content').width();
            $gifs.addClass('stretched').width(width).each(function() {
                $(this).find('.tmblr-attribution a').addClass('icon-link-ext');
            });
        };

        fixer();
        $(window).on('resize', fixer);
    };


    // vertically center audio info
    $.fn.centerAudioInfo = function() {
        this.filter('.type-audio').each(function() {
            var $table = $(this).find('.audio-info'),
                $cell  = $table.children('.the-info');

            if ( $table.height() > 71 ) {
                $table.css({
                    'height': 'auto',
                    'display': 'block'
                });
                $cell.css({
                    'height': 'auto',
                    'display': 'block',
                    'opacity': '1'
                });
            } else {
                $table.css({
                    'height': '71px',
                    'display': 'table'
                });
                $cell.css({
                    'height': '71px',
                    'display': 'table-cell',
                    'opacity': '1'
                });
            }
        });
        return this;
    };


    $.fn.idealize = function() {
        this.not('.idealized').each(function() {
            var $post = $(this);

            initLightbox( $post );
            initPhotosetGrid( $post );
            removeQuoteVia( $post );
            fixTumblrGifs( $post );

            // mark element with class to prevent duplicate work
            $post.addClass('idealized');
        });
        return this;
    };


    $(function() {

        // animated scroll to top
        $('#elevator').click(function() {
            $('body,html').animate({
                scrollTop: 0
            }, 500);
            return false;
        });

        // initialize the layout grid
        var $theGrid = null;
        $('.post').centerAudioInfo().idealize();

        // if ( $('body').hasClass('index') ) {
        //     NProgress.configure({
        //         trickleRate: 0.08,
        //         trickleSpeed: 400,
        //         showSpinner: false,
        //         template: '<div class="progress-bar" role="bar"></div>'
        //     }).start();
        // }

        $theGrid = $('.index #the-posts').imagesLoaded().progress(function() {
            //NProgress.inc(0.08);
        }).always(function() {
            $theGrid.masonry({
                columnWidth: '#grid-sizer',
                percentPosition: true,
                itemSelector: '.post'
            }).on('layoutComplete', function() {
                $('.post.type-audio').centerAudioInfo();
            });
            //NProgress.done(true);
        });
    });

}( jQuery, window ));
