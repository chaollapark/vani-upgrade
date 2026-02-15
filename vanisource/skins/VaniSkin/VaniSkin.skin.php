<?php

/**
 * Skin file for VaniSkin
 *
 * @file
 * @ingroup Skins
 */

use MediaWiki\MediaWikiServices;

const menuMaxLevels = 6;

class vaniskinTemplate extends BaseTemplate {
	public function outputMultilevelMenu() {
		// Get MediaWiki cache
		$cache = MediaWikiServices::getInstance()->getMainWANObjectCache();

		// Cache key (namespaced & safe)
		$cacheKey = $cache->makeKey( 'vaniskin', 'menu' );

		// Try to fetch from cache
		$html = $cache->getWithSetCallback(
			$cacheKey,
			3600,
			function () {
				$context = stream_context_create( [
					'http' => [
						'timeout' => 3,
					],
				] );
				
				$text = file_get_contents(
					'/var/www/html/w/menu.dat',
					false,
					$context
				);


				if ( $text === false ) {
					return '';
				}

				$lines = explode( "\n", $text );

				if ( empty( $lines ) ) {
					return '';
				}

				$i = 0;

				return $this->buildMenuHtml(
					$this->buildMenuTree( $lines, $i, 0 )
				);
			}
		);
		
		echo $html;
	}

	private function buildMenuTree($lines, &$i, $level)
	{
		$entries = [];
		for (;$i < sizeof($lines); $i++) {
			$line = $lines[$i];
			$line = substr($line,$level);

			if (strpos($line, '**') === 0) {// entry in a deeper level:	
				$submenu = $this->buildMenuTree($lines, $i, $level+1);
				if ($level >= menuMaxLevels)
					echo "<text style='color: #d33'>Warning: Up to ".menuMaxLevels." levels are allowed</text>";
				else
				{
					if ($i > 0)
						$entries[sizeof($entries) - 1]['submenu'] = $submenu;
					$i--;
				}
			}
			else if (strpos($line, '*') === 0) { // entry in this level:
				if (strpos($line, '|') !== FALSE)
				{
					$line = array_map('trim', explode( '|' , trim($line, '* ') ) );
					$link = wfMessage( $line[0] )->inContentLanguage()->text();
					if ($link == '-')
						continue;
				
					$text = wfMessage($line[1], 'parsemag')->text();
					if (wfMessage($line[1])->inContentLanguage()->isBlank())
						$text = $line[1];
					if (wfMessage($line[0])->inContentLanguage()->isBlank())
						$link = $line[0];

					if ($text === "") {
						$text = $line[0];
						$href = "#";
					} else if ( preg_match( '/^(?:' . wfUrlProtocols() . ')/', $link ) ) {
						$href = $link;
					} else {
						$title = Title::newFromText( $link );
						if ( $title ) {
							$title = $title->fixSpecialName();
							$href = $title->getLocalURL();
						} else {
							$href = 'INVALID-TITLE';
						}
					}
					$entry = array('href' => $href, 'text' => $text);
					//if ($href != "#") $entry->target = "_blank";
					if ($href != "#") $entry['target'] = "_blank";
					if (isset($line[2])) $entry['cols'] = intval($line[2]);
				}
				else
					$entry = array('href' => "#", 'text' => trim( substr($line, 2) ));
				array_push($entries, $entry);
			}
			else if (strlen($line) > 0) break;
		}
		return $entries;
	}

	public function buildMenuHtml($tree) {
		$html = "";

		foreach ($tree as $node) {
			$href = $node['href'];
			$text = $node['text'];
			//$href = htmlspecialchars($href);
			//$text = htmlspecialchars($text);

			$dropdown = isset($node['submenu']);
			$li_attr = '';
			if ($dropdown)
				$li_attr = ' class="has-dropdown active"';

			$target = "";
			if (isset($node['target']))
				$target = " target=\"{$node['target']}\"";
			
			$html .= "<li$li_attr>";
			$html .= "<a href=\"$href\"$target>$text</a>";
			if ($dropdown) {
				$class = 'dropdown';
				$style = "";
				if (isset($node['cols']) && $node['cols'] >= 2)
				{
					$canSplit = TRUE;
					foreach ($node['submenu'] as $subitem)
						if (isset($subitem['submenu'])) $canSplit = FALSE;
					if ($canSplit) {
						$height = ceil(sizeof($node['submenu']) / $node['cols']) * 45;
						$style = " style=\"height: {$height}px !important\"";
						$class .= ' cols';
					}
				}
				$html .= "<ul class=\"$class\"$style>";
				$html .= $this->buildMenuHtml($node['submenu']);
				$html .= "</ul>";
			}
			$html .= "</li>";
		}

		return $html;
	}

	public function execute() {
		global $wgForegroundFeatures;
		$wgForegroundFeaturesDefaults = [
			'showActionsForAnon' => true,
			'NavWrapperType' => 'divonly',
			'showHelpUnderTools' => true,
			'showRecentChangesUnderTools' => true,
			'enableTabs' => false,
			'wikiName' => &$GLOBALS['wgSitename'],
			'navbarIcon' => false,
			'IeEdgeCode' => 1,
			'showFooterIcons' => false,
			'addThisPUBID' => '',
			'useAddThisShare' => '',
			'useAddThisFollow' => ''
		];
		foreach ( $wgForegroundFeaturesDefaults as $fgOption => $fgOptionValue ) {
			if ( !isset( $wgForegroundFeatures[$fgOption] ) ) {
				$wgForegroundFeatures[$fgOption] = $fgOptionValue;
			}
		}
		$this->getSkin()->getOutput()->addHeadItem( 'ie-meta', '<meta http-equiv="X-UA-Compatible" content="IE=edge" />' );
		switch ( $wgForegroundFeatures['enableTabs'] ) {
			case true:
				ob_start();
				$this->html( 'bodytext' );
				$out = ob_get_contents();
				ob_end_clean();
				$markers = [ "&lt;a", "&lt;/a", "&gt;" ];
				$tags = [ "<a", "</a", ">" ];
				$body = str_replace( $markers, $tags, $out );
				break;
			default:
				$body = '';
				break;
		}
		switch ( $wgForegroundFeatures['NavWrapperType'] ) {
			case '0':
				break;
			case 'divonly':
				echo "<div id='navwrapper'>";
				break;
			default:
				echo "<div id='navwrapper' class='" . $wgForegroundFeatures['NavWrapperType'] . "'>";
				break;
		}
		// Set default variables for footer and switch them if 'showFooterIcons' => true
		$footerLeftClass = 'small-12 large-centered columns text-center';
		$footerRightClass = 'large-12 small-12 columns';

		$footerIconBlocks = $this->get( 'footericons' );
		$poweredbyMakeType = 'withoutImage';
		if ( $wgForegroundFeatures['showFooterIcons'] ) {
			$footerLeftClass = 'large-8 small-12 columns';
			$footerRightClass = 'large-4 small-12 columns';
			$poweredbyMakeType = 'withImage';
			// Unset footer icons without images.
			foreach ( $footerIconBlocks as &$footerIconsBlock ) {
				foreach ( $footerIconsBlock as $footerIconKey => $footerIcon ) {
					if ( !isset( $footerIcon['src'] ) ) {
						unset( $footerIconsBlock[$footerIconKey] );
					}
				}
			}
		} else {
			unset( $footerIconBlocks['copyright'] );
		}
?>
<!-- START VANISKINTEMPLATE -->
		<nav class="top-bar" data-topbar role="navigation" data-options="back_text: <?php echo wfMessage( 'vaniskin-menunavback' )->text(); ?>">
			<ul class="title-area">
				<li class="name">
					<div class="title-name">
					<a href="<?php echo $this->data['nav_urls']['mainpage']['href']; ?>">
					<?php if ( $wgForegroundFeatures['navbarIcon'] != '0' ) { ?>
						<img alt="<?php echo $this->text( 'sitename' ); ?>" class="top-bar-logo" src="<?php echo $this->text( 'logopath' ) ?>">
					<?php } ?>
					<div class="title-name" style="display: inline-block;"><?php echo $wgForegroundFeatures['wikiName']; ?></div>
					</a>
					</div>
				</li>
				<li class="toggle-topbar menu-icon">
					<a href="#"><span><?php echo wfMessage( 'vaniskin-menutitle' )->text(); ?></span></a>
				</li>
			</ul>

		<section class="top-bar-section">

			<ul id="top-bar-left" class="left">
				<li class="divider show-for-small"></li>
				<?php $this->outputMultilevelMenu(); ?>
			</ul>

			<ul id="top-bar-right" class="right">
				<?php if ($this->getSkin()->getUser()->getId() > 0) { ?>
				<li class="has-dropdown active"><a href="#"><i class="fa fa-cogs"></i></a>
					<ul id="toolbox-dropdown" class="dropdown">
						<?php foreach ( $this->data['sidebar']['TOOLBOX'] as $key => $item ) { echo $this->makeListItem( $key, $item );
						} ?>
						<?php if ( $wgForegroundFeatures['showRecentChangesUnderTools'] ): ?><li id="n-recentchanges"><?php echo Linker::specialLink( 'Recentchanges' ) ?></li><?php
						endif; ?>
						<?php if ( $wgForegroundFeatures['showHelpUnderTools'] ): ?><li id="n-help" <?php echo Linker::tooltip( 'help' ) ?>><a href="<?php echo Skin::makeInternalOrExternalUrl( wfMessage( 'helppage' )->inContentLanguage()->text() )?>"><?php echo wfMessage( 'help' )->text() ?></a></li><?php
						endif; ?>
					</ul>
				</li>
				<?php } ?>

				<li id="personal-tools-dropdown" class="has-dropdown active"><a href="#"><i class="fa fa-user"></i></a>
					<ul class="dropdown">
						<?php foreach ( $this->getPersonalTools() as $key => $item ) { echo $this->makeListItem( $key, $item );
						} ?>
					</ul>
				</li>

				<li class="divider show-for-small"></li>
				<li class="has-form">
					<form id="vanisearch-form" action="dummy" method="GET">
    				  <div class="row collapse">
					    <div class="small-12 columns">
					      <input type="text" placeholder="Search Vanipedia" title="Search Vanipedia [Alt+Shift+f]" accesskey="f" id="ori_search" autocomplete="off">
					      <input class="vs-button" type="submit" value="Search" style="cursor: pointer; margin-left: 5px;" onclick="return open_modal()"/>
                          <!--<button type="submit" class="button search" onclick="return open_modal()">Search</button>-->
					    </div>
					  </div>
					</form>
				</li>		
			</ul>

	  <!-- BEGIN modal search popup window -->
          <div id="mspu_div_wrapper">
            <div id="mspu_div_window">
              <h2 id="mspu_h2_title">Vanipedia Search</h2>
              <span id="mspu_spn_close">×</span>
              <form action="https://vanipedia.org/wiki/Special:VaniSearch" method="GET">
                <div id="mspu_div_input">
                  <input type="text" name="s" maxlength="108" id="mspu_txt_input" value="">
                </div>
                <div id="mspu_div_rgroup">
                  <div>
                    <input type="radio" id="rb_catg" name="tab" value="catg" onchange="sync_but_search()" checked>
                    <label for="rb_catg">Category Names</label>
                  </div>
                  <div>
                    <input type="radio" id="rb_page" name="tab" value="page" onchange="sync_but_search()">
                    <label for="rb_page">Page Titles</label>
                  </div>
                  <div>
                    <input type="radio" id="rb_text" name="tab" value="text" onchange="sync_but_search()">
                    <label for="rb_text">Text</label>
                  </div>
                  <div>
                    <input type="radio" id="rb_syno_t" name="tab" value="syno_t" onchange="sync_but_search()">
                    <label for="rb_syno_t">Synonyms - English</label>
                  </div>
                  <div>
                    <input type="radio" id="rb_syno_o" name="tab" value="syno_o" onchange="sync_but_search()">
                    <label for="rb_syno_o">Synonyms - Sanskrit</label>
                  </div>
                  <div>
                    <input type="radio" id="rb_line" name="tab" value="line" onchange="sync_but_search()">
                    <label for="rb_line">Verse Lines</label>
                  </div>
                </div>
                <div id="mspu_div_submit">
                  <input type="submit" id="mspu_but_submit" value="Search" onclick="modal.style.display = 'none'">
                </div>
              </form>
            </div>
          </div>
          <script type="text/javascript" src="/w/extensions/VaniSearch/js/search_popup.js?version=6"></script>
          <!-- END modal search popup window -->

		</section>
		</nav>

		<?php if ( $wgForegroundFeatures['NavWrapperType'] != '0' ) { echo "</div>";
		} ?>

		<div id="page-content">
		<div class="row">
				<div class="large-12 columns">
					<!-- Output page indicators -->
					<?php echo $this->getIndicators(); ?>
					<!-- If user is logged in output echo location -->
					<?php if ( $this->get( 'loggedin' ) ): ?>
					<div id="echo-notifications">
					<div id="echo-notifications-alerts"></div>
					<div id="echo-notifications-messages"></div>
					<div id="echo-notifications-notice"></div>
					</div>
					<?php endif; ?>
				<!--[if lt IE 9]>
				<div id="siteNotice" class="sitenotice panel radius"><?php echo $this->text( 'sitename' ) . ' ' . wfMessage( 'vaniskin-browsermsg' )->text(); ?></div>
				<![endif]-->

				<?php if ( $this->data['sitenotice'] ) { ?><div id="siteNotice" class="sitenotice"><?php $this->html( 'sitenotice' ); ?></div><?php
				} ?>
				<?php if ( $this->data['newtalk'] ) { ?><div id="usermessage" class="newtalk panel radius"><?php $this->html( 'newtalk' ); ?></div><?php
				} ?>
				</div>
		</div>

		<div id="mw-js-message" style="display:none;"></div>

		<div class="row">
				<div id="p-cactions" class="large-12 columns">
					<?php if ( $this->get( 'loggedin' ) || $wgForegroundFeatures['showActionsForAnon'] ): ?>
						<a id="actions-button" href="#" data-dropdown="actions" data-options="align:left; is_hover: true; hover_timeout:700" class="button small secondary radius"><i class="fa fa-cog"><span class="show-for-medium-up">&nbsp;<?php echo wfMessage( 'actions' )->text() ?></span></i></a>
						<!--RTL -->
						<ul id="actions" class="f-dropdown" data-dropdown-content>
							<?php foreach ( $this->data['content_actions'] as $key => $item ) { echo preg_replace( [ '/\sprimary="1"/','/\scontext="[a-z]+"/','/\srel="archives"/' ], '', $this->makeListItem( $key, $item ) );
							} ?>
							<?php \MediaWiki\MediaWikiServices::getInstance()->getHookContainer()->run( 'SkinTemplateToolboxEnd', [ &$this, true ] ); ?>
						</ul>
						<!--RTL -->
					<?php endif;
					$namespace = str_replace( '_', ' ', $this->getSkin()->getTitle()->getNsText() );
					$displaytitle = $this->data['title'];
					if ( !empty( $namespace ) ) {
						$pagetitle = $this->getSkin()->getTitle();
						$newtitle = str_replace( $namespace . ':', '', $pagetitle );
						$displaytitle = str_replace( $pagetitle, $newtitle, $displaytitle );
					?><h4 class="namespace label"><?php print $namespace; ?></h4><?php
					} ?>
					<?php
						preg_match('/([A-Za-z]+)\.org/', $_SERVER['SERVER_NAME'] ?? '', $matches);
						$contentCssClass = $matches[1] ?? "vanisource";

						if (empty( $namespace ) && preg_match('/(?:Purport|Philosophy|[0-9]{6}(?:-[0-9])?[a-z]? ?- ?(.*Lecture|.*Conversation|Morning Walk|Letter|.*Interview|Arrival|Departure|.*Purport|.*Chanting|At the house|Deity|Press|Parikrama|Dictation|Jaya|Nitai|Initiation))/', $this->getSkin()->getTitle())){
							$contentCssClass .= " lectconv";
						}
					?>
					<div id="content" class="<?php echo $contentCssClass; ?>">
					<h1  id="firstHeading" class="title"><?php print $displaytitle; ?></h1>
						<?php if ( $wgForegroundFeatures['useAddThisShare'] !== '' ) { ?>
						<!-- Go to www.addthis.com/dashboard to customize your tools -->
						<div class="<?php echo $wgForegroundFeatures['useAddThisShare']; ?> hide-for-print"></div>
						<!-- Go to www.addthis.com/dashboard to customize your tools -->
						<?php } ?>
					<h5 id="siteSub" class="subtitle"><?php $this->html( 'subtitle' ) ?></h5>
					<div id="contentSub" class="clear_both"></div>
					<?php
						
					?>
					<div id="bodyContent" class="mw-bodytext">
						<?php
							switch ( $wgForegroundFeatures['enableTabs'] ) {
								case true:
									echo $body;
									break;
								default:
								$this->html( 'bodytext' );
									break;
							}
						?>
						<div class="clear_both"></div>
					</div>
				<div class="group"><?php $this->html( 'catlinks' ); ?></div>
				<?php
					global $gFactboxHTML;

					if ($gFactboxHTML) {
						$this->extend( 'factbox', $gFactboxHTML );
						$this->html( 'factbox' );
					}
				?>
				<?php $this->html( 'dataAfterContent' ); ?>
				</div>
			</div>
		</div>

			<footer class="row">
				<div id="footer">
					<?php if ( $wgForegroundFeatures['useAddThisFollow'] !== '' ) { ?>
						<div class="social-follow hide-for-print">
							<!-- Go to www.addthis.com/dashboard to customize your tools -->
							<div class="<?php echo $wgForegroundFeatures['useAddThisFollow']; ?> hide-for-print"></div>
						</div>
					<?php } ?>
					<div id="footer-left" class="<?php echo $footerLeftClass;?>">
					<ul id="footer-left-ul">
						<?php foreach ( $this->getFooterLinks( "flat" ) as $key ) { ?>
							<li id="footer-<?php echo $key ?>"><?php $this->html( $key ) ?></li>
						<?php } ?>
					</ul>
					</div>
					<div id="footer-right-icons" class="<?php echo $footerRightClass;?>">
					<ul id="poweredby">
						<?php foreach ( $footerIconBlocks as $blockName => $footerIcons ) { ?>
							<li class="<?php echo $blockName ?>"><?php foreach ( $footerIcons as $icon ) { ?>
								<?php echo $this->getSkin()->makeFooterIcon( $icon, $poweredbyMakeType ); ?>
									   <?php } ?>
							</li>
						<?php } ?>
					</ul>
					</div>
				</div>
			</footer>

		</div>
			<?php if ( $this->data['isarticle'] && $wgForegroundFeatures['addThisPUBID'] !== '' ) { ?>
				<script type="text/javascript" src="//s7.addthis.com/js/300/addthis_widget.js#pubid=<?php echo $wgForegroundFeatures['addThisPUBID']; ?>" async="async">></script>
			<?php } ?>

		<script type="text/javascript">
			document.addEventListener('DOMContentLoaded', function() {
				// Detect audio players in lectures/conversations and make them fixed in position
				const audioPlayers = document.querySelectorAll('audio');
				
				if (audioPlayers.length === 1) {
					const audioPlayer = document.querySelector('div.code + p:has(audio)');
					
					if (audioPlayer) {
						const rect = audioPlayer.getBoundingClientRect();
						const scrollTop = window.scrollY || document.documentElement.scrollTop;
						const scrollThreshold = rect.top + scrollTop;
		
						const handlePlayerPosition = () => {
							if (window.scrollY > scrollThreshold) {
								audioPlayer.classList.add('fixed');
							} else {
								audioPlayer.classList.remove('fixed');
							}
						}
						
						window.addEventListener('scroll', handlePlayerPosition);
						
						handlePlayerPosition();
					}
				}
			});
		</script>
<?php
	}
}

