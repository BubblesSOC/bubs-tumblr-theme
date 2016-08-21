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


        // initialize infinite scroll
        var Spinner = {
            on: function(currPage) {
                var title = $loading.data('loading') + ' ' + currPage + ' / ' + $loading.data('total-pages');
                return $spinner.attr('title', title).addClass('spin');
            },
            off: function() {
                return $spinner.attr('title', '').removeClass('spin');
            }
        };

        $infScr = $('.index #the-posts').infinitescroll({
            loading: {
                finishedMsg: $loading.data('finished'),
                msg: $('<p id="loading-message" class="lightcaps"></p>'),
                selector: '#loading',
                speed: 400,
                start: function(opts) {
                    var instance = $(this).data('infinitescroll'),
                        $loadMsg = opts.loading.msg.appendTo(opts.loading.selector),
                        currPage = opts.state.currPage + 1;

                    if (currPage <= opts.maxPage) {
                        Spinner.on(currPage);
                    } else {
                        $(opts.navSelector).hide();
                        $loadMsg.text(opts.loading.finishedMsg).fadeIn(opts.loading.speed);
                    }

                    instance.beginAjax(opts);
                },
                finished: function() {
                    return;
                }
            },
            state: {
                currPage: $loading.data('current-page')
            },
            nextSelector: '#next-page a.next-link',
            navSelector: '#blog-pagination',
            itemSelector: '.post',
            pathParse: function(path, nextPage) {
                return [ path.substring(0, path.lastIndexOf('/')) + '/', '' ];
            },
            errorCallback: function() {
                var opts = $infScr.data('infinitescroll').options;

                setTimeout(function() {
                    opts.loading.msg.fadeOut(opts.loading.speed);
                }, 3000);
            },
            maxPage: $loading.data('total-pages')
        },
        function( newElements ) {
            var $posts  = $(newElements).css({ opacity: 0 }),
                postIds = $posts.map(function() {
                    return this.id;
                }).get(),
                opts = $infScr.data('infinitescroll').options;

            $infScr.infinitescroll('pause');
            $posts.idealize().imagesLoaded(function() {
                Tumblr.LikeButton.get_status_by_post_ids(postIds);

                $posts.css({ opacity: 1 });
                $theGrid.masonry('appended', $posts);

                if (opts && !opts.state.isBeyondMaxPage) {
                    Spinner.off();
                    opts.loading.msg.fadeOut(opts.loading.speed);
                }

                $infScr.infinitescroll('resume');
            });
        });
        // end infinite scroll


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


        // aside menu toggler
        $('.toggler').click(function() {
            var $toggler = $(this),
                $toggled = $( '#' + $toggler.data('toggle') );

            $('.toggled').not($toggled).slideUp('fast');
            $toggled.slideToggle('fast', function() {
                $('.toggler').removeClass('toggle-open');
                if ( $toggled.is(':visible') ) $toggler.addClass('toggle-open');
            });
            return false;
        });
    });

}( jQuery, window ));
