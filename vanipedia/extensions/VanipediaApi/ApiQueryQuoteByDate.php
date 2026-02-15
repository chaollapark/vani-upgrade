<?php
class ApiQueryQuoteByDate extends ApiQueryBase {
    /** module ID ( short 2- or 3-letter code ), without the trailing 'q' */
	const MID = MW_EXT_QUOTEBYDATE_API_MID;

    const MONTHNAMES = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

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
            'day' => [
				ApiBase::PARAM_TYPE => 'string',
            ],
            'month' => [
				ApiBase::PARAM_TYPE => 'string',
            ],
            'year' => [
				ApiBase::PARAM_TYPE => 'string',
            ],
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

        // Either day and month or year and month can be given
        $byday = $bymonth = false;
        if (isset($params['day']) && isset($params['month'])) { // Access A day in the life of Srila Prabhupada
            $byday = true;
            $day = substr( 100 + $params['day'], 1 );
            $month = self::MONTHNAMES[ intval( $params['month'] - 1 ) ];
            $title = "A_Day_in_the_Life_of_Srila_Prabhupada_-_{$month}_$day";
        } else if (isset($params['year']) && isset($params['month'])) { // Access A month in the life of Srila Prabhupada
            $bymonth = true;
            $year = intval( $params['year'] );
            $month = self::MONTHNAMES[ intval( $params['month'] - 1 ) ];
            $title = "A_Month_in_the_Life_of_Srila_Prabhupada_-_{$month}_$year";
        } else
            { echo "either qbdqday and qbdqmonth are to be given, or qbdqmonth and qbdqyear."; die(0); }
        
        $this->addTables( [ 'page', 'revision', 'text' ] );
        $this->addFields( [ 'page_id', 'page_title', 'old_text' ] );
        $this->addWhere( "page_title = '$title'" );
        $this->addOption( "ORDER BY",  "rev_timestamp DESC" );
        $this->addOption( "LIMIT", "1" );
        $this->addJoinConds(
            array( 'revision' => array('INNER JOIN', 'page_id = rev_page'),
                   'text'     => array('INNER JOIN', 'rev_text_id = old_id') ) );

        $res = $this->select( __METHOD__ ); // Access page content from DB
        $result = $this->getResult();
        $row = $res->next();
        $result->addValue( array( 'query', 'pages', $row->page_id ),
            'title', $title );
            
        if ($byday) $this->processDayPage( $row->page_id, $row->old_text, $result, $params, $day, $month );
        if ($bymonth) $this->processMonthPage( $row->page_id, $row->old_text, $result, $params, $year, $month );
	}

    // Choose a quote at random from a list connected to the same source, in the wikitext
    protected function processQuoteSource( $page_id, $text, $result, $params, $output)
    {
        $quote = isset( $output['quote'] );

        // Choose a source at random within the chosen year
        if (!preg_match_all('/\[\[Vanisource:(.*?)\|(.*?)\]\]\'\'\'\n(?:\{\{.*?\}\}\n)+/s', $text, $matches, PREG_OFFSET_CAPTURE))
            return FALSE; // Matched chunk includes everything under that source

        $srcIndex = rand(0, count( $matches [0] )-1);
        $srcStart = $matches[ 0 ][ $srcIndex ][ 1 ];
        $srcLen   = strlen($matches[ 0 ][ $srcIndex ][ 0 ]);
        $srcText  = substr($text, $srcStart, $srcLen); // The text of the entire source chosen
        $linkDest   = $matches[ 1 ][ $srcIndex ][ 0 ]; // Linked source page name
        $linkLabel  = $matches[ 2 ][ $srcIndex ][ 0 ]; // Source link label

        if ($quote)
        {
            if (!preg_match_all('/\{\{(?:VaniQuotebox\|.*?\|(.*?)\}\}|Audiobox_NDrops\|.*?\|.*?\|"?(.*?)"?\|)/', $text, $matches, PREG_PATTERN_ORDER))
                return FALSE; // Match all quotes either in VaniQuotebox or Audiobox_NDrops structure

            $quoteIndex = rand(0, count( $matches [0] )-1); // Choose one at random
            if ($matches[1][$quoteIndex])
                $quoteText = $matches[1][$quoteIndex];
            else if ($matches[2][$quoteIndex])
                $quoteText = $matches[2][$quoteIndex];

            if ($quoteText)
                $result->addValue( array( 'query', 'pages', $page_id ),
                                          'quote', trim( $quoteText ) );
        }

        $this->outputSourceInfo( $page_id, $linkDest, $linkLabel, $result, $output );

        return $text;
    }

    // Output a link to the source of the quote
    private function outputSourceInfo( $page_id, $linkDest, $linkLabel, $result, $output )
    {
        $linktext = isset( $output['linktext'] );
        $linkurl  = isset( $output['linkurl'] );

        if ($linktext)
            $result->addValue( array( 'query', 'pages', $page_id ),
                               'linktext', trim( $linkLabel ) );
        if ($linkurl)
            $result->addValue( array( 'query', 'pages', $page_id ),
                               'linkurl', 'https://vanisource.org/wiki/' . // Build URL and add highlight terms
                               urlencode(str_replace(' ', '_', $linkDest)));
    }

    // Return the date in the output
    private function outputDate( $page_id, $result, $year, $month, $day )
    {
        $result->addValue( array( 'query', 'pages', $page_id ),
                           'year', $year );
        $result->addValue( array( 'query', 'pages', $page_id ),
                           'month', $month );
        $result->addValue( array( 'query', 'pages', $page_id ),
                           'day', $day );
    }

    // Adds fields to output JSON when a day is given
    protected function processDayPage( $page_id, $text, $result, $params, $day, $month ) {
        $output = array_flip( $params['output'] ); // Contains types of data to return

        // Choose a year at random
        if (!preg_match_all('/==== ?\[\[.*?\|([0-9]{4}).*?====\n(?:\:\'\'\'\[\[.*?\]\]\'\'\'\n|\{\{.*?\}\}\n)+/s',
            $text, $matches, PREG_OFFSET_CAPTURE))
        {
            return FALSE; // Matched chunk includes everything under that year
        }

        do
        {
            $yearIndex = rand(0, count( $matches [0] )-1); // Choose a year at random
            $yearStart = $matches[ 0 ][ $yearIndex ][ 1 ];
            $yearLen   = strlen($matches[ 0 ][ $yearIndex ][ 0 ]);
            $yearText  = substr($text, $yearStart, $yearLen); // The wikitext that covers the entire year
            $year      = $matches[ 1 ][ $yearIndex ][ 0 ];    // Year number extracted
        }
        while (! $this->processQuoteSource( $page_id, $yearText, $result, $params, $output ) );

        $this->outputDate( $page_id, $result, $year, $month, $day );

        return TRUE;
    }

    // Adds fields to output JSON when a month is given
    protected function processMonthPage( $page_id, $text, $result, $params, $year, $month ) {
        $output   = array_flip( $params['output'] ); // Contains types of data to return
        $quote    = isset( $output['quote'] );

        // Choose a day at random
        if (!preg_match_all('/==== ?\[\[.*?\|[0-9]{4} - [A-Za-z]+ ([0-9]+)\]\] ====\n+(?:\:\'\'\'\[\[.*?\]\]\'\'\'\n|\{\{.*?\}\}\n)+/s',
            $text, $matches, PREG_OFFSET_CAPTURE))
        {
            return FALSE; // Matched chunk includes everything under that day
        }

        do
        {
            $dayIndex = rand(0, count( $matches [0] )-1);
            $dayStart = $matches[ 0 ][ $dayIndex ][ 1 ];
            $dayLen   = strlen($matches[ 0 ][ $dayIndex ][ 0 ]);
            $dayText  = substr($text, $dayStart, $dayLen); // wikitext of the entire day
            $day      = $matches[ 1 ][ $dayIndex ][ 0 ];   // day number in date
        }
        while (! $this->processQuoteSource( $page_id, $dayText, $result, $params, $output ) );

        $this->outputDate( $page_id, $result, $year, $month, $day );
    }




    
}
?>