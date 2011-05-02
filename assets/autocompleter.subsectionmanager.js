(function($) {
	/**
	 * This plugin autocompletes by using Subsection Manager data.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	$(document).ready(function() {
		var params = Symphony.Context.get('autocompleter');
		if (!params || !params['subsectionmanager']) return;

		var stage = null;

		$('div.autocompleter-popup li.item').live('confirm.autocompleter', function(){
			if (stage) {
				stage.find('li[data-value="'+$(this).attr('data-value')+'"]').trigger('click.stage');

				stage.trigger('browsestop');
				stage = null;
			}
		});

		$('div.autocompleter-popup').live('autocomplete.autocompleter', function(event, info){
			var m = info.editedWordPre.match(/(^|\s+)?\/([^\/]+|)(\/(.*)|)/);
			if (!m) m = [];

			var popup = $(this);

			// m[2] = section handle
			// m[3] = separator
			// m[4] = search string

			if ((!m[2] || !m[3]) && stage) {
				stage.trigger('browsestop');
				stage = null;
			}

			if (m[2]) m[2] = m[2].toLowerCase();
			if (m[4]) m[4] = m[4].toLowerCase();

			var html = $('<ul class="autocompleter-subsectionmanager"></ul>');

			if (!m[2] || !params['subsectionmanager'][m[2]]) {
				if (m[3]) return;

				for (var a in params['subsectionmanager']) {
					if (!m[2] || a.indexOf(m[2]) == 0) {
						html.append('<li class="item subsection continue" data-drop="/'+a+'/" data-preview="/'+a+'/">'+params['subsectionmanager'][a]['label']+'</li>');
					}
				}
			}
			else if (m[2] && !m[3]) {
				html.append('<li class="item subsection continue" data-drop="/'+m[2]+'/" data-preview="/'+m[2]+'/">'+params['subsectionmanager'][m[2]]['label']+'</li>');
			}

			if (m[3]) {
				var subsectionmanager_id = params['subsectionmanager'][m[2]]['id'],
				    subsection = $('input[name="fields\\[subsection_id\\]\\['+subsectionmanager_id+'\\]"]').val();

				stage = $('div.field-subsectionmanager#field-'+subsectionmanager_id+' div.stage');

				var queue = stage.find('div.queue').find('ul').addClass('loading').slideDown('fast'),
				    list = queue.find('ul'),
				    strings = $.trim(m[4]).toLowerCase().split(' ');

				stage.find('.browser input').trigger('search.stage');

				// Searching
				if(strings.length > 0 && strings[0] != '') {
					stage.trigger('searchstart', [strings]);
				}
				// Not searching 
				else {
					queue.find('li').slideDown('fast');
					stage.trigger('searchstop');
					stage.trigger('browsestart');
				}

				queue.find('li:visible').each(function(index, item){
					var data = $(this).attr('data-drop');
					if (!data || data == '') data = $(this).attr('data-value');
					if (!data) data = '';
					$('<li class="item entry">'+$(this).text()+'</li>')
						.attr({
							'data-drop': data,
							'data-value': $(this).attr('data-value'),
							'data-preview': '/'+m[2]+'/'+$(this).text()
						})
						.appendTo(html);
				});
			}

			popup.append(html);
		}).live('cancel.autocompleter', function(){
			if (stage) {
				stage.trigger('browsestop');
				stage = null;
			}
		});
	});
})(jQuery.noConflict());
