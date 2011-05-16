(function($) {
	/**
	 * This plugin adds an autocompleter functionality on publish pages.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	// Language strings
	Symphony.Language.add({
		'Enter separator that will be added between entries': false,
		'Press CTRL with "i" for autocompleter': false,
		'Autocompleter is ON': false
	});

	// TODO: make extension output context data with information about .autocompleter fields.
	//		That way we will not have to add class inside extension (which works only for textarea and textbox fields,
	//      but not for input field - because it does not generate delegate which allows for modification of element attributes)

	// TODO: add generic autocompleter "plugin", which will allow for searching all sections and not depend on SubsectionManager fields.

	// TODO: remove this and keep per-field state
	var autocompleter = {
		timer: null,
		ignorekey: false,
	};

	$('div.autocompleter-popup')
		.live('highlightnext.autocompleter', function(event, direction){
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

	$('div.autocompleter-popup li.item:not(.highlighted)')
		.live('mouseenter', function(event){
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
	$('.autocompleter:not(.autocompleter-ready)')
		.live('autocomplete.autocompleter', function(){
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
		})
		.live('focus.autocompleter', function(event){
			var field = $(this),
			    label = field.parents('label');

			if (label.length < 1) return;

			var i = $('i', label),
			    span = $('span.autocompleter-help', i);
			if (i.length > 0 && span.length < 1) {
				$('<span class="autocompleter-help">'+Symphony.Language.get('Press CTRL with "i" for autocompleter')+'</span>').hide().appendTo(i).fadeIn('slow');
			}
			else if (span.length < 1) {
				$('<i><span class="autocompleter-help">'+Symphony.Language.get('Press CTRL with "i" for autocompleter')+'</span></i>').hide().insertBefore(field).fadeIn('slow');
			}
		});


	// This goes second, after initialization was done.
	$('.autocompleter:not(.autocompleter-started)')
		.live('keydown.autocompleter', function(event){
			var forced = (event.which == 73 && event.ctrlKey);

			if (forced || event.which == $(this).attr('data-autocompleterkeycode')) {
				var field = $(this),
					interval = field.attr('data-autocompleterinterval') || 300,
				    command = field.attr('data-autocompletercommand'),
					prefix = field.attr('data-autocompleterprefix'),
					prefixedcommand = prefix + command.substr(0,-1);/* substract what was not added to val yet (we are in keydown, not keyup) */

				var val = field.val(),
					start = this.selectionStart;

				if (!forced && prefixedcommand != val.substr(start - prefixedcommand.length, prefixedcommand.length)) return;

				// TODO: this should be calculated after timeout triggers, so it will be always correct and will not be calculated everytime command restarts
				autocompleter.startedAfter = val.substr(0, start - (forced ? 0 : command.length - 1/* substract what was not added to val yet (we are in keydown, not keyup) */));
				autocompleter.endedBefore = val.substr(start);

				if (!forced) {
					field.val(autocompleter.startedAfter + autocompleter.endedBefore);
					this.setSelectionRange(autocompleter.startedAfter.length, autocompleter.startedAfter.length);
				}

				// Enable debug if forced with SHIFT key 
				if (forced && event.shiftKey) {
					field.addClass('debug');
				}
				else {
					field.removeClass('debug');
				}

				if (autocompleter.timer != null) clearTimeout(autocompleter.timer);
				autocompleter.timer = setTimeout(function(){
					field.trigger('autocomplete');
				}, interval);

				return false;
			}
		})
		.live('autocomplete.autocompleter', function(){
			autocompleter.ignorekey = false;
			var field = $(this);

			if (field.hasClass('debug')) {
				$('div#'+field.attr('id')+'-autocompleter').addClass('debug');
			}
			else {
				$('div#'+field.attr('id')+'-autocompleter').removeClass('debug');
			}

			field
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

			field.parents('label').find('span.autocompleter-help').html(Symphony.Language.get('Autocompleter is ON')).addClass('warning');
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
			$('div#'+$(this).attr('id')+'-autocompleter').trigger('stop').slideUp('fast');

			$(this).parents('label').find('span.autocompleter-help').html(Symphony.Language.get('Press CTRL with "i" for autocompleter')).removeClass('warning');
		})
		.live('cancel.autocompleter', function(event){
			$(this).val(autocompleter.startedAfter + autocompleter.endedBefore);
			this.setSelectionRange(autocompleter.startedAfter.length, autocompleter.startedAfter.length);

			$(this).trigger('stop');
		})
		.live('confirm.autocompleter', function(){
			var item = $('div#'+$(this).attr('id')+'-autocompleter .item.highlighted');

			if (item.length > 0) {
				var data = item.attr('data-drop') || item.attr('data-value');
				if (data) {
					$(this).val(autocompleter.startedAfter + data + autocompleter.endedBefore);
					this.setSelectionRange(autocompleter.startedAfter.length + data.length, autocompleter.startedAfter.length + data.length);
				}
				autocompleter.ignorekey = !item.hasClass('continue');
				item.trigger('confirm');
			}

			if (autocompleter.ignorekey) {
				$(this).trigger('stop');
			}
		})
		.live('confirmall.autocompleter', function(){
			var data = '',
				separator = prompt(Symphony.Language.get('Enter separator that will be added between entries'), ', ');

			$('div#'+$(this).attr('id')+'-autocompleter .item').each(function(i, item){
				var item = $(item),
					s = item.attr('data-drop') || item.attr('data-value') || '';

				data += (data.length ? separator+s : s);
				//autocompleter.ignorekey = !item.hasClass('continue');
				item.trigger('confirm');
			});

			if (data.length) {
				$(this).val(autocompleter.startedAfter + data + autocompleter.endedBefore);
				this.setSelectionRange(autocompleter.startedAfter.length + data.length, autocompleter.startedAfter.length + data.length);
			}

			if (autocompleter.ignorekey) {
				$(this).trigger('stop');
			}
		})
		.live('preview.autocompleter', function(event, preview){
			if (!preview) return;

			var val = autocompleter.startedAfter + preview + autocompleter.endedBefore,
			    pos = this.selectionStart;

			$(this).val(val);
			this.setSelectionRange(pos, pos + (preview.length - (pos - autocompleter.startedAfter.length)));
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
					$(this).trigger(event.ctrlKey ? 'confirmall' : 'confirm');
					return false;
					break;
				case 38: // up arrow
				case 40: // down arrow
					$('div#'+$(this).attr('id')+'-autocompleter').trigger('highlightnext', [event.which == 38 ? -1 : 1]);
					return false;
					break;
				case 37: // left arrow
					// We do not allow selecting outside of original area
					this.setSelectionRange(Math.max(this.selectionStart - 1, autocompleter.startedAfter.length), this.selectionEnd);
					autocompleter.ignorekey = false;
					return false;
					break;
				case 39: // right arrow
					// We do not allow selecting outside of original area
					this.setSelectionRange(this.selectionStart + 1, this.selectionEnd);
					autocompleter.ignorekey = false;
					return false;
					break;
				default:
					autocompleter.ignorekey = false;
					break;
			}
		})
		.live('process.autocompleter', function(event){
			if (autocompleter.ignorekey) return;

			var text = $(this).val(),
				data = {
					start: autocompleter.startedAfter.length,
					end: text.length - autocompleter.endedBefore.length - autocompleter.startedAfter.length,
					pre: autocompleter.startedAfter,
					post: autocompleter.endedBefore,
					editedWordPre: text.substr(autocompleter.startedAfter.length, this.selectionStart - autocompleter.startedAfter.length),
					editedWordPost: text.substr(this.selectionStart, this.selectionEnd - this.selectionStart),
					editedLinePre: ''
				},
				popup = $('div#'+$(this).attr('id')+'-autocompleter');

			data.pre += data.editedWordPre;
			data.editedLinePre = data.pre.match(/[^\n]+$/);
			data.editedLinePre = (data.editedLinePre && data.editedLinePre.length > 0 ? data.editedLinePre[0] : '');

			popup
				.hide()
				.html('<p class="debug">scrollLeft: '+this.scrollLeft+'<br />pre: '+data.editedLinePre+'<br />edited: '+data.editedWordPre+'<br />post: '+data.editedWordPost+'</p>')
				.trigger('autocomplete', [data])
				.trigger('highlightnext');

			var o = $(this).selectionOffset(false, data);

			popup
				.css(o)
				.slideDown('fast');
		});

})(jQuery.noConflict());
