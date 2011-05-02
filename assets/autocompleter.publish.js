(function($) {
	/**
	 * This plugin adds an autocompleter functionality on publish pages.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	var autocompleter = {
		timer: null,
		construct: function(){
			var field = $(this),
			    id = $(this).attr('id');

			if (!id) {
				id = field.attr('name');
				if (!id) {
					id = String(new Date().getTime()) + String(Math.random()).replace('0.', '');
				}
				id = id.replace('[', '-').replace(']', '-').replace(/-+/,'-').replace(/^-+|-+$/,'');
				field.attr('id', id);
			}

			var fieldID = field.parents('div[id]').attr('id').replace('field-','');
			var fieldHandle = field.attr('name').replace(/^fields\[([^\]]+)\]/i, '$1');

			var exists = $('div#'+id+'-autocompleter');
			if (!exists || exists.length < 1) {
				$('body').append($('<div class="autocompleter-popup'+(field.hasClass('debug') ? ' debug' : '')+'" id="'+id+'-autocompleter"></div>'));
				$('div#'+id+'-autocompleter').css({'position': 'absolute', 'z-index': '99'}).hide().attr('data-field-id', fieldID).attr('data-field-handle', fieldHandle);
			}
			field.addClass('autocompleter-ready');//.unbind('focus', autocompleter.start).bind('focus', autocompleter.start);
		},
		start: function(){
			var field = $(this);

			autocompleter.processAllowed = true;

			if (!field.hasClass('autocompleter-ready')) {
				autocompleter.construct.call(this);
				field.selectionOffset(true); // start also selection calculator
			}

			if (!field.hasClass('autocompleter-started')) {
				field.addClass('autocompleter-started');
				field.bind('keydown', autocompleter.preprocess)
					.bind('keyup', autocompleter.process)
					.bind('blur', autocompleter.stop);
			}

			//field.parents('form').bind('submit', autocompleter.submit);
		},
		preprocess: function(event){
			autocompleter.processAllowed = false;
			switch (event.keyCode) {
				case 9: // TAB
					autocompleter.highlightNextItem.call(this, event.shiftKey ? -1 : 1);
					return false;
					break;
				case 27: // ESC
					$('div#'+$(this).attr('id')+'-autocompleter').trigger('autocomplete.cancelled');
					$(this).val(autocompleter.startedAt + autocompleter.endedBefore);
					this.setSelectionRange(autocompleter.startedAt.length, autocompleter.startedAt.length);
					autocompleter.stop.call(this);
					return false;
					break;
				case 13: // ENTER
					var item = $('div#'+$(this).attr('id')+'-autocompleter .item.highlighted');
					if (item.length > 0) {
						var data = item.attr('data-drop');
						if (data) {
							$(this).val(autocompleter.startedAt + data + autocompleter.endedBefore);
							this.setSelectionRange(autocompleter.startedAt.length + data.length, autocompleter.startedAt.length + data.length);
						}
						autocompleter.processAllowed = item.hasClass('continue');
						item.trigger('autocomplete.selected');
					}
					if (!autocompleter.processAllowed) {
						autocompleter.stop.call(this);
					}
					return false;
					break;
				case 37: // left arrow
					this.setSelectionRange(this.selectionStart - 1, this.selectionEnd);
					autocompleter.processAllowed = true;
					// TODO: cancel after goinf outside of original selection area
					return false;
					break;
				case 39: // right arrow
					this.setSelectionRange(this.selectionStart + 1, this.selectionEnd - 1);
					autocompleter.processAllowed = true;
					// TODO: cancel after goinf outside of original selection area
					return false;
					break;
				default:
					autocompleter.processAllowed = true;
					break;
			}
		},
		process: function(event){
			if (!autocompleter.processAllowed) return;
			var o = $(this).selectionOffset();
			$($('div#'+$(this).attr('id')+'-autocompleter'))
				.css(o)
				.html('<p class="debug">scrollLeft: '+this.scrollLeft+'<br />pre: '+o.editedLinePre+'<br />edited: '+o.editedWordPre+'<br />post: '+o.editedWordPost+'</p>')
				.slideDown('fast')
				.trigger('autocomplete.autocompleter', [o]);
			autocompleter.highlightNextItem.call(this);
		},
		stop: function(){
			if (autocompleter.timer != null) clearTimeout(autocompleter.timer);
			autocompleter.timer = null;

			$(this).unbind('keydown', autocompleter.preprocess).unbind('keyup', autocompleter.process).unbind('blur', autocompleter.stop).removeClass('autocompleter-started');
			$('div#'+$(this).attr('id')+'-autocompleter').slideUp('fast');
			$(this).parents('form').unbind('submit', autocompleter.submit);
		},
		destruct: function(){
			autocompleter.stop.call(this);
			$(this).unbind('focus', autocompleter.start).removeClass('autocompleter-ready');
			$('div#'+$(this).attr('id')+'-autocompleter').remove();
		},
		highlightNextItem: function(direction){
			var popup = $('div#'+$(this).attr('id')+'-autocompleter'),
			    highlighted = $('.item.highlighted', popup).removeClass('highlighted'),
			    data = highlighted.attr('data-preview');

			if (!highlighted || highlighted.length < 1) {
				highlighted = $('.item:first-child', popup).addClass('highlighted');
			}
			else {
				var items = $(popup).find('.item'),
				    index = $(items).index(highlighted);

				index += (direction ? direction : 1);

				if (index < 0) index = items.length - 1;
				else if (index >= items.length) index = 0;

				highlighted = items.eq(index).addClass('highlighted');
			}

			if (data) {
				var val = autocompleter.startedAt + data + autocompleter.endedBefore,
				    pos = this.selectionStart;

				$(this).val(val);
				this.setSelectionRange(pos, pos + (data.length - (pos - autocompleter.startedAt.length)));
			}
		}
	};

	$.fn.autocompleter = function(){
		return $(this).each(function(){
			var field = $(this),
			    command = field.attr('data-autocompletercommand'),
				prefix = field.attr('data-autocompleterprefix'),
				keyCode = field.attr('data-autocompleterkeycode'),
				interval = field.attr('data-autocompleterinterval'),
				prefixedcommand = prefix + command;

			if (!field.hasClass('autocompleter-ready')) {
				autocompleter.start.call(field);
				autocompleter.stop.call(field);				
			}

			field.bind('keyup', function(event){
				var forced = (event.which == 32 && event.ctrlKey);
				if ((event.which == keyCode || forced) && !field.hasClass('autocompleter-started')) {

					var val = field.val(),
						start = this.selectionStart;

					if (!forced && prefixedcommand != val.substr(start - prefixedcommand.length, prefixedcommand.length)) return;

					autocompleter.startedAt = val.substr(0, start - (forced ? 0 : command.length));
					autocompleter.endedBefore = val.substr(start);

					if (!forced) {
						field.val(autocompleter.startedAt + autocompleter.endedBefore);
						this.setSelectionRange(autocompleter.startedAt.length, autocompleter.startedAt.length);
					}

					if (autocompleter.timer != null) clearTimeout(autocompleter.timer);
					autocompleter.timer = setTimeout(function(){
						autocompleter.start.call(field);
						field.trigger(event); // Make it start processing right away
					}, interval);
				}
			});
		});
	}

	$(document).ready(function() {
		$('textarea.autocompleter, input[type=text].autocompleter').autocompleter();
	});
})(jQuery.noConflict());
