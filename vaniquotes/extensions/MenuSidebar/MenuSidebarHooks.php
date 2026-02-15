<?php
/**
 * MenuSidebar hooks — migrated from legacy require_once.
 * The fnNewSidebarItem hook is a placeholder (original had test data).
 * fnMenuSidebar was never actually hooked in the original config.
 */
class MenuSidebarHooks {
	public static function onSkinBuildSidebar( $skin, &$bar ) {
		// Original hook registered fnNewSidebarItem which added test entries.
		// Keeping as no-op since the original had placeholder test data.
		return true;
	}
}
