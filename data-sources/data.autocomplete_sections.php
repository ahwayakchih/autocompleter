<?php

	require_once(TOOLKIT . '/class.datasource.php');

	Class datasourceautocomplete_sections extends Datasource{

		public $dsParamROOTELEMENT = 'autocomplete-sections';
		public $dsParamREDIRECTONEMPTY = 'no';
		//public $dsParamREQUIREDPARAM = '$url-qsection';
		public $dsParamPAGINATERESULTS = 'no';
		public $dsParamLIMIT = '0';
		public $dsParamSTARTPAGE = '1';
		public $dsParamSORT = 'name';
		public $dsParamORDER = 'asc';
		public $dsParamASSOCIATEDENTRYCOUNTS = 'no';

		public $dsParamFILTERS = array(
			'name' => '{$url-qsection}',
			'fields' => '{$url-qfield}'
		);

		public $dsParamINCLUDEDELEMENTS = array(
			'name',
			'navigation_group',
			'fields'
		);

		public $dsParamPARAMOUTPUT = array(
			'id',
			'handle',
			'fields'
		);

		public function __construct(&$parent, $env=NULL, $process_params=true){
			parent::__construct($parent, $env, $process_params);
			$this->_dependencies = array();
		}

		public function about(){
			return array(
				'name' => 'Autocompleter: Section and Field names',
				'author' => array(
					'name' => 'Marcin Konicki',
					'website' => 'http://ahwayakchih.neoni.net',
					'email' => 'ahwayakchih@neoni.net'),
				'version' => '1.0',
				'release-date' => '2011-06-28',
				'example' => true
			);
		}

		public function getSource(){
			return $this->dsParamROOTELEMENT;
		}

		public function allowEditorToParse(){
			return false;
		}

		public function grab(&$param_pool=NULL){
			try{
				$result = $this->_grab($param_pool);
			}
			catch(FrontendPageNotFoundException $e){
				// Work around. This ensures the 404 page is displayed and
				// is not picked up by the default catch() statement below
				FrontendPageNotFoundExceptionHandler::render($e);
			}
			catch(Exception $e){
				$result = new XMLElement($this->dsParamROOTELEMENT);
				$result->appendChild(new XMLElement('error', $e->getMessage()));
				return $result;
			}

			if($this->_force_empty_result) $result = $this->emptyXMLSet();

			return $result;
		}

		public function example() {
			$div = new XMLElement('div');

			// Extract parameters from filters, so we can put them in help text
			if (is_array($this->dsParamFILTERS) && !empty($this->dsParamFILTERS)) {
				$params = array();
				$urls = array();
				$and = __('and');
				$or = __('or');
				foreach ($this->dsParamFILTERS as $name => $value) {
					if (preg_match_all('%{(\$[^}]+)}%', $value, $m, PREG_PATTERN_ORDER)) {
						foreach ($m[1] as $param) {
							foreach (preg_split('%\s*:\s*%', $param, -1, PREG_SPLIT_NO_EMPTY) as $v) {
								if ($v[0] != '$' || isset($params[$v])) continue;
								if (strpos($v, '$url-') !== 0) {
									$params[$v] = (empty($params) ? '' : ' '.$and.'/'.$or).' <em>'.$v.'</em>';
									continue;
								}
								$temp = substr($v, 5);
								$temp .= '='.(isset($_GET[$temp]) ? $_GET[$temp] : 'test');
								$urls[] = $temp;
								$link = '';
								if (!empty($params)) {
									$link = ' <a href="?'.implode('&amp;', $urls).'">'.__('and').'</a>/'.$or;
								}
								$link .= ' <a href="?'.$temp.'"><em>'.$v.'</em></a>';
								$params[$v] = $link;
							}
						}
					}
				}

				if (!empty($params)) {
					$div->appendChild(new XMLElement('p', __('You can use %s parameters to filter sections and fields by their names.', array(implode('', $params)))));
				}
			}

			$xml = new XMLElement('data');
			$param_pool = array();
			$this->buildExampleEnv($param_pool);

			$result = $this->grab($param_pool);
			if (!($result instanceof XMLElement)) return '';

			if (!is_array($this->dsParamPARAMOUTPUT) || empty($this->dsParamPARAMOUTPUT) || empty($param_pool)) {
				$xml->appendChild($result);
				$div->appendChild(new XMLElement('pre', '<code>' . str_replace('<', '&lt;', $xml->generate(true)) . '</code>'));
				return $div;
			}

			$params = new XMLElement('params');
			foreach($param_pool as $key => $value) {
				$param = new XMLElement($key);

				if (is_array($value) && count($value) > 1 && !empty($value[0])) {
					foreach ($value as $k => $v) {
						$item = new XMLElement('item', General::sanitize($v));
						$item->setAttribute('handle', Lang::createHandle($v));
						$param->appendChild($item);
					}
				}
				else if(is_array($value)) {
					$param->setValue(General::sanitize($value[0]));
				}
				else {
					$param->setValue(General::sanitize($value));
				}

				$params->appendChild($param);
			}

			$xml->appendChild($params);
			$xml->appendChild($result);
			$div->appendChild(new XMLElement('pre', '<code>' . str_replace('<', '&lt;', $xml->generate(true)) . '</code>'));
			return $div;
		}

		private function _grab(&$param_pool=NULL){
			include_once(TOOLKIT . '/class.sectionmanager.php');
			include_once(TOOLKIT . '/class.xmlelement.php');
			$sm = new SectionManager(Symphony::Engine());
			$sections = $sm->fetch(NULL, 'ASC', 'name');
			if (empty($sections)) return $this->emptyXMLSet();

			$key = 'ds-' . $this->dsParamROOTELEMENT;
			if (!is_array($this->dsParamPARAMOUTPUT)) $this->dsParamPARAMOUTPUT = array();
			foreach ($this->dsParamPARAMOUTPUT as $name) {
				if (!is_array($param_pool[$key . '-' . $name])) $param_pool[$key . '-' . $name] = array();
			}

			if (!is_array($this->dsParamINCLUDEDELEMENTS)) $this->dsParamINCLUDEDELEMENTS = array();
			$includeName = in_array('name', $this->dsParamINCLUDEDELEMENTS);
			$includeNavigationGroup = in_array('navigation_group', $this->dsParamINCLUDEDELEMENTS);
			$includeFields = in_array('fields', $this->dsParamINCLUDEDELEMENTS);

			$result = new XMLElement($this->dsParamROOTELEMENT);
			$filters = array_filter(array_map('strtolower', array_map('trim', $this->dsParamFILTERS)));
			foreach ($sections as $section) {
				$handle = $section->get('handle');
				$spos = 0;
				if (isset($filters['name'])) {
					$temp = strtolower($handle);
					$spos = strpos($temp, $filters['name']);
					if ($spos === FALSE) continue;
					else if ($spos == 0 && $temp != $filters['name']) $spos++;
				}

				$s = new XMLElement('section', NULL, array(
					'id' => $section->get('id'),
					'handle' => $handle,
					'proximity' => $spos,
					'hidden' => $section->get('hidden'),
					'sortorder' => $section->get('sortorder')
				));
				if ($includeName) $s->appendChild(new XMLElement('name', $section->get('name')));
				if ($includeNavigationGroup) $s->appendChild(new XMLElement('navigation-group', $section->get('navigation_group')));

				$found = array();
				if (isset($filters['fields']) || $includeFields) {
					$fields = $section->fetchFields();
					if (!is_array($fields)) continue;

					foreach ($fields as $field) {
						$handle = $field->get('element_name');
						$fpos = 0;
						if (isset($filters['fields'])) {
							$temp = strtolower($handle);
							$fpos = strpos($temp, $filters['fields']);
							if ($fpos === FALSE) continue;
							else if ($fpos == 0 && $temp != $filters['fields']) $fpos++;
						}
						$found[] = $id = $field->get('id');
						if ($includeFields) $s->appendChild(new XMLElement('field', $field->get('label'), array(
							'id' => $id,
							'type' => $field->get('type'),
							'handle' => $handle,
							'required' => $field->get('required'),
							'location' => $field->get('location'),
							'show_column' => $field->get('show_column'),
							'hide' => ($field->get('hide') == 'yes' ? 'yes' : 'no'), // "hide" seems to be used by 3rd party extensions
							'proximity' => $fpos
						)));
					}

					if (empty($found)) continue;
				}

				foreach ($this->dsParamPARAMOUTPUT as $name) {
					if ($name == 'fields') $param_pool[$key . '-' . $name] = array_merge($param_pool[$key . '-' . $name], $found);
					else $param_pool[$key . '-' . $name][] = $section->get($name);
				}

				$result->appendChild($s);
			}

			return $result;
		}

		private function buildExampleEnv(&$param_pool) {
			$env = array();

			// Code from Symphony's `class.frontpage.php`->`__buildPage()`.
			if (is_array($_GET) && !empty($_GET)) {
				foreach ($_GET as $key => $val) {
					if (in_array($key, array('symphony-page', 'debug', 'profile', 'mode'))) continue;

					// If the browser sends encoded entities for &, ie. a=1&amp;b=2
					// this causes the $_GET to output they key as amp;b, which results in
					// $url-amp;b. This pattern will remove amp; allow the correct param
					// to be used, $url-b
					$key = preg_replace('/^amp;/', null, $key);
					$env['param']['url-' . $key] = $val;
				}
			}

			$this->processParameters($env);
			if (is_array($env['param'])) $param_pool = array_merge($param_pool, $env['param']);
		}

	}
