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
			var id = $(this).attr('id');
			if (!id) {
				id = $(this).attr('name');
				if (!id) {
					id = String(new Date().getTime()) + String(Math.random()).replace('0.', '');
				}
				id = id.replace('[', '-').replace(']', '-').replace(/-+/,'-').replace(/^-+|-+$/,'');
				$(this).attr('id', id);
			}

			var fieldID = $(this).parents('div[id]').attr('id').replace('field-','');
			var fieldHandle = $(this).attr('name').replace(/^fields\[([^\]]+)\]/i, '$1');

			var exists = $('div#'+id+'-autocompleter');
			if (!exists || exists.length < 1) {
				$('body').append($('<div class="autocompleter-popup'+($(this).hasClass('debug') ? ' debug' : '')+'" id="'+id+'-autocompleter"></div>'));
				$('div#'+id+'-autocompleter').css({'position': 'absolute', 'z-index': '99'}).hide().attr('data-field-id', fieldID).attr('data-field-handle', fieldHandle);
			}
			$(this).addClass('autocompleter-ready');//.unbind('focus', autocompleter.start).bind('focus', autocompleter.start);
		},
		start: function(){
			autocompleter.processAllowed = true;

			if (!$(this).hasClass('autocompleter-ready')) {
				autocompleter.construct.call(this);
				$(this).selectionOffset(true); // start also selection calculator
			}

			if (!$(this).hasClass('autocompleter-started')) {
				$(this).addClass('autocompleter-started');
				$(this).bind('keydown', autocompleter.preprocess)
					.bind('keyup', autocompleter.process)
					.bind('blur', autocompleter.stop);
			}

			//$(this).parents('form').bind('submit', autocompleter.submit);
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
					var pass = $(this).attr('data-autocompleter');
					$(this).val(autocompleter.startedAt + pass + autocompleter.endedBefore);
					this.setSelectionRange(autocompleter.startedAt.length + pass.length, autocompleter.startedAt.length + pass.length);
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
			var popup = $('div#'+$(this).attr('id')+'-autocompleter');
			var highlighted = $('.item.highlighted', popup).removeClass('highlighted');
			if (!highlighted || highlighted.length < 1) {
				highlighted = $('.item:first-child', popup).addClass('highlighted');
			}
			else {
				var items = $(popup).find('.item');
				var index = $(items).index(highlighted);
				if (!direction) direction = 1;
				index += direction;
				if (index < 0) index = items.length - 1;
				else if (index >= items.length) {
					index = 0;
				}
				highlighted = items.eq(index).addClass('highlighted');
			}
			var data = $(highlighted).attr('data-preview');
			if (data) {
				var val = $(this).val();
				val = autocompleter.startedAt + data + autocompleter.endedBefore;
				var pos = this.selectionStart;
				$(this).val(val);
				this.setSelectionRange(pos, pos + (data.length - (pos-autocompleter.startedAt.length)));

			}
		}
	};

	$.fn.autocompleter = function(){
		return $(this).each(function(){
			if (!$(this).hasClass('autocompleter-ready')) {
				autocompleter.start.call($(this));
				autocompleter.stop.call($(this));				
			}
			$(this).bind('keyup', function(event){
				if (event.keyCode == $(this).attr('data-autocompleterkeycode') && !$(this).hasClass('autocompleter-started')) {
					var pass = $(this).attr('data-autocompleter'),
						val = $(this).val(),
					    s = val.substr(this.selectionStart - pass.length, pass.length);

					if (pass != s) return;

					autocompleter.startedAt = val.substr(0, this.selectionStart - pass.length + 1);
					autocompleter.endedBefore = val.substr(this.selectionStart);

					var field = $(this);

					if (autocompleter.timer != null) clearTimeout(autocompleter.timer);
					autocompleter.timer = null;

					var interval = $(field).attr('data-autocompleterinterval');
					autocompleter.timer = setTimeout(function(){
						autocompleter.start.call(field);
						$(field).trigger(event); // Make it start processing right away
					}, interval);
				}
			});
		});
	}

	$(document).ready(function() {
		$('textarea.autocompleter, input[type=text].autocompleter').autocompleter();
	});
})(jQuery.noConflict());
