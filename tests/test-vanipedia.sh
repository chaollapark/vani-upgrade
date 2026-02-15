#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/test-helpers.sh"

run_vanipedia_tests() {
    init_wiki "Vanipedia" 8084 "vanipedia" "vanipedia_"
    print_wiki_header
    run_http_health_tests
    run_api_meta_tests
    run_api_query_tests
    run_special_pages_tests
    run_page_rendering_tests
    run_vaniskin_tests
    run_db_integrity_tests 130000
    run_security_tests
    run_image_tests
    run_namespace_tests
    run_cache_perf_tests
    run_smw_tests
    run_docker_tests
    run_feed_tests
    run_error_handling_tests

    print_section "Vanipedia Extensions (46 tests)"
    test_api_has_extension "Extension: CategoryTree" "CategoryTree"
    test_api_has_extension "Extension: Cite" "Cite"
    test_api_has_extension "Extension: CiteThisPage" "CiteThisPage"
    test_api_has_extension "Extension: InputBox" "InputBox"
    test_api_has_extension "Extension: ParserFunctions" "ParserFunctions"
    test_api_has_extension "Extension: ReplaceText" "Replace Text"
    test_api_has_extension "Extension: Renameuser" "Renameuser"
    test_api_has_extension "Extension: WikiEditor" "WikiEditor"
    test_api_has_extension "Extension: HeaderTabs" "Header Tabs"
    test_api_has_extension "Extension: Variables" "Variables"
    test_api_has_extension "Extension: Loops" "Loops"
    test_api_has_extension "Extension: RandomImage" "RandomImage"
    test_api_has_extension "Extension: RandomSelection" "RandomSelection"
    test_api_has_extension "Extension: EmbedVideo" "EmbedVideo"
    test_api_has_extension "Extension: CharInsert" "CharInsert"
    test_api_has_extension "Extension: MobileDetect" "MobileDetect"
    test_api_has_extension "Extension: NoTitle" "NoTitle"
    test_api_has_extension "Extension: Tabs" "Tabs"
    test_api_has_extension "Extension: ExternalData" "External Data"
    test_api_has_extension "Extension: GoogleSiteSearch" "GoogleSiteSearch"
    test_api_has_extension "Extension: GoogleDocs4MW" "GoogleDocs4MW"
    test_api_has_extension "Extension: SemanticMediaWiki" "SemanticMediaWiki"
    test_api_has_extension "Extension: IframePage" "IframePage"
    test_api_has_extension "Extension: FactBox" "FactBox"
    test_api_has_extension "Extension: VanipediaApi" "VanipediaApi"
    test_api_has_extension "Extension: VaniAudio" "VaniAudio"
    test_api_has_extension "Extension: VaniVideo" "VaniVideo"
    test_api_has_extension "Extension: VaniSearch" "Vanisource Search"
    test_api_has_extension "Extension: VaniNavigation" "Vanipedia Navigation"
    test_api_has_extension "Extension: ImportArticles" "Import Articles"
    test_api_has_extension "Extension: VideoShorts" "Video Shorts"
    test_api_has_extension "Extension: UserAdmin" "User Admin"
    test_api_has_extension "Extension: LangAdmin" "Language Admin"
    test_api_has_extension "Extension: UserSeva" "User Seva"
    test_api_has_extension "Extension: RevisionManager" "Revision Manager"
    test_api_has_extension "Extension: SearchAdmin" "Search Admin"
    test_api_has_extension "Extension: QuotesAdmin" "Quotes Admin"
    test_api_has_extension "Extension: CategoryAdmin" "Category Admin"
    test_api_has_extension "Extension: TranPropAdmin" "Translation Properties Admin"
    test_api_has_extension "Extension: TestYada" "TestYada"
    test_api_has_extension "Extension: NDropStatistics" "Nectar Drop Statistics"
    test_api_has_extension "Extension: NDropTranslation" "Nectar Drop Translation"
    test_api_has_extension "Extension: CPStatistics" "Category and Page Statistics"
    test_api_has_extension "Extension: VaniUrlRouter" "VaniUrlRouter"
    test_api_has_extension "Extension: VanibotExec" "Vanibot page edit utility"
    skip_test "Extension: PrabhupadaChat (conditional)" "loaded only with ?Chatbot=123"

    print_section "Vanipedia-Specific (15 tests)"
    test_special_page_not_error "VanipediaApi special page" "VanipediaApi"
    test_special_page_not_error "GoogleSiteSearch special page" "GoogleSiteSearch"
    test_special_page_not_error "VaniSearch special page" "VaniSearch"
    test_special_page_not_error "VideoShorts special page" "VideoShorts"
    test_special_page_not_error "UserAdmin special page" "UserAdmin"
    test_special_page_not_error "LangAdmin special page" "LangAdmin"
    test_special_page_not_error "SearchAdmin special page" "SearchAdmin"
    test_special_page_not_error "QuotesAdmin special page" "QuotesAdmin"
    test_special_page_not_error "CategoryAdmin special page" "CategoryAdmin"
    test_special_page_not_error "RevisionManager special page" "RevisionManager"
    test_special_page_not_error "NDropTranslation special page" "NDropTranslation"
    test_special_page_not_error "NDropStatistics special page" "NDropStatistics"
    test_special_page_not_error "CPStatistics special page" "CPStatistics"
    test_special_page_not_error "VanibotExec special page" "VanibotExec"
    test_special_page_not_error "IframePage special page" "IframePage"

    print_wiki_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_vanipedia_tests
    exit $(( FAIL > 0 ? 1 : 0 ))
fi
