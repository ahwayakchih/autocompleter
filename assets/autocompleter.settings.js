(function($) {

	/**
	 * This plugin add an interface for autocompleter management.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */
	$(document).ready(function() {
		// Language strings
		Symphony.Language.add({
			'Start autocompleter {$time} millisecond(s) after typying {$text}': false
		});

		var params = Symphony.Context.get('autocompleter');

		function inject(index, element) {
			var pos = $('input[type="hidden"]', $(this)).attr('name').replace(/fields\[(-?\d+)\](.*)/, '$1');
			if (pos != '') {
				var id = $('input[name="fields\\['+pos+'\\]\\[id\\]"]').val();
				var value = {'time': '', 'autocomplete': ''};
				if (id && params && params['fields'] && params['fields'][id]) {
					value = params['fields'][id];
				}
				var s = Symphony.Language.get('Start autocompleter {$time} millisecond(s) after typying {$text}', { 
							'time': '<input type="text" name="fields['+pos+'][autocompleter][interval]" value="'+(value['interval'] ? value['interval'] : '1')+'" size="3" class="autocompleter interval"/>',
							'text': '<input type="text" name="fields['+pos+'][autocompleter][autocomplete]" value="'+(value['autocomplete'] ? value['autocomplete'] : '')+'" size="8" class="autocompleter autocomplete"/>'
						});
				$('div.content', $(this)).append('<div><label>'+s+'</label></div>');
			}
		}

		$('#fields-duplicator').bind('construct', function(target, field){
			$(field).each(inject);
		});

		$('li.field-textbox, li.field-textarea').each(inject);

	});
})(jQuery.noConflict());
