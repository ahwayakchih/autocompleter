(function($) {

	/**
	 * This plugin adds an autocompleter functionality on publish pages.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */
	$(document).ready(function() {
		var timer = null;

		$('textarea.autocompleter[data-autocompleterkeycode], input.autocompleter[data-autocompleterkeycode]').live('keyup', function(event){
			if (event.keyCode != $(this).attr('data-autocompleterkeycode')) return;

			var field = $(this);

			if (timer != null) clearTimeout(timer);
			timer = null;

			var interval = $(this).attr('data-autocompleterinterval');
			timer = setTimeout(function(){

// TODO: do the magic

			}, interval);
		});

	});
})(jQuery.noConflict());
