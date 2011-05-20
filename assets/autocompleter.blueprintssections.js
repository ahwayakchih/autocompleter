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
			'{$checkbox} Enable autocompleter': false,
			'Autocomplete URL': false
		});

		var params = Symphony.Context.get('autocompleter'),
		    supported = 'li.field-textbox, li.field-textarea, li.field-input';

		function inject(index, element) {
			var pos = $('input[type="hidden"]', $(this)).attr('name').replace(/fields\[(-?\d+)\](.*)/, '$1');
			if (pos != '') {
				var id = $('input[name="fields\\['+pos+'\\]\\[id\\]"]').val();
				var value = {'url': ''};
				if (id && params && params['fields'] && params['fields'][id]) {
					value = params['fields'][id];
				}
				var enable = '<label>'+Symphony.Language.get('{$checkbox} Enable autocompleter', { 
							'checkbox': '<input type="checkbox" name="fields['+pos+'][autocompleter][enabled]" value="Yes" '+(value['field_id'] == id ? 'checked="checked" ' : '')+'size="3" class="autocompleter enabled"/>'
						})+'</label>',
					url = (params['source_url'] == 'yes' ? '<label>'+Symphony.Language.get('Autocomplete URL')+'<input type="text" name="fields['+pos+'][autocompleter][url]" value="'+(value['url'] ? value['url'] : '')+'"/></label>' : '');
				$('div.content', $(this)).append('<div class="autocompleter group settings">'+enable+url+'</div>');
			}
		}

		$('#fields-duplicator').bind('construct', function(target, field){
			if ($(field).is(supported)) $(field).each(inject);
		});

		$(supported).each(inject);

	});
})(jQuery.noConflict());
