(function($) {
	/**
	 * This plugin modifies autocomplete URL so it is url/mode/section/field.
	 * Mode can be "raw", "embed" (when phrase starts with "[") or
	 * "link" (when phrase starts with "(").
	 * That way, author can enter "[/photos/file/jpg" to get file uploaded to
	 * "file" upload field in "photos" section.
	 * If entered path starts with "./" then section is the same as the 
	 * the one that edited entry belongs to.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	$(document).ready(function() {
		var params = Symphony.Context.get('autocompleter'),
			env = Symphony.Context.get('env');

		$('div.autocompleter-popup')
			.live('preautocomplete.autocompleter', function(event, options){
				var selectedMode = 'raw',
					selectedSection = '*',
					selectedField = '*';

				if (options.word[0] == '[') {
					selectedMode = 'embed';
				}
				else if (options.word[0] == '(') {
					selectedMode = 'link';
				}

				if (selectedMode != 'raw') {
					options.word = options.word.substring(1);
				}

				if (options.word[0] == '/') {
					var temp = options.word.match(/^\/[^\/\s]+/);
					if (temp && temp.length > 0) {
						selectedSection = temp[0].substring(1);
						options.word = options.word.replace(temp[0], '');
					}
				}
				else if (options.word[0] == '.' && options.word[1] == '/') {
					selectedSection = options.section;
					options.word = options.word.substring(1);
				}

				if (options.word[0] == '/' && selectedSection != '*') {
					var temp = options.word.match(/^\/[^\/\s]+/);
					if (temp && temp.length > 0) {
						selectedField = temp[0].substring(1);
						options.word = options.word.replace(temp[0], '');
					}
				}

				if (options.word[0] == '/') options.word = options.word.substring(1);

				options.url = options.url + '/' + selectedMode + '/' + selectedSection + '/' + selectedField
			})
		});
})(jQuery.noConflict());
