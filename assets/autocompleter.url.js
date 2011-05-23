(function($) {
	/**
	 * This plugin autocompletes by using data from predefined URL.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	$(document).ready(function() {
		var params = Symphony.Context.get('autocompleter'),
			env = Symphony.Context.get('env'),
			lastID = null,
			cache = {};

		$('div.autocompleter-popup li.item')
			.live('confirm.autocompleter', function(){
				var item = $(this),
					id = item.attr('data-value'),
					select = item.attr('data-select-in');

				if (!id || id == '' || !select || select == '') return;
				select = select.match(/[^,]+/g);

				$.each(select, function(index, value){
					var field = $('div.field *[name^="fields\\['+value+'\\]"]').parents('div.field');

					if (field.is('.field-subsectionmanager')) {
						var stage = field.find('div.stage'),
							selection = stage.find('ul.selection');

						// Ignore if item is already selected
						if (selection.find('li[data-value="'+id+'"]').length > 0) return;

						// Get item order
						// For some reason, this will not find new items.
						// So we get "old" items first, and then add new ones below.
						var sortorder = selection.find('li').map(function() {
							return $(this).attr('data-value');
						}).get().join(',');

						// Add item
						var uploadeditem = $('<li><span></span></li>').appendTo(selection),
							fakeframe = $('<div><div><form action="dummy://'+id+'">dummy</form></div></div>');
						if (stage.is('.destructable')) {
							$('<a class="destructor">&#215;</a>').appendTo(uploadeditem);
						}
						stage.trigger('edit', [uploadeditem, fakeframe]);

						sortorder += (sortorder == '' ? '' : ',') + id;

						// Save sortorder				
						field.find('input[name*="sort_order"]').val(sortorder);

						if (sortorder != '') {
							selection.find('li.empty.message').remove();
						}
					}
				});

				//if (stage) {
				//	stage.find('li[data-value="'+$(this).attr('data-value')+'"]:not(.selected)').trigger('click.stage');
				//}
			});

		$('div.autocompleter-popup')
			.live('autocomplete.autocompleter', function(event, word){
				var popup = $(this),
					id = popup.attr('id').replace('-autocompleter', ''),
					input = $('#'+id),
					url = input.attr('data-autocompleterurl'),
					name = input.attr('name').replace('fields[', '').replace(']', '');

				if (!url) return;

				if (url[0] == '/') url = Symphony.Context.get('root') + '/' + url;

				if (lastID == name+'|'+url) {
					if (cache[word]) {
						popup.append(cache[word]);

						var item = popup.find('li.item:first'),
							text = item.attr('data-preview');
						if (text && text.indexOf(word) == 0)
							popup.trigger('highlightitem', [item]);

						return;
					}
				}
				lastID = name+'|'+url;

				popup.append('<p class="loading autocompleter-url">...</p>');

				// Allow other scripts to override our request.
				var options = {
					'url': url,
					'word': word,
					'field': name,
					'section': env['section_handle']
				}
				popup.trigger('preautocomplete', [options]);

				$.ajax({
					async: true,
					type: 'GET',
					dataType: 'html',
					url: options.url,
					// We build string ourselves, otherwise slashes and other "special" characters will end up double-encoded :(
					data: 'q='+options.word.replace(' ','+')+'&section='+options.section+'&field='+options.field,
					processData: false,
					success: function(data) {
						cache[word] = data;
						popup.find('p.loading.autocompleter-url').replaceWith(data);

						var item = popup.find('li.item:first'),
							text = item.attr('data-preview');
						if (text && text.indexOf(word) == 0)
							popup.trigger('highlightitem', [item]);
					}
				});
			})
			.live('stop.autocompleter', function(){
			//	if (stage) {
			//		stage.trigger('browsestop');
			//		stage = null;
			//	}
			});
		});
})(jQuery.noConflict());
