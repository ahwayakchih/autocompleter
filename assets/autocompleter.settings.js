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
			'Start autocompleter {$time} millisecond(s) after {$command} is typed right next to {$prefix}': false
		});

		var params = Symphony.Context.get('autocompleter'),
		    supported = 'li.field-textbox, li.field-textarea, li.field-input';

		function inject(index, element) {
			var pos = $('input[type="hidden"]', $(this)).attr('name').replace(/fields\[(-?\d+)\](.*)/, '$1');
			if (pos != '') {
				var id = $('input[name="fields\\['+pos+'\\]\\[id\\]"]').val();
				var value = {'interval': '300', 'command': '', 'prefix': ''};
				if (id && params && params['fields'] && params['fields'][id]) {
					value = params['fields'][id];
				}
				var s = Symphony.Language.get('Start autocompleter {$time} millisecond(s) after {$command} is typed right next to {$prefix}', { 
							'time': '<input type="text" name="fields['+pos+'][autocompleter][interval]" value="'+(value['interval'] ? value['interval'] : '1')+'" size="3" class="autocompleter interval"/>',
							'command': '<input type="text" name="fields['+pos+'][autocompleter][command]" value="'+(value['command'] ? value['command'] : '')+'" size="5" class="autocompleter command"/>',
							'prefix': '<input type="text" name="fields['+pos+'][autocompleter][prefix]" value="'+(value['prefix'] ? value['prefix'] : '')+'" size="5" class="autocompleter prefix"/>'
						});
				$('div.content', $(this)).append('<div class="autocompleter settings"><label>'+s+'</label></div>');
			}
		}

		$('#fields-duplicator').bind('construct', function(target, field){
			if ($(field).is(supported)) $(field).each(inject);
		});

		$(supported).each(inject);

	});
})(jQuery.noConflict());
