<?php
	Class extension_autocompleter extends Extension{

		private static $foundFields;

		public function about(){
			return array('name' => 'Autocompleter',
						 'version' => '1.0',
						 'release-date' => '2011-05-01',
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
					`autocomplete` varchar(12) DEFAULT "",
					`interval` int unsigned DEFAULT 0,
					`keyCode` int DEFAULT -1,
					PRIMARY KEY (`field_id`),
					INDEX section_id (`section_id`)
				)
			')) return false;
		}

		public function uninstall() {
			Symphony::Database()->query('DROP TABLE IF EXISTS tbl_autocompleter_fields');
		}

		public function getSubscribedDelegates(){
			return array(
				// TextArea field
				array(
					'page' => '/backend/',
					'delegate' => 'ModifyTextareaFieldPublishWidget',
					'callback' => '__ModifyTextareaFieldPublishWidget',
				),
				// TextBox extension
				array(
					'page' => '/backend/',
					'delegate' => 'ModifyTextBoxInlineFieldPublishWidget',
					'callback' => '__ModifyTextareaFieldPublishWidget',
				),
				// TextBox extension
				array(
					'page' => '/backend/',
					'delegate' => 'ModifyTextBoxFullFieldPublishWidget',
					'callback' => '__ModifyTextareaFieldPublishWidget',
				),
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
					'page' => '/administration/',
					'delegate' => 'AdminPagePreGenerate',
					'callback' => '__AdminPagePreGenerate',
				),
				array(
					'page' => '/administration/',
					'delegate' => 'AdminPagePostGenerate',
					'callback' => '__AdminPagePostGenerate',
				),
			);
		}

		public function __ModifyTextareaFieldPublishWidget($ctx) {
			// context array contains: &$field, &$label, &$textarea

			$value = Symphony::Database()->fetchRow(0, '
				SELECT `autocomplete`, `interval`, `keyCode`
				FROM tbl_autocompleter_fields	
				WHERE `field_id` = '.$ctx['field']->get('id').' AND `section_id` = '.$ctx['field']->get('parent_section').' AND `keyCode` > -1'
			);
			if (empty($value) || empty($value['autocomplete'])) return;

			$element = NULL;
			if (!empty($ctx['textarea'])) $element = 'textarea';
			else if (!empty($ctx['input'])) $element = 'input';
			else return;

			$ctx[$element]->setAttribute('class', trim($ctx[$element]->getAttribute('class')).' autocompleter');
			$ctx[$element]->setAttribute('data-autocompleter', $value['autocomplete']);
			$ctx[$element]->setAttribute('data-autocompleterinterval', ($value['interval'] >= 0 ? $value['interval'] : '0'));
			$ctx[$element]->setAttribute('data-autocompleterkeycode', $value['keyCode']);
			self::$foundFields = true;
		}

		public function __InitaliseAdminPageHead() {
			$callback = Symphony::Engine()->getPageCallback();

			if ($callback['driver'] != 'blueprintssections' || !is_array($callback['context'])) return;

			if ($callback['context'][0] == 'edit' && is_numeric($callback['context'][1])) {
				$values = Symphony::Database()->fetch('
					SELECT *
					FROM tbl_autocompleter_fields	
					WHERE `section_id` = '.intval($callback['context'][1]),
					'field_id'
				);
				if (!empty($values)) {
					Administration::instance()->Page->addElementToHead(
						new XMLElement(
							'script',
							"Symphony.Context.add('autocompleter', " . json_encode(array('fields' => $values)) . ");",
							array('type' => 'text/javascript')
						), 100
					);
				}
			}

			// Append scripts and styles for field settings pane
			Administration::instance()->Page->addScriptToHead(URL . '/extensions/autocompleter/assets/autocompleter.settings.js', 101, false);
		}

		// Adds script and css to head right before page rendering.
		// That way we're sure that there is a need to add our script.
		public function __AdminPagePreGenerate($ctx) {
			// context array contains: &$oPage

			if (!self::$foundFields) return;

			$ctx['oPage']->addScriptToHead(URL . '/extensions/autocompleter/lib/jQuery.selectionPosition/jquery.selectionposition.js', 100, false);
			$ctx['oPage']->addScriptToHead(URL . '/extensions/autocompleter/assets/autocompleter.publish.js', 101, false);
			$ctx['oPage']->addStylesheetToHead(URL . '/extensions/autocompleter/assets/autocompleter.publish.css', 'screen', 101, false);

			$callback = Symphony::Engine()->getPageCallback();
			if (!empty($callback['context']['section_handle'])) {
				// Use Subsection Manager fields as one of the data sources

				$sm = new SectionManager(Symphony::Engine());
				$section_id = $sm->fetchIDFromHandle($callback['context']['section_handle']);
				$section = $sm->fetch($section_id);

				$fm = new FieldManager(Symphony::Engine());
				$fields = $section->fetchFields('subsectionmanager');

				$js = array();
				foreach ($fields as $field) {
					$js[$field->get('element_name')] = array(
						'id' => $field->get('id'),
						'label' => $field->get('label'),
					);
				}

				if (!empty($js)) {
					$ctx['oPage']->addScriptToHead(URL . '/extensions/autocompleter/assets/autocompleter.subsectionmanager.js', 101, false);
					// Let our script know about subsection manager fields.
					$ctx['oPage']->addElementToHead(
						new XMLElement(
							'script',
							"Symphony.Context.add('autocompleter', " . json_encode(array('subsectionmanager' => $js, 'section_id' => $section_id)) . ");",
							array('type' => 'text/javascript')
						), 101
					);
				}
			}
		}

		public function __FieldPostEdit($ctx) {
			// context array contains: &$field, &$data

			if (!isset($ctx['data']) || !isset($ctx['data']['autocompleter']) || !in_array($ctx['data']['type'], array('textarea', 'textbox'))) return;

			$fields = array(
				'field_id' => intval($ctx['field']->get('id')),
				'section_id' => intval($ctx['field']->get('parent_section')),
				'autocomplete' => $ctx['data']['autocompleter']['autocomplete'],
				'interval' => intval($ctx['data']['autocompleter']['interval']),
				'keyCode' => self::findKeyCode($ctx['data']['autocompleter']['autocomplete']),
			);

			Symphony::Database()->query("DELETE FROM tbl_autocompleter_fields WHERE section_id = {$fields['section_id']} AND field_id = {$fields['field_id']}");

			if (!empty($fields['autocomplete'])) {
				Symphony::Database()->insert($fields, 'tbl_autocompleter_fields');
			}
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

