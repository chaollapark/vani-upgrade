<?php
class VaniUrlRouterHooks
{
    // If the page does not exist, try a similar or close one
    public static function onBeforeDisplayNoArticleText( $article )
    {
        $orgTitle = $title = $article->getTitle()->getText();
        $orgNS = $article->getTitle()->getNamespace();
        $qs = $_SERVER['QUERY_STRING'];
        
        // Handle ellipsis at the end of the title
        if (VaniUrlRouterHooks::tryNewUrl($orgTitle."...", $qs, $orgNS)) return;

        // Handle question marks in title
        if (strlen($qs) > 0)
        {
            if (strpos($qs, '?hl=') !== FALSE)
            {
                $qs = explode("?hl=", $qs);
                $qs[0] = urldecode($qs[0]);
                $title = "$title?{$qs[0]}";
                $qs = 'hl='.str_replace('?', '%3F', $qs[1]);
            }
            else
            {
                $qs = urldecode($qs);
                $title .= "?$qs";
                $qs = "";
            }
        }
        else if (strpos($_SERVER['REQUEST_URI'], '?') !== FALSE)
        {
            $title .= '?';
            $qs = '';
        }
        if ($title != $orgTitle) if (VaniUrlRouterHooks::tryNewUrl($title, $qs)) return;
        $mendedTitle = str_replace('?', '%3F', $title);
        
        // Handle mobile phone clicks
        $title = preg_replace('/([,\):])(?![ ,])/', '$1 ', $title);
        $title = preg_replace('/(?<! )(\()/', ' $1', $title);
        $title = preg_replace('/(?<! )(- )/', ' $1', $title);
        if ($title != $orgTitle) if (VaniUrlRouterHooks::tryNewUrl($title, $_SERVER['QUERY_STRING'])) return;
        $title2 = preg_replace('/(?<! )"/', ' "', $title);
        if ($title2 != $orgTitle) if (VaniUrlRouterHooks::tryNewUrl($title2, $_SERVER['QUERY_STRING'])) return;
        $title3 = preg_replace('/\.(?! )/', '. ', $title);
        if ($title3 != $orgTitle) if (VaniUrlRouterHooks::tryNewUrl($title3, $_SERVER['QUERY_STRING'])) return;
        $title4 = preg_replace('/\.(?! )/', '. ', $title2);
        if ($title4 != $orgTitle) if (VaniUrlRouterHooks::tryNewUrl($title4, $_SERVER['QUERY_STRING'])) return;
        $title5 = preg_replace('/(?<![0-9])\.(?![ 0-9])/', '. ', $title);
        if ($title5 != $orgTitle) if (VaniUrlRouterHooks::tryNewUrl($title5, $_SERVER['QUERY_STRING'])) return;
        $title6 = preg_replace('/(?<![0-9])\.(?![ 0-9])/', '. ', $title2);
        if ($title6 != $orgTitle) if (VaniUrlRouterHooks::tryNewUrl($title6, $_SERVER['QUERY_STRING'])) return;
        
        if ($mendedTitle != $orgTitle) // Handle question marks in page for creation
        {
            if (strpos($mendedTitle, 'hl=') !== FALSE) return;
            if (strpos($_SERVER['REQUEST_URI'], '%3F') !== FALSE) return; // Prevent infinite recursion
            if (strlen($qs) > 0) $qs = "?$qs";
            header("Location: /wiki/$mendedTitle$qs");
        }
    }
    
    // See if a page with the title exists, redirect to it
    // Returns TRUE if redirected, FALSE if not found
    // $title is MediaWiki title
    // $qs is query string without ?
    public static function tryNewUrl($title, $qs, $ns=NS_MAIN)
    {
        if (strlen($qs) > 0) $qs = "?$qs";
        
        $titleObj = Title::newFromText( $title, $ns );
        if ($titleObj === NULL)
            return FALSE;
        
        if ($titleObj->exists()) {
            $title = str_replace(' ', '_', $title);
            $title = str_replace('?', '%3F', $title);
            header("Location: /wiki/{$titleObj->getFullText()}$qs");
            return TRUE;
        }
        
        return FALSE;
    }
}
?>
