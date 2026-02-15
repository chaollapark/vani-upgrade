<?php
class ApiQueryRandomVideo extends ApiQueryBase {
    /** module ID ( short 2- or 3-letter code ), without the trailing 'q' */
	const MID = MW_EXT_RANDOMVIDEO_API_MID;

    const NS_MAIN = 0;

    /** For parameters and semantics, see ApiQueryBase::__construct(). */
	public function __construct( $query, $moduleName ) {
		parent::__construct( $query, $moduleName, self::MID . 'q' );
	}

    /** For parameters and semantics, see ApiQueryBase::getAllowedParams(). */
	public function getAllowedParams() {
        
		return [
			'language' => 'English',
        ];
	}

    /** For parameters and semantics, see ApiQueryBase::execute(). */
	public function execute() {
		$params = $this->extractRequestParams();

        $headers = getallheaders();
        if (!isset($headers['Apikey']) || $headers['Apikey'] != MW_EXT_VANIAPI_KEY)
        {
            echo "API key not given or invalid."; die(0);
        }

        $category = str_replace(' ', '_', "1080 {$params['language']} Pages with Videos");

        $start = wfRandom(); // Bring a random page in tandem with page_random field
        $this->addTables( [ 'categorylinks', 'page', 'revision', 'text' ] );
        $this->addFields( [ 'page_id', 'page_title', 'old_text' ] );
        $this->addWhereFld( "cl_to", $category );
        $this->addWhereFld( 'page_namespace', self::NS_MAIN );
        $this->addWhereFld( 'page_is_redirect', 0 );
        $this->addWhere( "page_title LIKE '%Prabhupada______-_%'" ); // Transcript pages only
        $this->addWhere( "page_random >= " .$start );
        $this->addOption( 'ORDER BY', [ 'page_random', 'page_id', 'rev_timestamp DESC' ] );
        $this->addOption( 'LIMIT', 1 );
        $this->addJoinConds(
            array( 'page' => array('INNER JOIN', 'cl_from = page_id'),
                   'revision' => array('INNER JOIN', 'page_id = rev_page'),
                   'text'     => array('INNER JOIN', 'rev_text_id = old_id') ) );

        $res = $this->select( __METHOD__ ); // Access page content from DB
        $result = $this->getResult();
        $row = $res->next();
        
        $title = preg_replace('/^[A-Z]+\//', "", $row->page_title);
        $index = substr($title, 11, 4);
        $title = str_replace('_', ' ', substr($title, 18));
        $result->addValue( array( 'query', 'pages', $row->page_id ), 'title', $title );
        $result->addValue( array( 'query', 'pages', $row->page_id ),
                                  'url', "https://vanipedia.org/wiki/{$row->page_title}" );
        $result->addValue( array( 'query', 'pages', $row->page_id ), 'index', $index );
        
        $this->processPage( $row->page_id, $row->old_text, $result );
	}

    // Finds video code and adds fields to output JSON and 
    protected function processPage( $page_id, $text, $result ) {
        // Extract YouTube video code
        if (!preg_match('/\{\{youtube_[a-z]+\|(.*?)\|/', $text, $matches))
        {
            return FALSE;
        }

        $code = $matches[1];

        $result->addValue( array( 'query', 'pages', $page_id ),
                                  'code', $code );

        return TRUE;
    }
}
?>