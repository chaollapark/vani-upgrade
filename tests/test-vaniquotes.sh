#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/test-helpers.sh"

run_vaniquotes_tests() {
    init_wiki "Vaniquotes" 8083 "vaniquotes" "vaniquotes_"
    print_wiki_header
    run_http_health_tests
    run_api_meta_tests
    run_api_query_tests
    local skip="BrokenRedirects DeadendPages DoubleRedirects LongPages ShortPages AncientPages WantedCategories WantedFiles WantedPages WantedTemplates MostLinkedPages UncategorizedPages UnusedCategories UnusedFiles"
    run_special_pages_tests "$skip"
    run_page_rendering_tests
    run_vaniskin_tests
    run_db_integrity_tests 250000
    run_security_tests
    run_image_tests
    run_namespace_tests
    run_cache_perf_tests
    run_docker_tests
    run_feed_tests
    run_error_handling_tests

    print_section "Vaniquotes Extensions (31 tests)"
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
    test_api_has_extension "Extension: VaniAudio" "VaniAudio"
    test_api_has_extension "Extension: VaniVideo" "VaniVideo"
    test_api_has_extension "Extension: MarkTerms" "MarkTerms"
    test_api_has_extension "Extension: MenuSidebar" "MenuSidebar"
    test_api_has_extension "Extension: VaniSubcat" "VaniSubcat"
    test_api_has_extension "Extension: VaniFactbox" "VaniFactbox"
    test_api_has_extension "Extension: VaniquotesApi" "VaniquotesApi"
    test_api_has_extension "Extension: VaniUrlRouter" "VaniUrlRouter"
    test_api_has_extension "Extension: VaniSearch" "Vanisource Search"
    test_api_has_extension "Extension: CategoryMove" "Category Move"
    test_api_has_extension "Extension: QuoteStats" "Statistics for Quotes from Vaniquote Pages"
    test_api_has_extension "Extension: AI_CategoryWrapper" "AI Category Wrapper"
    test_api_has_extension "Extension: AI_PageLinker" "AI Page Linker"
    test_api_has_extension "Extension: ExternalData" "External Data"

    print_section "Vaniquotes-Specific (5 tests)"
    test_api_has_namespace "Custom NS 100 (Manual)" "100"
    test_api_has_namespace "Custom NS 101 (Manual_talk)" "101"
    test_special_page_not_error "VaniquotesApi special page" "VaniquotesApi"
    test_special_page_not_error "VaniSearch special page" "VaniSearch"
    test_special_page_not_error "QuoteStats special page" "QuoteStats"

    print_wiki_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_vaniquotes_tests
    exit $(( FAIL > 0 ? 1 : 0 ))
fi
