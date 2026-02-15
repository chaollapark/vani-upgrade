<?php
const NS_MAIN = 0;

class ApiQueryRandomQuote extends ApiQueryBase {
    /** module ID ( short 2- or 3-letter code ), without the trailing 'q' */
	const MID = MW_EXT_RANDOMQUOTE_API_MID;

    /** For parameters and semantics, see ApiQueryBase::__construct(). */
	public function __construct( $query, $moduleName ) {
		parent::__construct( $query, $moduleName, self::MID . 'q' );
	}

    /** For parameters and semantics, see ApiQueryBase::getAllowedParams(). */
	public function getAllowedParams() {
        
		return [
			'output' => [
				ApiBase::PARAM_DFLT => 'quote|linktext|linkurl',
				ApiBase::PARAM_TYPE => [ 'quote', 'linktext', 'linkurl' ],
				ApiBase::PARAM_ISMULTI => true,
				ApiBase::PARAM_HELP_MSG_PER_VALUE => [],
            ],
        ];
	}

    private function getRandomPageRow()
    {
        $start = wfRandom(); // Bring a random page in tandem with page_random field
        $this->addTables( [ 'page' ] );
        $this->addFields( [ 'page_id', 'page_title' ] );
        $this->addWhereFld( 'page_namespace', NS_MAIN );
        $this->addWhereFld( 'page_is_redirect', 0 );
        $this->addOption( 'LIMIT', 1 );
        $this->addWhere( "page_random >= " . $start );
        $this->addOption( 'ORDER BY', [ 'page_random', 'page_id' ] );

        $res = $this->select( __METHOD__ );
        $row = $res->next();
        $this->resetQueryParams();
        return $row;
    }

    /** For parameters and semantics, see ApiQueryBase::execute(). */
	public function execute() {
		$params = $this->extractRequestParams();

        $headers = getallheaders();
        if (!isset($headers['Apikey']) || $headers['Apikey'] != MW_EXT_VANIAPI_KEY)
        {
            echo "API key not given or invalid."; die(0);
        }
        
        $c = 0; // Try to extract a quote, one random page after another until successful
        do
        {
            if ($c > 0) {
                $result->removeValue( array( 'query', 'pages' ), NULL );
                $this->resetQueryParams();
            }

            $row = $this->getRandomPageRow();
            $this->addTables([ 'revision', 'text' ]);
            $this->addFields([ 'old_text' ]);
            $this->addWhereFld( 'rev_page', $row->page_id );
            $this->addOption( 'LIMIT', 1 );
            $this->addOption( 'ORDER BY', 'rev_timestamp DESC' );
            $this->addJoinConds(
                array( 'text' => array('INNER JOIN', 'rev_text_id = old_id') ) );

            $res = $this->select( __METHOD__ );
            $result = $this->getResult();

            $row2 = $res->next();
            
            $result->addValue( array( 'query', 'pages', $row->page_id ),
                'title', $row->page_title );
        }
        while ( $c++ < 100 && ! $this->processPage( $row->page_id, $row2->old_text, $result, $params ) );
	}

    // Adds fields to output JSON if successful in finding info. Otherwise, return false
    protected function processPage( $page_id, $text, $result, $params ) {
        $output   = array_flip( $params['output'] ); // Contains types of data to return
        $quote    = isset( $output['quote'] );
        $linktext = isset( $output['linktext'] );
        $linkurl  = isset( $output['linkurl'] );

        if (!preg_match_all('/<div .*?class="quote".*?>/', $text, $matches, PREG_OFFSET_CAPTURE)) // Choose only one quote at random
            return FALSE;

        $offset = $matches[ 0 ][ rand(0, count( $matches [0] )-1) ][ 1 ]; // Begin regex search from chosen quote

        if ($quote)
        {
            if (preg_match('/<div class="(?:quote_)?heading">(.*?)<\/div>/s', $text, $matches, 0, $offset))
                $result->addValue( array( 'query', 'pages', $page_id ),
                                   'quote', trim( $matches[1] ) );
            else return FALSE;
        }

        if ($linktext || $linkurl)
        {
            if (preg_match('/<(?:div|span) class="(?:quote_)?link">\n?(.*?)\n?<\/(?:div|span)>/', $text, $matches, 0, $offset))
                if (preg_match('/\[\[Vanisource:(.*?)\|(.*?)\]\]/', $matches[0], $matches))
                {
                    if ($linktext)
                        $result->addValue( array( 'query', 'pages', $page_id ),
                                           'linktext', trim( $matches[2] ) );
                    if ($linkurl)
                        $result->addValue( array( 'query', 'pages', $page_id ),
                                           'linkurl', 'https://vanisource.org/wiki/' . // Build URL and add highlight terms
                                           urlencode(str_replace(' ', '_', $matches[1])) .
                                           '?hl=' . $this->findTerms($text, $offset) );
                    return TRUE;
                }
            return FALSE;
        }
        return TRUE;
    }

    // Find highlight terms relevant to a specific quote on a Vaniquotes page. Uses functions from MarkTerms extension
    private function findTerms( $text, $offset )
    {
        if (preg_match('/\{\{terms\|(.*?)\}\}/', $text, $matches)) // Extract terms from metadata
        {
            $terms = explode('|', $matches[1]);
            array_walk($terms, function (&$v, $i) { $v = substr($v, 1, -1); }); // Remove enclosing double-quotes
            $terms = implode('|', $terms);
            
            // Save the boundaries, in which relevant terms are to be found
            if (preg_match("/<div .*?class=\"[A-Za-z ]*?(?:quote_)?(?:text|translation)\".*?>.*?<\/div>/s", 
                $text, $matches, 0, $offset))
            {
                $offStart = $offset;
                $offEnd = $offStart + strlen($matches[0]);
            }

            // Find all terms on page
            $hl = array();
            $re = makeTermsRegex($terms);
            mb_reg_match_all($re, $text, $matches, 1, 'i');
            foreach ($matches as $match)
            {
                // Filter those terms found within the chosen quote's boundaries
                $start = $match[0];
                if ($start >= $offStart && $start <= $offEnd) {
                    $term = strtolower($match[1]);
                    if ($term && !in_array($term, $hl) /* no duplicates, case-insensitive comparison */)
                        $hl[] = $term;
                }
            }

            // Prepare query string parameter with relevant terms, separated by pipe(s) (|)
            return implode('|', $hl);
        }

        return "";
    }
}
?>