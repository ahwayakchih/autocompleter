(function($) {
	/**
	 * This plugin autocompletes by using data from predefined URL.
	 *
	 * @author: Marcin Konicki, ahwayakchih@neoni.net
	 * @source: http://github.com/ahwayakchih/autocompleter
	 */

	// Language strings
	Symphony.Language.add({
		'Not found': false,
	});

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

						// If Queue is empty, try to make SubsectionManager load it.
						// This is needed because SubsectionManager appends items to queue,
						// no matter if they already are there or not. So if we add item before 
						// Queue was not loaded, it will be duplicated after Queue is loaded
						// (for example, after user starts browsing it).
						// TODO: remove this if/when SubsectionManager starts appending only new items.
						if ($('div.queue ul li', stage).length < 1) {
							stage.trigger('browsestart');
							stage.trigger('browsestop');
						}

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
					'q': word,
					'field': name,
					'section': env['section_handle']
				}
				if (env['entry_id']) options['entry_id'] = env['entry_id'].toString();
				popup.trigger('preautocomplete', [options]);

				var data = '';
				$.each(options, function(key, value){
					if (key == 'url') return true;
					data += key + '=' + value.replace(' ', '+') + '&';
				});

				$.ajax({
					async: true,
					type: 'GET',
					dataType: 'html',
					url: options.url,
					// We build string ourselves, otherwise slashes and other "special" characters will end up double-encoded :(
					data: data,
					processData: false,
					success: function(data) {
						cache[word] = data;
						popup.find('p.loading.autocompleter-url').replaceWith(data);

						// Do not highlight if query was empty
						if (options.q.length < 1) return;

						var item = popup.find('li.item:first'),
							text = item.attr('data-preview');
						if (text && text.indexOf(word) == 0)
							popup.trigger('highlightitem', [item]);
					},
					error: function() {
						popup.find('p.loading.autocompleter-url').replaceWith('<ul><li class="error">'+Symphony.Language.get('Not found')+'</li></ul>');
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
