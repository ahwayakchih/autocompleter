<?php
	Class extension_autocompleter extends Extension{

		private static $foundFields;
		private static $settings;

		public function about(){
			return array('name' => 'Autocompleter',
						 'version' => '1.1',
						 'release-date' => '2011-05-17',
						 'author' => array('name' => 'Marcin Konicki',
										   'website' => 'http://ahwayakchih.neoni.net',
										   'email' => 'ahwayakchih@neoni.net'),
						 'description' => __('Enable automplete options on text fields.')
			);
		}

		public function install(){
			if (!Symphony::Database()->query('
				CREATE TABLE IF NOT EXISTS tbl_autocompleter_fields (
					`field_id` int unsigned,
					`section_id` int unsigned,
					`url` varchar(255) DEFAULT "",
					PRIMARY KEY (`field_id`),
					INDEX section_id (`section_id`)
				)
			')) return false;
		}

		public function update($previousVersion=false) {
			if (!$this->install()) return false;

			if (version_compare($previousVersion, '1.1', '<')) {
				Symphony::Database()->query('ALTER TABLE tbl_autocompleter_fields DROP COLUMN `command`');
				Symphony::Database()->query('ALTER TABLE tbl_autocompleter_fields DROP COLUMN `interval`');
				Symphony::Database()->query('ALTER TABLE tbl_autocompleter_fields DROP COLUMN `keyCode`');
				Symphony::Database()->query('ALTER TABLE tbl_autocompleter_fields ADD COLUMN `url` VARCHAR(255) DEFAULT ""');
			}

			return true;
		}

		public function uninstall() {
			Symphony::Database()->query('DROP TABLE IF EXISTS tbl_autocompleter_fields');
		}

		public function getSubscribedDelegates(){
			return array(
				// Symphony
				array(
					'page' => '/blueprints/sections/',
					'delegate' => 'FieldPostCreate',
					'callback' => '__FieldPostEdit',
				),
				array(
					'page' => '/blueprints/sections/',
					'delegate' => 'FieldPostEdit',
					'callback' => '__FieldPostEdit',
				),
				array(
					'page' => '/backend/',
					'delegate' => 'InitaliseAdminPageHead',
					'callback' => '__InitaliseAdminPageHead'
				),
				array(
					'page' => '/system/preferences/',
					'delegate' => 'AddCustomPreferenceFieldsets',
					'callback' => '__AddCustomPreferenceFieldsets',
				),
				array(
					'page' => '/system/preferences/',
					'delegate' => 'Save',
					'callback' => '__SaveCustomPreferenceData',
				),
			);
		}

		public function __InitaliseAdminPageHead() {
			$callback = Symphony::Engine()->getPageCallback();
			if (!is_array($callback['context'])) return;

			if ($callback['driver'] == 'blueprintssections') {
				$this->__InitHeadSectionSettings($callback);
			}
			else if ($callback['driver'] == 'publish') {
				$this->__InitHeadPublish($callback);
			}
		}

		private function __InitHeadSectionSettings($callback) {
			$js = array();
			$settings = self::settings();

			if ($callback['context'][0] == 'edit' && is_numeric($callback['context'][1])) {
				$values = Symphony::Database()->fetch('
					SELECT *
					FROM tbl_autocompleter_fields	
					WHERE `section_id` = '.intval($callback['context'][1]),
					'field_id'
				);
				if (!empty($values)) {
					$js['fields'] = $values;
				}
			}

			$js['source_url'] = $settings['source_url'];

			Administration::instance()->Page->addElementToHead(
				new XMLElement(
					'script',
					"Symphony.Context.add('autocompleter', " . json_encode($js) . ");",
					array('type' => 'text/javascript')
				), 100
			);

			// Append scripts and styles for field settings pane
			Administration::instance()->Page->addScriptToHead(URL . '/extensions/autocompleter/assets/autocompleter.blueprintssections.js', 101, false);
			Administration::instance()->Page->addStylesheetToHead(URL . '/extensions/autocompleter/assets/autocompleter.blueprintssections.css', 'screen', 101, false);
		}

		private function __InitHeadPublish($callback) {
			if (empty($callback['context']['section_handle'])) return;

			$settings = self::settings();

			$sm = new SectionManager(Symphony::Engine());
			$section_id = $sm->fetchIDFromHandle($callback['context']['section_handle']);

			$js = array('section_id' => $section_id);
			$js['fields'] = Symphony::Database()->fetch('
				SELECT `field_id`, `section_id`'.($settings['source_url'] == 'yes' ? ', `url`' : '').'
				FROM tbl_autocompleter_fields	
				WHERE `section_id` = '.intval($section_id),
				'field_id'
			);
			if (empty($js['fields'])) return;

			if ($settings['source_subsectionmanager'] == 'yes') {
				// Use Subsection Manager fields as one of the data sources
				$section = $sm->fetch($section_id);
				$fields = $section->fetchFields('subsectionmanager');
				foreach ($fields as $field) {
					$js['subsectionmanager'][$field->get('element_name')] = array(
						'id' => $field->get('id'),
						'label' => $field->get('label'),
					);
				}
			}

			$js['interval'] = $settings['interval'];

			// Let our script know about supported fields fields.
			Administration::instance()->Page->addElementToHead(
				new XMLElement(
					'script',
					"Symphony.Context.add('autocompleter', " . json_encode($js) . ");",
					array('type' => 'text/javascript')
				), 100
			);

			// Last but not least, add our scripts.
			Administration::instance()->Page->addStylesheetToHead(URL . '/extensions/autocompleter/assets/autocompleter.publish.css', 'screen', 151, false);
			Administration::instance()->Page->addScriptToHead(URL . '/extensions/autocompleter/lib/jQuery.selectionPosition/jquery.selectionposition.js', 100, false);
			Administration::instance()->Page->addScriptToHead(URL . '/extensions/autocompleter/assets/autocompleter.publish.js', 151, false);

			if (!empty($js['subsectionmanager'])) {
				Administration::instance()->Page->addScriptToHead(URL . '/extensions/autocompleter/assets/autocompleter.subsectionmanager.js', 152, false);
			}

			if ($settings['source_url'] == 'yes') {
				Administration::instance()->Page->addStylesheetToHead(URL . '/extensions/autocompleter/assets/autocompleter.url.css', 'screen', 152, false);
				Administration::instance()->Page->addScriptToHead(URL . '/extensions/autocompleter/assets/autocompleter.url.js', 152, false);
			}

			if (!empty($settings['css'])) {
				Administration::instance()->Page->addStylesheetToHead(($settings['css'][0] == '/' ? URL : '') . $settings['css'], 'screen', 153, false);
			}

			if (!empty($settings['js'])) {
				Administration::instance()->Page->addScriptToHead(($settings['js'][0] == '/' ? URL : '') . $settings['js'], 153, false);
			}
		}

		public function __FieldPostEdit($ctx) {
			// context array contains: &$field, &$data

			if (!isset($ctx['data']) || !isset($ctx['data']['autocompleter']) || !in_array($ctx['data']['type'], array('input', 'textarea', 'textbox'))) return;

			$fields = array(
				'field_id' => intval($ctx['field']->get('id')),
				'section_id' => intval($ctx['field']->get('parent_section')),
				'url' => trim($ctx['data']['autocompleter']['url'])
			);

			Symphony::Database()->query("DELETE FROM tbl_autocompleter_fields WHERE section_id = {$fields['section_id']} AND field_id = {$fields['field_id']}");

			if ($ctx['data']['autocompleter']['enabled'] == 'Yes') {
				Symphony::Database()->insert($fields, 'tbl_autocompleter_fields');
			}
		}

		public function __AddCustomPreferenceFieldsets($ctx) {
			// context array contains: &$wrapper

			$settings = self::settings();

			$group = new XMLElement('fieldset');
			$group->setAttribute('class', 'settings');
			$group->appendChild(new XMLElement('legend', __('Autocompleter')));			

			$div = new XMLElement('div');
			$div->setAttribute('class', 'group triple');

			// Set how much time script will wait before launching autocompletion search
			$label = Widget::Label(__('Interval (milliseconds)'));
			$label->appendChild(Widget::Input('autocompleter[interval]', $settings['interval']));
			$div->appendChild($label);

			// Set additional CSS file
			$label = Widget::Label(__('Path or URL to custom CSS file'));
			$label->appendChild(Widget::Input('autocompleter[css]', $settings['css']));
			$div->appendChild($label);

			// Set additional JS file
			$d = new XMLElement('div');
			$label = Widget::Label(__('Path or URL to custom JavaScript file'));
			$label->appendChild(Widget::Input('autocompleter[js]', $settings['js']));
			$d->appendChild($label);
			$optionlist = new XMLElement('ul');
			$optionlist->setAttribute('class', 'tags');
			$optionlist->appendChild(new XMLElement('li', 'autocompleter.urlextended.js', array('class' => '/extensions/autocompleter/assets/autocompleter.urlextended.js')));
			$d->appendChild($optionlist);
			$div->appendChild($d);

			$group->appendChild($div);

			// Disable/Enable Subsection Manager source
			$label = Widget::Label();
			$input = Widget::Input('autocompleter[source_subsectionmanager]', 'yes', 'checkbox');
			if ($settings['source_subsectionmanager'] == 'yes') $input->setAttribute('checked', 'checked');
			$label->setValue(__('%s Use Subsection Manager fields as source for autocompletion', array($input->generate())));
			$group->appendChild($label);

			// Disable/Enable URL source
			$label = Widget::Label();
			$input = Widget::Input('autocompleter[source_url]', 'yes', 'checkbox');
			if ($settings['source_url'] == 'yes') $input->setAttribute('checked', 'checked');
			$label->setValue(__('%s Allow to setup URL source for each field that has autocompleter enabled', array($input->generate())));
			$group->appendChild($label);
					
			$ctx['wrapper']->appendChild($group);
		}

		public function __SaveCustomPreferenceData($ctx) {
			// context array contains: &$settings, &$errors
			$css = str_replace(array('"',"'",'<','>','javascript'), '', trim($_POST['autocompleter']['css']));
			if ($css[0] != '/' && !preg_match('%^(https?|ftp)://%i', $css)) $css = '';

			$js = str_replace(array('"',"'",'<','>','javascript'), '', trim($_POST['autocompleter']['js']));
			if ($js[0] != '/' && !preg_match('%^(https?|ftp)://%i', $js)) $js = '';

			$settings = array(
				'interval' => intval($_POST['autocompleter']['interval']),
				'source_subsectionmanager' => ($_POST['autocompleter']['source_subsectionmanager'] == 'yes' ? 'yes' : 'no'),
				'source_url' => ($_POST['autocompleter']['source_url'] == 'yes' ? 'yes' : 'no'),
				'css' => $css,
				'js' => $js
			);
			$php = '<'."?php\n\n".'$settings = '.var_export($settings, true).';';
			file_put_contents(MANIFEST . '/autocompleter.php', $php);
		}

		private static function settings() {
		    if (!is_array(self::$settings) && file_exists(MANIFEST . '/autocompleter.php')) {
				@include_once(MANIFEST . '/autocompleter.php');
				self::$settings = (is_array($settings) ? $settings : array());
			}
			return self::$settings;
		}

		private static function findKeyCode($text) {
			// from: http://stackoverflow.com/questions/1659444/get-keycode-from-string

			$keyCodes = array(
				27=>27,         //esc
				96=>192,        //`
				49=>49,         //1
				50=>50,         //2
				51=>51,         //3
				52=>52,         //4
				53=>53,         //5
				54=>54,         //6
				55=>55,         //7
				56=>56,         //8
				57=>57,         //9
				48=>48,         //0
				45=>189,        //-
				61=>187,        //=
				8=>8,           //backspace
				9=>9,           //tab
				113=>81,        //q
				119=>87,        //w
				101=>69,        //e
				114=>82,        //r
				116=>84,        //t
				121=>89,        //y
				117=>85,        //u
				105=>73,        //i
				111=>79,        //o
				112=>80,        //p
				91=>219,        //[
				93=>221,        //]
				92=>220,        //\
				97=>65,         //a
				115=>83,        //s
				100=>68,        //d
				102=>70,        //f
				103=>71,        //g
				104=>72,        //h
				106=>74,        //j
				107=>75,        //k
				108=>76,        //l
				59=>186,        //;
				39=>222,        //'
				13=>13,         //enter
				122=>90,        //z
				120=>88,        //x
				99=>67,         //c
				118=>86,        //v
				98=>66,         //b
				110=>78,        //n
				109=>77,        //m
				44=>188,        //,
				46=>190,        //.
				47=>191,        ///
				32=>32,         //space
				127=>46,        //delete
				126=>192,       //~
				33=>49,         //!
				64=>50,         //@
				35=>51,         //#
				36=>52,         //$
				37=>53,         //%
				94=>54,         //^
				38=>55,         //&
				42=>56,         //*
				40=>57,         //(
				41=>48,         //)
				95=>189,        //_
				43=>187,        //+
				81=>81,         //Q
				87=>87,         //W
				69=>69,         //E
				82=>82,         //R
				84=>84,         //T
				89=>89,         //Y
				85=>85,         //U
				73=>73,         //I
				79=>79,         //O
				80=>80,         //P
				123=>219,       //{
				125=>221,       //}
				124=>220,       //|
				65=>65,         //A
				83=>83,         //S
				68=>68,         //D
				70=>70,         //F
				71=>71,         //G
				72=>72,         //H
				74=>74,         //J
				75=>75,         //K
				76=>76,         //L
				58=>186,        //:
				34=>222,        //"
				90=>90,         //Z
				88=>88,         //X
				67=>67,         //C
				86=>86,         //V
				66=>66,         //B
				78=>78,         //N
				77=>77,         //M
				60=>188,        //<
				62=>190,        //>
				63=>191         //?
			);

			$s = substr($text, -1);
			$s = ord($s);
			$s = $keyCodes[$s];
			return (empty($s) ? -1 : $s);
		}

	}

