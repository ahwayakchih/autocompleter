(function($) {
	/**
	 * This plugin modifies variables passed to URL by extracting section and field
	 * names from query. It adds `qmode`, `qsection`, `qfield` and `qhas` variables.
	 * `qmode` can be "raw", "embed" (when phrase starts with "[") or
	 * "link" (when phrase starts with "(").
	 * That way, author can enter "[/photos/file/jpg" to get file uploaded to
	 * "file" upload qfield in "photos" qsection.
	 * `qhas` will be one of "section" ("/photos"), "field" ("/photos/title")
	 * or "q" ("/photos/title/cat") depending on which parts has been specified and
	 * which is the current one.
	 * `q` will contain the same string as `qsection` when `qhas` is "section", or
	 * `qfield` when `qhas` is "field".
	 * If entered path starts with "./" then qsection is the same as the 
	 * the one that edited entry belongs to and additional variable "qlocal" is set
	 * to "yes".
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	$(document).ready(function() {
		var params = Symphony.Context.get('autocompleter'),
			env = Symphony.Context.get('env');

		$('.autocompleter:not(.autocompleter-started)')
			.live('keydown.autocompleter', function(event){
				if (event.which == 219 /* [ */ || event.which == 57 /* ( */) {
					$(this).trigger('autocomplete');
				}
			});

		$('div.autocompleter-popup')
			.live('preautocomplete.autocompleter', function(event, options){
				options.qmode = 'raw';
				options.qsection = '';
				options.qfield = '';

				if (options.q[0] == '[') {
					options.qmode = 'embed';
				}
				else if (options.q[0] == '(') {
					options.qmode = 'link';
				}

				if (options.qmode != 'raw') {
					options.q = options.q.substring(1);
				}

				if (options.q[0] == '/') {
					var temp = options.q.match(/^\/([^\/]*)(\/?)/);
					if (temp && temp.length > 0) {
						options.qsection = temp[1];
						if (temp[2] == '/') {
							options.q = options.q.replace(temp[0], '/');
						}
						else {
							options.q = options.q.substring(1);
							options.qhas = 'section';
						}
					}
				}
				else if (options.q[0] == '.' && options.q[1] == '/') {
					options.qsection = options.section;
					options.q = options.q.substring(1);
					options.qlocal = 'yes';
					options.qhas = 'section';
				}

				if (options.q[0] == '/' && options.qsection != '') {
					var temp = options.q.match(/^\/([^\/]*)(\/?)/);
					if (temp && temp.length > 0) {
						options.qfield = temp[1];
						if (temp[2] == '/')	{
							options.q = options.q.replace(temp[0], '');
							options.qhas = 'q';
						}
						else {
							options.q = options.q.substring(1);
							options.qhas = 'field';
						}
					}
				}
			})
		});
})(jQuery.noConflict());
