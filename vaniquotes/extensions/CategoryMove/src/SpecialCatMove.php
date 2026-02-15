<?php
class SpecialCatMove extends SpecialPage {
	function __construct() {
		parent::__construct( 'CategoryMove', 'categorymove' );
	}

	function execute( $par ) {
		global $wgScriptPath;

		if ( !$this->getUser()->isAllowed( 'categorymove' ) )
			throw new PermissionsError( 'categorymove' );
		
		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();
		$this->outputHeader();

		// For R & D
		//$output->addScriptFile( "$wgScriptPath/extensions/CategoryMove/src/CategoryMove.js?v=1.82" );
		//$output->addModuleStyles( 'ext.categoryMove.specialPage' );
		$output->addModules( 'ext.categoryMove.specialPage' ); // For production
		
		$output->setPageTitle( 'Category move' );

		# Get request data from, e.g.
		$this->move_pages = $request->getText( 'list' ) === "yes";
		$this->total_items = $request->getText( 'total_items' );
		$this->subcat_count = $request->getText( 'subcat_count' );
		$this->page_count = $request->getText( 'page_count' );

		if ( $this->move_pages ) {
			if ( intval($this->total_items) > 0 ) {
				// Source and destination were validated, move was ordered
				$this->catSrc  = $this->filterCategoryField($request->getText( 'wpfield_src' ));			
				$this->catDest = $this->filterCategoryField($request->getText( 'wpfield_dest' ));
				$this->keepSource = $request->getText( 'wpkeep_source' );
				$this->movePages($request, $output);
			}
			else
				$output->addHTML( "An empty category was chosen. <a href=''>Back</a>");
		}
		else {
			$wikitext = '<p>Move pages from the source category to destination</p>';
			$output->addHTML( $wikitext );
			
			$this->displayForm();
			if ( isset( $this->catSrc ) ) {
				if ( $this->catSrc == $this->catDest )
					$output->addHTML("<p>Source and destination categories are identical</p>");
				else
					$this->showPageList($output);
			}
		}
	}

	function filterCategoryField($cat_name)
	{
		return str_replace("_", " ", $cat_name);
	}

	function validateCategoryField($cat_name)
	{
		if ($cat_name == "")
			return "Category name not given";
		$dbw = wfGetDB( DB_REPLICA );
		$res = $dbw->select(
			array( 'page' ),
		    array( 'page_namespace' ),
		    array( 'page_title' => str_replace(' ', '_', $cat_name) )
		);
		foreach ($res as $row)
			if ($row->page_namespace == 14)
				return true;
		return "Category not found";
	}

	function displayForm()
	{
		$formDesc = [
			'field_src' => [
				'id' => 'txtSrc',
				'section' => 'catnamessection',
				'class' => 'HTMLTextField',
				'label-message' => 'form-sourcecat',
				'required' => TRUE,
				'filter-callback' => [ $this, 'filterCategoryField' ],
				'validation-callback' => [ $this, 'validateCategoryField' ]
			],
			'field_dest' => [
				'id' => 'txtDest',
				'section' => 'catnamessection',
				'class' => 'HTMLTextField',
				'label-message' => 'form-destcat',
				'filter-callback' => [ $this, 'filterCategoryField' ],
				'validation-callback' => [ $this, 'validateCategoryField' ]
			],
			'keep_source' => [
				'class' => 'HTMLCheckField',
				'label-message' => 'form-keepsource',
				'default' => false,
			]
		];
		$htmlForm = new HTMLForm( $formDesc, $this->getContext() );
		$htmlForm
			->setSubmitText( 'Show page list' )
			->setSubmitCallback( [ $this, 'getFormData' ] )
			->show();
	}

	function makeLink($title, $namespace)
	{
		$page_title = str_replace('_', ' ', $title);
		if ( $namespace == NS_CATEGORY ) {
			$page_title = "Category:$page_title";
			$title = "Category:$title";
		}
		$title = explode('/', $title);
		$title[count($title)-1] = rawurlencode($title[count($title)-1]);
		$title = implode('/', $title);
		$url = "/wiki/$title";
		return "<a href='$url' target='_blank'>$page_title</a>";
	}

	function showPageList ($output) {
		global $wgScriptPath;
		$output->addHTML(
			"<img id='imgWait' src='$wgScriptPath/extensions/CategoryMove/src/wait.gif' width='16' height='16'/>");
		
		$dbr = wfGetDB( DB_REPLICA );
		$res = $dbr->select(
			array( 'categorylinks', 'page' ),
		    array( 'cl_from', 'page_id', 'page_title', 'page_namespace' ),
		    array( 'cl_to' => str_replace(' ', '_', $this->catSrc) ),
			__METHOD__,
			array( 'ORDER BY' => 'page_namespace DESC, page_title ASC' ),
			array( 'page' => array ( 'INNER JOIN', array( 'cl_from=page_id' ) ) )
		);
		$output->addHTML("<h3>Source Category: {$this->catSrc}</h3>");
		$output->addHTML('<form method="POST" name="frmPageList">');
		$output->addHTML('<input type="hidden" name="list" value="yes"/>');
		$output->addHTML('<input type="hidden" name="wpfield_src" value="'.$this->catSrc.'"/>');
		$output->addHTML('<input type="hidden" name="wpfield_dest" value="'.$this->catDest.'"/>');
		$output->addHTML('<input type="hidden" name="wpkeep_source" value="'.$this->keepSource.'"/>');
		$output->addHTML("A total of {$dbr->numRows($res)} pages and/or categories found<br/>");
		$but_html = array('<input type="submit" value="Move selected pages"/>&nbsp;&nbsp;<input type="button" name="inverse" value="Inverse check"/>',
			'<input type="checkbox" checked="checked" name="togAll" /> <a href="javascript:void(0)" class="aTogAll">Check/uncheck all</a>');
		$output->addHTML(implode('<br/>', $but_html)."<ol>");
		$i = 0; $page_count = 0; $subcat_count = 0;
		foreach ($res as $row) {
			$link = $this->makeLink($row->page_title, $row->page_namespace);
			$output->addHTML("<li><input type='checkbox' name='page_$i'".
				" value='{$row->page_id}' ns='{$row->page_namespace}' checked='checked'/> $link</li>");
			$i++;
			if ($row->page_namespace == NS_MAIN) $page_count++;
			if ($row->page_namespace == NS_CATEGORY) $subcat_count++;
		}
		$output->addHTML("<input type='hidden' name='total_items' value='$i'/>");
		$output->addHTML("<input type='hidden' name='page_count' value='$page_count'/>");
		$output->addHTML("<input type='hidden' name='subcat_count' value='$subcat_count'/>");
		$output->addHTML('<script type="text/javascript">document.getElementById("imgWait").remove()</script>');
		$output->addHTML("</ol>".implode('<br/>', array_reverse($but_html))."</form>");
	}

	public function getFormData( $formData ) {
		$this->catSrc = $formData[ 'field_src' ];
		$this->catDest = $formData[ 'field_dest' ];
		$this->keepSource = $formData[ 'keep_source' ];
		
		return false;
		
		//return 'Category not found';
	}

	function produceJobObject($page_title, $namespace, $src_cat, $dest_cat, $keep_source)
	{
		$move_params = array(
			"user" => $this->getUser(),
			"src_cat" => $src_cat,
			"dest_cat" => $dest_cat,
			"keep_source" => $keep_source,
		);
		$title = Title::newFromText(
            $page_title,
            $namespace
        );
		return new CategoryMoveJob( $title, $move_params );
	}
	
	function movePages($request, $output)
	{
		$dbw = wfGetDB( DB_MASTER );
		$output->addHTML("<p>A total of {$this->subcat_count} subcategories".
			" and {$this->page_count} pages were moved</p>");
		$output->addHTML("<a href=''>Back</a><ol>");
		$jobs = array();
		for ($i = 0; $i < $this->total_items; $i++) {
			$page_id = $request->getText("page_$i");
			
			$res = $dbw->select(
				array( 'page' ),
				array( 'page_title', 'page_namespace' ),
				array( 'page_id' => $page_id ),
				__METHOD__,
				array( 'ORDER BY' => 'page_namespace DESC, page_title ASC' )
			);			
			
			foreach ($res as $row) {
				$jobs[] = $this->produceJobObject(
					$row->page_title,
					$row->page_namespace,
					$this->catSrc,
					$this->catDest,
					$this->keepSource);
				
				$link = $this->makeLink($row->page_title, $row->page_namespace);
				$output->addHTML("<li>$link</li>");
			}
		}
		$runner = new JobRunner();
		JobQueueGroup::singleton()->push( $jobs );
		$runner->run( array( "type" => "categoryMove" ) );
		$output->addHTML("</ol>");
		$output->addHTML("<a href=''>Back</a>");
	}

	function getGroupName() {
        return 'pagetools';
    }
}

$wgSpecialPages['CategoryMove'] = 'SpecialCatMove';
?>