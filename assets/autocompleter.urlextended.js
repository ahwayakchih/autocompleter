(function($) {
	/**
	 * This plugin modifies variables passed to URL by extracting section and field
	 * names from query. It adds "qmode", "qsection" and "qfield" variables.
	 * qmode can be "raw", "embed" (when phrase starts with "[") or
	 * "link" (when phrase starts with "(").
	 * That way, author can enter "[/photos/file/jpg" to get file uploaded to
	 * "file" upload qfield in "photos" qsection.
	 * If entered path starts with "./" then qsection is the same as the 
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
					var temp = options.q.match(/^\/[^\/\s]*/);
					if (temp && temp.length > 0) {
						options.qsection = temp[0].substring(1);
						options.q = options.q.replace(temp[0], '');
					}
				}
				else if (options.q[0] == '.' && options.q[1] == '/') {
					options.qsection = options.section;
					options.q = options.q.substring(1);
				}

				if (options.q[0] == '/' && options.qsection != '') {
					var temp = options.q.match(/^\/[^\/\s]*/);
					if (temp && temp.length > 0) {
						options.qfield = temp[0].substring(1);
						options.q = options.q.replace(temp[0], '');
					}
				}

				if (options.q[0] == '/') options.q = options.q.substring(1);
			})
		});
})(jQuery.noConflict());
