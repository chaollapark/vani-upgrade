<?php

use MediaWiki\MediaWikiServices;

const MAXQUOTES = 2500;

class SpecialQuoteStats extends SpecialPage {
	function __construct() {
		parent::__construct( 'QuoteStats' );
	}

	function execute( $par ) {
		global $wgScriptPath;

		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();
		$this->outputHeader();

		$output->addModules( 'ext.quoteStats.specialPage' );
		
		$output->setPageTitle( 'Statistics for Quotes from Vaniquote Pages' );

		# Get request data from, e.g.
		
		$wikitext = '<p>Show statistics for pages with varying quote numbers</p>';
		$output->addHTML( $wikitext );
		
		$this->displayForm();

		if (isset($this->stats))
			$this->outputStats($this->stats);
	}

	function validateNumQuotes($field)
	{
		if (is_numeric($field))
		{
			$num = intval($field);
			if ($num >= 0 && $num <= MAXQUOTES)
				return true;
		}
		return "Number must be given between 0 and ".MAXQUOTES;
	}

	function displayForm()
	{
		$formDesc = [
			'field_from' => [
				'section' => 'viewoptsection',
				'class' => 'HTMLTextField',
				'size' => 3,
				'label-message' => 'form-fromnum',
				'required' => TRUE,
				'default' => '1',
				'validation-callback' => [ $this, 'validateNumQuotes' ]
			],
			'field_to' => [
				'section' => 'viewoptsection',
				'class' => 'HTMLTextField',
				'size' => 3,
				'label-message' => 'form-tonum',
				'required' => TRUE,
				'default' => '100',
				'validation-callback' => [ $this, 'validateNumQuotes' ]
			],
		];
		$htmlForm = new HTMLForm( $formDesc, $this->getContext() );
		$htmlForm
			->setSubmitText( 'Show statistics' )
			->setSubmitCallback( [ $this, 'showStats' ] )
			->show();
	}

	public function showStats( $formData )
	{
		$this->to = intval($formData[ 'field_from' ]);
		$this->from = intval($formData[ 'field_to' ]);

		$stats = array();
		for ($i = 0; $i <= $this->from; $i++)
			array_push($stats, 0);
			
		$lb = MediaWikiServices::getInstance()->getDBLoadBalancer();
		$dbr = $lb->getConnectionRef( DB_REPLICA );
		$res = $dbr->select(
			array( 'page', 'revision' ),
		    array( 'text_id' => 'MAX(rev_text_id)' ),
			array( 'page_namespace' => NS_MAIN ),
			__METHOD__,
			array( 'GROUP BY' => 'page_id' ),
			array(
				'revision' => array( 'INNER JOIN', array( 'page_id=rev_page' ) ),
			)
		);

		foreach( $res as $row ) {
			$text_res = $dbr->select(
				array( 'text' ),
				array( 'old_text' ),
				array( 'old_id' => intval($row->text_id) )
			);
			foreach( $text_res as $text_row ) {
				if ( preg_match( '/\{\{total\|([0-9]+)\}\}/', $text_row->old_text, $matches ) ) {
					$total = $matches[1];
					if ( $total >= $this->to && $total <= $this->from )
						$stats[$total]++;
				}
			}
		}

		$this->stats = $stats;

		return false;
		
	}

	function outputStats($stats)
	{
		$output = $this->getOutput();

		$section_totals = array(0, 0);

		$output->addHTML("<br/>");
		$output->addHTML("<table class='stats' border='1' cellpadding='2' width='80%'>");
		$output->addHTML("<tr><th># of quotes</th><th># of pages</th><th>total # quotes</th></tr>");
		for ($i = $this->to; $i <= $this->from; $i++)
		{
			$nPages = number_format($stats[$i]);
			$nQuotes = number_format($totalQuotes = $stats[$i] * $i);
			$output->addHTML("<tr><td>$i</td><td>$nPages</td><td>$nQuotes</td></tr>");
			$section_totals[0] += $stats[$i];
			$section_totals[1] += $totalQuotes;
		}
		$section_totals[0] = number_format($section_totals[0]);
		$section_totals[1] = number_format($section_totals[1]);
		$output->addHTML("<tr><td><i>Section Totals:</i></td><td><b>{$section_totals[0]}</b></td><td><b>{$section_totals[1]}</b></td></tr>");
		$output->addHTML("</table>");
	}

	function getGroupName() {
        return 'wiki';
    }
}

$wgSpecialPages['QuoteStats'] = 'SpecialQuoteStats';
?>