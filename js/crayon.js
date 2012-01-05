<!--
// Crayon Syntax Highlighter JavaScript

// Contants
if (typeof DEBUG == 'undefined') {
	var DEBUG = false;
}

if (typeof crayon_log == 'undefined') {
	function crayon_log(string) {
	    if (typeof console != 'undefined' && DEBUG) {
	        console.log(string);
	    }
	}
}

// jQuery

// jQuery.noConflict();

var PRESSED = 'crayon-pressed';
var UNPRESSED = '';

var CRAYON_SYNTAX = 'div.crayon-syntax';
var CRAYON_TOOLBAR = '.crayon-toolbar';
var CRAYON_INFO = '.crayon-info';
var CRAYON_PLAIN = '.crayon-plain';
var CRAYON_PLAIN_BUTTON = '.crayon-plain-button';
var CRAYON_MAIN = '.crayon-main';
var CRAYON_TABLE = '.crayon-table';
var CRAYON_CODE = '.crayon-code';
var CRAYON_NUMS = '.crayon-nums';
var CRAYON_NUMS_CONTENT = '.crayon-nums-content';
var CRAYON_NUMS_BUTTON = '.crayon-nums-button';
var CRAYON_POPUP_BUTTON = '.crayon-popup-button';

jQuery(document).ready(function() {
    CrayonSyntax.init();
});

var CrayonSyntax = new function() {

	var crayon = new Object();
	
	this.init = function() {
		if (typeof crayon == 'undefined') {
		    crayon = new Object();
		}
		
	    jQuery(CRAYON_SYNTAX).each(function() {
	        var uid = jQuery(this).attr('id');
	        var toolbar = jQuery(this).find(CRAYON_TOOLBAR);
	        var info = jQuery(this).find(CRAYON_INFO);
	        var plain = jQuery(this).find(CRAYON_PLAIN);
	        var plain_button = jQuery(this).find(CRAYON_PLAIN_BUTTON);
	        var main = jQuery(this).find(CRAYON_MAIN);
	        var table = jQuery(this).find(CRAYON_TABLE);
	        var code = jQuery(this).find(CRAYON_CODE);
	        var nums = jQuery(this).find(CRAYON_NUMS);
	        var nums_content = jQuery(this).find(CRAYON_NUMS_CONTENT);
	        var nums_button = jQuery(this).find(CRAYON_NUMS_BUTTON);
	        var popup_button = jQuery(this).find(CRAYON_POPUP_BUTTON);
	        // Register the objects
	        make_uid(uid);
	        crayon[uid] = jQuery(this);
	        crayon[uid].toolbar = toolbar;
	        crayon[uid].plain = plain;
	        crayon[uid].plain_button = plain_button;
	        crayon[uid].info = info;
	        crayon[uid].main = main;
	        crayon[uid].table = table;
	        crayon[uid].code = code;
	        crayon[uid].nums = nums;
	        crayon[uid].nums_content = nums_content;
	        crayon[uid].nums_button = nums_button;
	        crayon[uid].popup_button = popup_button;
	        crayon[uid].nums_visible = true;
	        crayon[uid].plain_visible = false;
	        
	        crayon[uid].toolbar_delay = 0;
	        crayon[uid].time = 1;
	        
	        // Set plain
	        jQuery(CRAYON_PLAIN).css('position', 'absolute');
	        jQuery(CRAYON_PLAIN).css('z-index', 0);
	        
	        // Remember CSS dimensions
	        var main_style = crayon[uid].main.get(0).style;
	        crayon[uid].main_height = main_style.height;
	        crayon[uid].main_max_height = main_style.maxHeight;
	        crayon[uid].main_min_height = main_style.minHeight;
	        crayon[uid].main_width = main_style.width;
	        crayon[uid].main_max_width = main_style.maxWidth;
	        crayon[uid].main_min_width = main_style.minWidth;
	        
	        var load_timer;
	        var last_num_width = nums.width();
	        var i = 0;
	        crayon[uid].loading = true;
	        crayon[uid].scroll_block_fix = false;
	        
	        var load_func = function() {
	        	if (main.height() < 30) {
	        		crayon[uid].scroll_block_fix = true;
	        	}
	        	
	        	// Reconsile dimensions
	    		plain.height(main.height());
	    	    plain.width(main.width());
	        	
	            // If nums hidden by default
	            if (nums.filter('[settings~="hide"]').length != 0) {
	            	nums_content.ready(function() {
	            		CrayonSyntax.toggle_nums(uid, true, true);
	            	});
	            } else {
	            	update_nums_button(uid);
	            }
	        	
	            // TODO If width has changed or timeout, stop timer
	            if (/*last_num_width != nums.width() ||*/ i == 5) {
	            	clearInterval(load_timer);
	            	crayon[uid].loading = false;
	            }
	            i++;
	        };
	        main.ready(function() {
	        	load_timer = setInterval(load_func, 300);
	        });
	        
	        // Used for toggling
	        main.css('position', 'relative');
	        main.css('z-index', 1);
	        
	        // Disable certain features for touchscreen devices
	        touchscreen = (jQuery(this).filter('[settings~="touchscreen"]').length != 0);
	        
	        // Used to hide info
	        if (!touchscreen) {
		        main.click(function() { crayon_info(uid, '', false); });
	        	plain.click(function() { crayon_info(uid, '', false); });
	        	info.click(function() { crayon_info(uid, '', false); });
	        }
	        
	        // Used for code popup
	        crayon[uid].popup_settings = popupWindow(popup_button, { 
	    		height:screen.height - 200, 
	    		width:screen.width - 100,
	    		top:75,
	    		left:50,
	    		scrollbars:1,
	    		windowURL:'',
	    		data:'', // Data overrides URL
	    	}, function() {
	    		code_popup(uid);
	    	}, function() {
	    		//alert('after');
	    	});

	        plain.css('opacity', 0);
	        crayon.toolbar_neg_height = '-' + toolbar.height() + 'px';
	        // If a toolbar with mouseover was found
	        if (toolbar.filter('[settings~="mouseover"]').length != 0 && !touchscreen) {
	        	crayon[uid].toolbar_mouseover = true;
	            
	            toolbar.css('margin-top', crayon.toolbar_neg_height);
	            toolbar.hide();
	            // Overlay the toolbar if needed, only if doing so will not hide the
				// whole code!
	            if (toolbar.filter('[settings~="overlay"]').length != 0
	                && main.height() > toolbar.height() * 2) {
	                toolbar.css('position', 'absolute');
	                toolbar.css('z-index', 2);
	                // Hide on single click when overlayed
	                if (toolbar.filter('[settings~="hide"]').length != 0) {
	                    main.click(function() { toolbar_toggle(uid, undefined, undefined, 0); });
	                    plain.click(function() { toolbar_toggle(uid, false, undefined, 0); });
	                }
	            } else {
	            	toolbar.css('z-index', 4);
	            }
	            // Enable delay on mouseout
	            if (toolbar.filter('[settings~="delay"]').length != 0) {
	                crayon[uid].toolbar_delay = 500;
	            }
	            // Use .hover() for chrome, but in firefox mouseover/mouseout worked best
	            jQuery(this).mouseenter(function() { toolbar_toggle(uid, true); })
	            			.mouseleave(function() { toolbar_toggle(uid, false); });
	            
	        } else if (touchscreen) {
	            toolbar.show();
	        }
	        // Plain show events
	        if (plain.length != 0 && !touchscreen) {
	            if (plain.filter('[settings~="dblclick"]').length != 0) {
	                main.dblclick(function() { CrayonSyntax.toggle_plain(uid); });
	            } else if (plain.filter('[settings~="click"]').length != 0) {
	                main.click(function() { CrayonSyntax.toggle_plain(uid); });
	            } else if (plain.filter('[settings~="mouseover"]').length != 0) {
	                jQuery(this).mouseenter(function() { CrayonSyntax.toggle_plain(uid, true); })
	                            .mouseleave(function() { CrayonSyntax.toggle_plain(uid, false); });
	                nums_button.hide();
	            }
	            if (plain.filter('[settings~="show-plain-default"]').length != 0) {
	            	CrayonSyntax.toggle_plain(uid, true);
	            }
	        }
	        // Scrollbar show events
	        if (!touchscreen && jQuery(this).filter('[settings~="scroll-mouseover"]').length != 0) {
	            // Disable on touchscreen devices and when set to mouseover
	            main.css('overflow', 'hidden');
	            plain.css('overflow', 'hidden');
				jQuery(this).mouseenter(function() { toggle_scroll(uid, true); })
	                        .mouseleave(function() { toggle_scroll(uid, false); });
	        }
	        // Disable animations
	        if ( jQuery(this).filter('[settings~="disable-anim"]').length != 0 ) {
	            crayon[uid].time = 0;
	        }
	        
	        // Determine if Mac
	        crayon[uid].mac = (jQuery(this).filter('[crayon-os~="mac"]').length != 0); 
	    });
	}
	
	var make_uid = function(uid) {
	    if (typeof crayon[uid] == 'undefined') {
	        crayon[uid] = jQuery('#'+uid);
	        return true;
	    }
	    return false;
	}
	
	var code_popup = function(uid) {
		if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		}
		var code = crayon[uid].plain_visible ? crayon[uid].plain : crayon[uid].main;
		var settings = crayon[uid].popup_settings;
		settings.data = get_all_css() + '<body style="padding:0; margin:0;"><div class="' + crayon[uid].attr('class') + 
			' crayon-popup">' + remove_css_inline(get_jquery_str(code)) + '</div></body>';
		if (typeof settings == 'undefined') {
			return;
		}
	}
	
	var get_jquery_str = function(object) {
		return jQuery('<div>').append(object.clone()).remove().html();
	}
	
	var remove_css_inline = function(string) {
		return string.replace(/style\s*=\s*"[^"]+"/mi, '');
	}
	
	// Get all CSS on the page as a string
	var get_all_css = function() {
		var css_str = ''
		css = jQuery('link[rel="stylesheet"]').each(function() {
			var string = get_jquery_str(jQuery(this));
			css_str += string;
		});
		return css_str;
	}
	
	this.copy_plain = function(uid, hover) {
		if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		}
		
		var plain = crayon[uid].plain;
		
		CrayonSyntax.toggle_plain(uid, true, true);
		toolbar_toggle(uid, true);
		
		key = crayon[uid].mac ? '\u2318' : 'CTRL';
		text = 'Press ' + key + '+C to Copy, ' + key + '+V to Paste :)';
		crayon_info(uid, text);
	}
	
	var crayon_info = function(uid, text, show) {
		if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		}
		
		var info = crayon[uid].info;
		
		if (typeof text == 'undefined') {
			text = '';
		}
		if (typeof show == 'undefined') {
			show = true;
		}
		
		if (crayon_is_slide_hidden(info) && show) {
			info.html('<div>' + text + '</div>');
			info.css('margin-top', -info.height());
			info.show();
			crayon_slide(uid, info, true);
			setTimeout(function() {
				crayon_slide(uid, info, false);
			}, 5000);
		}
		
		if (!show) {
			crayon_slide(uid, info, false);
		}
	
	}
	
	var crayon_is_slide_hidden = function(object) {
		var object_neg_height = '-' + object.height() + 'px';	
		if (object.css('margin-top') == object_neg_height || object.css('display') == 'none') {
	        return true;
	    } else {
	        return false;            
	    }
	}
	
	var crayon_slide = function(uid, object, show, anim_time, hide_delay) {
		var object_neg_height = '-' + object.height() + 'px';
		
		if (typeof show == 'undefined') {
	        if (crayon_is_slide_hidden(object)) {
	            show = true;
	        } else {
	            show = false;            
	        }
	    }
	    // Instant means no time delay for showing/hiding
	    if (typeof anim_time == 'undefined') {
	    	anim_time = 100;
	    }
	    if (anim_time == false) {
	    	anim_time = false;
	    }
	    if (typeof hide_delay== 'undefined') {
	    	hide_delay = 0;
	    }
	    object.stop(true);
	    if (show == true) {
	        object.show();
	        object.animate({
	            marginTop: 0
	        }, animt(anim_time, uid));
	    } else if (show == false) {
	        // Delay if fully visible
	        if (/*instant == false && */object.css('margin-top') == '0px' && hide_delay) {
	             object.delay(hide_delay);
	        }
	        object.animate({
	            marginTop: object_neg_height
	        }, animt(anim_time, uid), function() {
	            object.hide();
	        });
	    }
	}
	
	this.toggle_plain = function(uid, hover, select) {
		if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		}
	    
	    var main = crayon[uid].main;
	    var plain = crayon[uid].plain;
	    var plain_button = crayon[uid].plain_button;
	    
	    if ( (main.is(':animated') || plain.is(':animated')) && typeof hover == 'undefined' ) {
	        return;
	    }
	    
	    var visible, hidden;
	    if (typeof hover != 'undefined') {
	        if (hover) {
	            visible = main;
	            hidden = plain;
	            //crayon[uid].plain_visible = true;
	        } else {
	            visible = plain;
	            hidden = main;
	        }
	    } else {
	    	if (main.css('z-index') == 1) {
	    		visible = main;
	    		hidden = plain;
	    		//crayon[uid].plain_visible = true;
	    	} else {
	    		visible = plain;
	    		hidden = main;
	    		//crayon[uid].plain_visible = false;
	    	}
	    }
	    	    
	    crayon[uid].plain_visible = (hidden == plain);
	    
	    // Remember scroll positions of visible
	    crayon[uid].top = visible.scrollTop();
	    crayon[uid].left = visible.scrollLeft();
		
		/* Used to detect a change in overflow when the mouse moves out
		 * of the Crayon. If it does, then overflow has already been changed,
		 * no need to revert it after toggling plain. */
		crayon[uid].scroll_changed = false;
		
		var vis_over = visible.css('overflow');
		var hid_over = hidden.css('overflow');
		
		// Hide scrollbars during toggle to avoid Chrome weird draw error
		visible.css('overflow', 'hidden');
		hidden.css('overflow', 'hidden');
		
		fix_scroll_blank(uid);
		
		// Show hidden, hide visible
	    visible.stop(true);
	    visible.fadeTo(animt(500, uid), 0,
			function() {
				visible.css('z-index', 0);
				if (!crayon[uid].scroll_changed) {
					visible.css('overflow', vis_over);
				}
			});
	    hidden.stop(true);
	    hidden.fadeTo(animt(500, uid), 1,
			function() {
				hidden.css('z-index', 1);
				if (!crayon[uid].scroll_changed) {
					hidden.css('overflow', hid_over);
				}
				
				// Refresh scrollbar draw
				hidden.scrollTop(crayon[uid].top + 1);
				hidden.scrollTop(crayon[uid].top);
				hidden.scrollLeft(crayon[uid].left + 1);
				hidden.scrollLeft(crayon[uid].left);
				
				// Give focus to plain code
				if (hidden == plain) {
					if (select) {
						plain.select();
					} else {
						plain.focus();
					}
				}
			});
	    
		// Restore scroll positions to hidden
	    hidden.scrollTop(crayon[uid].top);
	    hidden.scrollLeft(crayon[uid].left);
	    
	    update_plain_button(uid);
	    
	    // Hide toolbar if possible
	    toolbar_toggle(uid, false);
	}
	
	this.toggle_nums = function(uid, hide, instant) {
		if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		}
		
		if (crayon[uid].table.is(':animated')) {
	        return;
	    }
		var nums_width = Math.round(crayon[uid].nums_content.width() + 1);
		var neg_width = '-' + nums_width + 'px';
		
		// Force hiding
		var num_hidden;
		if (typeof hide != 'undefined') {
			num_hidden = false; 
		} else {
			// Check hiding
			num_hidden = (crayon[uid].table.css('margin-left') == neg_width);
		}
			
	    var num_margin;
	    var table_width = crayon[uid].main.width();
	    if (num_hidden) {
	    	// Show
	        num_margin = '0px';
	        crayon[uid].nums_visible = true;
	    } else {
	    	// Hide
	        crayon[uid].table.css('margin-left', '0px');
	        crayon[uid].nums_visible = false;
	        num_margin = neg_width;
	        table_width += nums_width;
	    }
	    
	    if (typeof instant != 'undefined') {
	    	crayon[uid].table.css('margin-left', num_margin);
	    	crayon[uid].table.width(table_width);
	    	update_nums_button(uid);
	    	return;
	    }
	    
	    // Stop jerking animation from scrollbar appearing for a split second due to
	    // change in width. Prevents scrollbar disappearing if already visible.
	    h_scroll_visible = (crayon[uid].table.width() + px_to_int(crayon[uid].table.css('margin-left')) > crayon[uid].main.width());
	    v_scroll_visible = (crayon[uid].table.height() > crayon[uid].main.height());
	    if (!h_scroll_visible && !v_scroll_visible) {
	    	crayon[uid].main.css('overflow', 'hidden');
	    }
	    crayon[uid].table.animate({
	        marginLeft: num_margin,
	        width: table_width
	    }, animt(200, uid), function() {        
	        if (typeof crayon[uid] != 'undefined') {
	        	update_nums_button(uid);
	        	if (!h_scroll_visible && !v_scroll_visible) {
	            	crayon[uid].main.css('overflow', 'auto');
	            }
	        }
	    });
	}
	
	// Convert '-10px' to -10
	var px_to_int = function(pixels) {
		if (typeof pixels != 'string') {
			return 0;
		}
		var result = pixels.replace(/[^-0-9]/g, '');
		if (result.length == 0) {
			return 0;
		} else {
			return parseInt(result);
		}
	}
	
	var update_nums_button = function(uid) {
		if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].nums_visible == 'undefined') {
			return;
		}
		if (crayon[uid].nums_visible) {
			crayon[uid].nums_button.removeClass(UNPRESSED);
			crayon[uid].nums_button.addClass(PRESSED);
		} else {
			// TODO doesn't work on iPhone
			crayon[uid].nums_button.removeClass(PRESSED);
			crayon[uid].nums_button.addClass(UNPRESSED);
		}
	}
	
	var update_plain_button = function(uid) {
		if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].plain_visible == 'undefined') {
			return;
		}
		
		if (crayon[uid].plain_visible) {
			crayon[uid].plain_button.removeClass(UNPRESSED);
			crayon[uid].plain_button.addClass(PRESSED);
		} else {
			// TODO doesn't work on iPhone
			crayon[uid].plain_button.removeClass(PRESSED);
			crayon[uid].plain_button.addClass(UNPRESSED);
		}
	}
	
	var toolbar_toggle = function(uid, show, anim_time, hide_delay) {
	    if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		} else if (!crayon[uid].toolbar_mouseover) {
	    	return;
	    }
	    var toolbar = crayon[uid].toolbar;
	    var delay = crayon[uid].toolbar_delay;
	    
	    if (typeof hide_delay == 'undefined') {
	    	hide_delay = crayon[uid].toolbar_delay;
	    }
	    
	    crayon_slide(uid, toolbar, show, anim_time, hide_delay);
	}
	
	var toggle_scroll = function(uid, show) {
	    if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		}
	    if (typeof show == 'undefined' /*|| crayon[uid].loading*/) {
	        return;
	    }
	    
	    var main = crayon[uid].main;
	    var plain = crayon[uid].plain;
	    
	    if (show) {
	        main.css('overflow', 'auto');
	        plain.css('overflow', 'auto');
	        if (typeof crayon[uid].top != 'undefined') {
	            visible = (main.css('z-index') == 1 ? main : plain);
	            // Browser will not render until scrollbar moves, move it manually
	            visible.scrollTop(crayon[uid].top-1);
	            visible.scrollTop(crayon[uid].top);
	            visible.scrollLeft(crayon[uid].left-1);
	            visible.scrollLeft(crayon[uid].left);
	        }
	        if (!crayon[uid].scroll_block_fix) {
	        	// Fix dimensions so scrollbars stay inside
	        	main.css('height', main.height());
	        	main.css('width', main.width());
	        } else {
	        	// Relax dimensions so scrollbars are visible
	        	main.css('height', '');
	        	main.css('max-height', '');
	        	main.css('min-height', '');
	        	main.css('width', '');
	        }
	    } else {
	        visible = (main.css('z-index') == 1 ? main : plain);
	        crayon[uid].top = visible.scrollTop();
	        crayon[uid].left = visible.scrollLeft();
	        main.css('overflow', 'hidden');
	        plain.css('overflow', 'hidden');
	        if (!crayon[uid].scroll_block_fix) {
	        	// Restore dimensions
	        	main.css('height', crayon[uid].main_height);
	        	main.css('max-height', crayon[uid].main_max_height);
	        	main.css('min-height', crayon[uid].main_min_height);
	        	main.css('width', crayon[uid].main_width);
	        }
	    }
		// Register that overflow has changed
		crayon[uid].scroll_changed = true;
		fix_scroll_blank(uid);
	}
	
	/* Fix weird draw error, causes blank area to appear where scrollbar once was. */
	var fix_scroll_blank = function(uid) {
	    if (typeof crayon[uid] == 'undefined') {
		    return make_uid(uid);
		}
	    var width = crayon[uid].main.width();
		crayon[uid].main.width(width);
		crayon[uid].main.width(width - 1);
		crayon[uid].main.width(width + 1);
		crayon[uid].main.width(width);
	}
	
	var animt = function(x, uid) {
	    if (x == 'fast') {
	        x = 200;
	    } else if (x == 'slow') {
	        x = 600;
	    } else if (!isNumber(x)) {
	        x = parseInt(x);
	        if (isNaN(x)) {
	            return 0;
	        }
	    }
	    return x * crayon[uid].time;
	}
	
	var isNumber = function(x) {
	    return typeof x == 'number';
	}
	
}

// -->
