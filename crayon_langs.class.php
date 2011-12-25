<?php
require_once ('global.php');
require_once (CRAYON_RESOURCE_PHP);

/* Manages languages once they are loaded. The parser directly loads them, saves them here. */
class CrayonLangs extends CrayonResourceCollection {
	// Properties and Constants ===============================================
	// CSS classes for known elements
	private static $known_elements = array('COMMENT' => 'c', 'STRING' => 's', 'KEYWORD' => 'k', 
			'STATEMENT' => 'st', 'RESERVED' => 'r', 'TYPE' => 't', 'TAG' => 'ta', 'MODIFIER' => 'm', 'IDENTIFIER' => 'i', 
			'ENTITY' => 'e', 'VARIABLE' => 'v', 'CONSTANT' => 'cn', 'OPERATOR' => 'o', 'SYMBOL' => 'sy', 
			'NOTATION' => 'n', 'FADED' => 'f', CrayonParser::HTML_CHAR => 'h', CrayonParser::CRAYON_ELEMENT => 'crayon-internal-element');
	const DEFAULT_LANG = 'default';
	const DEFAULT_LANG_NAME = 'Default';
	
	// Used to cache the delimiters, since they are unlikely to change during a single run
	private static $delimiters = NULL; 
	
	// Methods ================================================================
	public function __construct() {
		$this->set_default(self::DEFAULT_LANG, self::DEFAULT_LANG_NAME);
		$this->directory(CRAYON_LANG_PATH);
	}

	// XXX Override
	public function path($id) {
		return CRAYON_LANG_PATH . $id . "/$id.txt";
	}

	// XXX Override
	public function load_process() {
		parent::load_process();
		$this->load_exts();
		$this->load_aliases();
		$this->load_delimiters(); // TODO check for setting? 
	}

	// XXX Override
	public function resource_instance($id, $name = NULL) {
		return new CrayonLang($id, $name);
	}

	// XXX Override
	public function add_default() {
		$result = parent::add_default();
		if ($this->is_state_loading() && !$result) {
			// Default not added, must already be loaded, ready to parse
			CrayonParser::parse(self::DEFAULT_LANG);
		}
	}

	/* Attempts to detect the language based on extension, otherwise falls back to fallback language given.
	 * Returns a CrayonLang object. */
	public function detect($path, $fallback_id = NULL) {
		$this->load();
		extract(pathinfo($path));
		
		// If fallback id if given
		if ($fallback_id == NULL) {
			// Otherwise use global fallback
			$fallback_id = CrayonGlobalSettings::get(CrayonSettings::FALLBACK_LANG);
		}
		// Attempt to use fallback
		$fallback = $this->get($fallback_id);
		// Use extension before trying fallback
		$extension = isset($extension) ? $extension : '';
		
		if ( !empty($extension) && ($lang = $this->ext($extension)) || ($lang = $this->get($extension)) ) {
			// If extension is found, attempt to find a language for it.
			// If that fails, attempt to load a language with the same id as the extension.
			return $lang;
		} else if ($fallback != NULL || $fallback = $this->get_default()) {
			// Resort to fallback if loaded, or fallback to default
			return $fallback;
		} else {
			// No language found
			return NULL;
		}
	}

	/* Load all extensions and add them into each language. */
	private function load_exts() {
		// Load only once
		if (!$this->is_state_loading()) {
			return;
		}
		if ( ($lang_exts = self::load_attr_file(CRAYON_LANG_EXT)) !== FALSE ) {
			foreach ($lang_exts as $lang_id=>$exts) {
				$lang = $this->get($lang_id);
				$lang->ext($exts);
			}
		}
	}
	
	/* Load all extensions and add them into each language. */
	private function load_aliases() {
	// Load only once
		if (!$this->is_state_loading()) {
			return;
		}
		if ( ($lang_aliases = self::load_attr_file(CRAYON_LANG_ALIAS)) !== FALSE ) {
			foreach ($lang_aliases as $lang_id=>$aliases) {
				$lang = $this->get($lang_id);
				$lang->alias($aliases);
			}
		}
	}
	
	/* Load all extensions and add them into each language. */
	private function load_delimiters() {
	// Load only once
		if (!$this->is_state_loading()) {
			return;
		}
		if ( ($lang_delims = self::load_attr_file(CRAYON_LANG_DELIM)) !== FALSE ) {
			foreach ($lang_delims as $lang_id=>$delims) {
				$lang = $this->get($lang_id);
				$lang->delimiter($delims);
			}
		}
	}
	
	// Used to load aliases and extensions to languages
	private function load_attr_file($path) {
		if ( ($lines = CrayonUtil::lines($path, 'lwc')) !== FALSE) {
			$attributes = array(); // key = language id, value = array of attr
			foreach ($lines as $line) {
				preg_match('#^[\t ]*([^\r\n\t ]+)[\t ]+([^\r\n]+)#', $line, $matches);
				if (count($matches) == 3 && $lang = $this->get($matches[1])) {
					// If the langauges of the attribute exists, return it in an array
					// TODO merge instead of replace key?
					$attributes[$matches[1]] = explode(' ', $matches[2]);
				}
			}
			return $attributes;
		} else {
			CrayonLog::syslog('Could not load attr file: ' . $path);
			return FALSE;
		}
	}

	/* Returns the CrayonLang for the given extension */
	public function ext($ext) {
		$this->load();
		foreach ($this->get() as $lang) {
			if ($lang->has_ext($ext)) {
				return $lang;
			}
		}
		return FALSE;
	}
	
	/* Returns the CrayonLang for the given alias */
	public function alias($alias) {
		$this->load();
		foreach ($this->get() as $lang) {
			if ($lang->has_alias($alias)) {
				return $lang;
			}
		}
		return FALSE;
	}
	
	/* Returns all the delimiters for the languages in an associative array of CrayonLang id strings as keys */
	public function delimiters($reload = FALSE) {
		$this->load();
		if (self::$delimiters === NULL || $reload) {
			$delimiters = array();
			foreach ($this->get() as $lang) {
				$lang_delims_regex = $lang->delimiter();
				if ( !empty($lang_delims_regex) ) {
					$delimiters[$lang->id()] = $lang->delimiter();
				}
			}
			self::$delimiters = $delimiters;
		}
		return self::$delimiters;
	}

	/* Return the array of valid elements or a particular element value */
	public static function known_elements($name = NULL) {
		if ($name === NULL) {
			return self::$known_elements;
		} else if (is_string($name) && array_key_exists($name, self::$known_elements)) {
			return self::$known_elements[$name];
		} else {
			return FALSE;
		}
	}

	/* Verify an element is valid */
	public static function is_known_element($name) {
		return self::known_elements($name) !== FALSE;
	}

	public function is_loaded($id) {
		if (is_string($id)) {
			return array_key_exists($id, $this->get());
		}
		return FALSE;
	}

	public function is_parsed($id = NULL) {
		if ($id === NULL) {
			// Determine if all langs are successfully parsed
			foreach ($this->get() as $lang) {
				if ($lang->state() != CrayonLang::PARSED_SUCCESS) {
					return FALSE;
				}
			}
			return TRUE;
		} else if (($lang = $this->get($id)) != FALSE) {
			return $lang->is_parsed();
		}
		return FALSE;
	}

	public function is_default($id) {
		if (($lang = $this->get($id)) != FALSE) {
			return $lang->is_default();
		}
		return FALSE;
	}
}

/* Individual language. */
class CrayonLang extends CrayonVersionResource {
	private $ext = array();
	private $aliases = array();
	private $delimiters = '';
	// Associative array of CrayonElement objects
	private $elements = array();
	//private $regex = '';
	private $state = self::UNPARSED;
	private $modes = array();
	const PARSED_ERRORS = -1;
	const UNPARSED = 0;
	const PARSED_SUCCESS = 1;

	function __construct($id, $name = NULL) {
		parent::__construct($id, $name);
		$this->modes = CrayonParser::modes();
	}

	function ext($ext = NULL) {
		if ($ext === NULL) {
			return $this->ext;
		} else if (is_array($ext) && !empty($ext)) {
			foreach ($ext as $e) {
				$this->ext($e);
			}
		} else if (is_string($ext) && !empty($ext) && !in_array($ext, $this->ext)) {
			$ext = strtolower($ext);
			$ext = str_replace('.', '', $ext);
			$this->ext[] = $ext;
		}
	}
	
	function has_ext($ext) {
		return is_string($ext) && in_array($ext, $this->ext);
	}
	
	function alias($alias = NULL) {
		if ($alias === NULL) {
			return $this->aliases;
		} else if (is_array($alias) && !empty($alias)) {
			foreach ($alias as $a) {
				$this->alias($a);
			}
		} else if (is_string($alias) && !empty($alias) && !in_array($alias, $this->aliases)) {
			$alias = strtolower($alias);
			$this->aliases[] = $alias;
		}
	}
	
	function has_alias($alias) {
		return is_string($alias) && in_array($alias, $this->aliases);
	}
	
	function delimiter($delim = NULL) {
		if ($delim === NULL) {
			return $this->delimiters;
		// Convert to regex for capturing delimiters
		} else if (is_string($delim) && !empty($delim)) {
			$this->delimiters = '#(?:'.$delim.')#msi';
		} else if (is_array($delim) && !empty($delim)) {
			$this->delimiters = '#(?:'.implode(')|(?:', $delim).')#msi';
		}
	}

	function regex($element = NULL) {
		if ($element == NULL) {
			$regexes = array();
			foreach ($this->elements as $element) {
				$regexes[] = $element->regex();
			}
			return '#' . '(?:('. implode(')|(', array_values($regexes)) . '))' . '#' .
					 ($this->mode(CrayonParser::CASE_INSENSITIVE) ? 'i' : '') .
					 ($this->mode(CrayonParser::MULTI_LINE) ? 'm' : '') .
					 ($this->mode(CrayonParser::SINGLE_LINE) ? 's' : '');
		} else if (is_string($element) && array_key_exists($element, $this->elements)) {
			return $this->elements[$element]->regex();
		}
	}

	// Retrieve by element name or set by CrayonElement
	function element($name, $element = NULL) {
		if (is_string($name)) {
			$name = trim(strtoupper($name));
			if (array_key_exists($name, $this->elements) && $element === NULL) {
				return $this->elements[$name];
			} else if (@get_class($element) == CRAYON_ELEMENT_CLASS) {
				$this->elements[$name] = $element;
			}
		}
	}

	function elements() {
		return $this->elements;
	}

	function mode($name = NULL, $value = NULL) {
		if (is_string($name) && CrayonParser::is_mode($name)) {
			$name = trim(strtoupper($name));
			if ($value == NULL && array_key_exists($name, $this->modes)) {
				return $this->modes[$name];
			} else if (is_string($value)) {
				if (CrayonUtil::str_equal_array(trim($value), array('ON', 'YES', '1'))) {
					$this->modes[$name] = TRUE;
				} else if (CrayonUtil::str_equal_array(trim($value), array('OFF', 'NO', '0'))) {
					$this->modes[$name] = FALSE;
				}
			}
		} else {
			return $this->modes;
		}
	}

	function state($state = NULL) {
		if ($state === NULL) {
			return $this->state;
		} else if (is_int($state)) {
			if ($state < 0) {
				$this->state = self::PARSED_ERRORS;
			} else if ($state > 0) {
				$this->state = self::PARSED_SUCCESS;
			} else if ($state == 0) {
				$this->state = self::UNPARSED;
			}
		}
	}

	function state_info() {
		switch ($this->state) {
			case self::PARSED_ERRORS :
				return 'Parsed With Errors';
			case self::PARSED_SUCCESS :
				return 'Successfully Parsed';
			case self::UNPARSED :
				return 'Not Parsed';
			default :
				return 'Undetermined';
		}
	}

	function is_parsed() {
		return ($this->state != self::UNPARSED);
	}

	function is_default() {
		return $this->id() == CrayonLangs::DEFAULT_LANG;
	}
}

class CrayonElement {
	// The pure regex syntax without any modifiers or delimiters
	private $name = '';
	private $css = '';
	private $regex = '';
	private $fallback = '';
	private $path = '';

	function __construct($name, $path, $regex = '') {
		$this->name($name);
		$this->path($path);
		$this->regex($regex);
	}

	function __toString() {
		return $this->regex();
	}

	function name($name = NULL) {
		if ($name == NULL) {
			return $this->name;
		} else if (is_string($name)) {
			$name = trim(strtoupper($name));
			if (CrayonLangs::is_known_element($name)) {
				// If known element, set CSS to known class
				$this->css(CrayonLangs::known_elements($name));
			}
			$this->name = $name;
		}
	}

	function regex($regex = NULL) {
		if ($regex == NULL) {
			return $this->regex;
		} else if (is_string($regex)) {
			if (($result = CrayonParser::validate_regex($regex, $this)) !== FALSE) {
				$this->regex = $result;
			} else {
				return FALSE;
			}
		}
	}

	// Expects: 'class1 class2 class3'
	function css($css = NULL) {
		if ($css == NULL) {
			return $this->css;
		} else if (is_string($css)) {
			$this->css = CrayonParser::validate_css($css);
		}
	}

	function fallback($fallback = NULL) {
		if ($fallback == NULL) {
			return $this->fallback;
		} else if (is_string($fallback) && CrayonLangs::is_known_element($fallback)) {
			$this->fallback = $fallback;
		}
	}

	function path($path = NULL) {
		if ($path == NULL) {
			return $this->path;
		} else if (is_string($path) && @file_exists($path)) {
			$this->path = $path;
		}
	}
}

?>