(function($) {
	/**
	 * This plugin adds an autocompleter functionality on publish pages.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	var autocompleter = {
		timer: null,
		ignorekey: false,
	};


	$('div.autocompleter-popup').live('highlightnext.autocompleter', function(event, direction){
		var popup = $(this),
		    highlighted = $('.item.highlighted', popup);

		if (!highlighted || highlighted.length < 1) {
			highlighted = $('.item:first-child', popup).addClass('highlighted');
		}
		else {
			var items = $(popup).find('.item'),
			    index = $(items).index(highlighted) + (direction > 0 ? 1 : -1);

			if (items.length == 1) return; // No need to highlight already highlighted item :).

			highlighted.removeClass('highlighted').trigger('highlighted', [false]);

			if (index < 0) index = items.length - 1;
			else if (index >= items.length) index = 0;

			highlighted = items.eq(index).addClass('highlighted');
		}

		$(highlighted).trigger('highlighted', [true]);
	});

	$('div.autocompleter-popup li.item:not(.highlighted)').live('mouseenter', function(event){
		var item = $(this),
		    highlighted = $('.item.highlighted', item.parents('div.autocompleter-popup')).removeClass('highlighted').trigger('highlighted', [false]);

		item.addClass('highlighted').trigger('highlighted', [true]);
	});

	$('div.autocompleter-popup li.item.highlighted')
		.live('highlighted', function(event){

			var id = $(this).parents('div.autocompleter-popup').attr('id').replace(/-autocompleter$/, ''),
			    preview = $(this).attr('data-preview');

			if (preview) $('#'+id).trigger('preview', [preview]);

		}).live('click', function(event){

			var id = $(this).parents('div.autocompleter-popup').attr('id').replace(/-autocompleter$/, '');
			$('#'+id).focus().trigger('confirm').trigger('process');

		});



	// This event handler goes first, so it can initialize stuff.
	$('.autocompleter:not(.autocompleter-ready)').live('autocomplete.autocompleter', function(){
		var field = $(this),
			fieldID = field.parents('div[id]').attr('id').replace('field-',''),
			fieldHandle = field.attr('name').replace(/^fields\[([^\]]+)\]/i, '$1'),
		    id = $(this).attr('id');

		if (!id) {
			id = field.attr('name') || String(new Date().getTime()) + String(Math.random()).replace('0.', '');
			id = id.replace('[', '-').replace(']', '-').replace(/-+/,'-').replace(/^-+|-+$/,'');
			field.attr('id', id);
		}

		var exists = $('div#'+id+'-autocompleter');
		if (!exists || exists.length < 1) {
			$('<div class="autocompleter-popup'+(field.hasClass('debug') ? ' debug' : '')+'" id="'+id+'-autocompleter"></div>')
				.css({'position': 'absolute', 'z-index': '99'})
				.hide()
				.appendTo($('body'));
		}
		field.addClass('autocompleter-ready');
		field.selectionOffset(true); // Init selectionPosition too.
	});


	// This goes second, after initialization was done.
	$('.autocompleter:not(.autocompleter-started)')
		.live('keydown.autocompleter', function(event){
			var forced = (event.which == 32 && event.ctrlKey);

			if (forced || event.which == $(this).attr('data-autocompleterkeycode')) {
				var field = $(this),
				    command = field.attr('data-autocompletercommand'),
					prefix = field.attr('data-autocompleterprefix'),
					keyCode = field.attr('data-autocompleterkeycode'),
					interval = field.attr('data-autocompleterinterval'),
					prefixedcommand = prefix + command.substr(0,-1);/* substract what was not added to val yet (we are in keydown, not keyup) */

				var val = field.val(),
					start = this.selectionStart;

				if (!forced && prefixedcommand != val.substr(start - prefixedcommand.length, prefixedcommand.length)) return;

				autocompleter.startedAt = val.substr(0, start - (forced ? 0 : command.length - 1/* substract what was not added to val yet (we are in keydown, not keyup) */));
				autocompleter.endedBefore = val.substr(start);

				if (!forced) {
					field.val(autocompleter.startedAt + autocompleter.endedBefore);
					this.setSelectionRange(autocompleter.startedAt.length, autocompleter.startedAt.length);
				}

				if (autocompleter.timer != null) clearTimeout(autocompleter.timer);
				autocompleter.timer = setTimeout(function(){
					field.trigger('autocomplete');
				}, interval);
			}
		})
		.live('autocomplete.autocompleter', function(){
			autocompleter.ignorekey = false;
			$(this)
				.addClass('autocompleter-started')
				.bind('keydown.autocompleter', function(event){
					event.type = 'preprocess';
					$(this).trigger(event);
					event.type = 'keydown';
					return event.result;
				})
				.bind('keyup.autocompleter', function(event){
					event.type = 'process';
					$(this).trigger(event);
					event.type = 'keyup';
					return event.result;
				})
				.trigger('process');
		});


	$('.autocompleter.autocompleter-started')
		.live('remove.autocompleter', function(){
			$(this).trigger('cancel').die('.autocompleter').removeClass('autocompleter-ready');
			$('div#'+$(this).attr('id')+'-autocompleter').remove();
		})
		.live('stop.autocompleter', function(event){
			if (autocompleter.timer != null) clearTimeout(autocompleter.timer);
			autocompleter.timer = null;

			$(this).unbind('keydown.autocompleter').unbind('keyup.autocompleter').unbind('blur.autocompleter').removeClass('autocompleter-started');
			$('div#'+$(this).attr('id')+'-autocompleter').slideUp('fast');
		})
		.live('cancel.autocompleter', function(event){
			$('div#'+$(this).attr('id')+'-autocompleter').trigger('cancel');

			$(this).val(autocompleter.startedAt + autocompleter.endedBefore);
			this.setSelectionRange(autocompleter.startedAt.length, autocompleter.startedAt.length);

			$(this).trigger('stop');
		})
		.live('confirm.autocompleter', function(){
			var item = $('div#'+$(this).attr('id')+'-autocompleter .item.highlighted');

			if (item.length > 0) {
				var data = item.attr('data-drop') || item.attr('data-value');
				if (data) {
					$(this).val(autocompleter.startedAt + data + autocompleter.endedBefore);
					this.setSelectionRange(autocompleter.startedAt.length + data.length, autocompleter.startedAt.length + data.length);
				}
				autocompleter.ignorekey = !item.hasClass('continue');
				item.trigger('confirm');
			}

			if (autocompleter.ignorekey) {
				$(this).trigger('stop');
			}
		})
		.live('preview.autocompleter', function(event, preview){
			if (!preview) return;

			var val = autocompleter.startedAt + preview + autocompleter.endedBefore,
			    pos = this.selectionStart;

			$(this).val(val);
			this.setSelectionRange(pos, pos + (preview.length - (pos - autocompleter.startedAt.length)));
		})
		.live('preprocess.autocompleter', function(event){
			autocompleter.ignorekey = true;
			switch (event.which) {
				case 9: // TAB
					$('div#'+$(this).attr('id')+'-autocompleter').trigger('highlightnext', [event.shiftKey ? -1 : 1]);
					return false;
					break;
				case 27: // ESC
					$(this).trigger('cancel');
					return false;
					break;
				case 13: // ENTER
					$(this).trigger('confirm');
					return false;
					break;
				case 37: // left arrow
					this.setSelectionRange(this.selectionStart - 1, this.selectionEnd);
					autocompleter.ignorekey = false;
					// TODO: cancel after going outside of original selection area
					return false;
					break;
				case 39: // right arrow
					this.setSelectionRange(this.selectionStart + 1, this.selectionEnd);
					autocompleter.ignorekey = false;
					// TODO: cancel after going outside of original selection area
					return false;
					break;
				default:
					autocompleter.ignorekey = false;
					break;
			}
		})
		.live('process.autocompleter', function(event){
			if (autocompleter.ignorekey) return;
			var o = $(this).selectionOffset();

			$($('div#'+$(this).attr('id')+'-autocompleter'))
				.css(o)
				.html('<p class="debug">scrollLeft: '+this.scrollLeft+'<br />pre: '+o.editedLinePre+'<br />edited: '+o.editedWordPre+'<br />post: '+o.editedWordPost+'</p>')
				.slideDown('fast')
				.trigger('autocomplete', [o])
				.trigger('highlightnext');
		});

})(jQuery.noConflict());
