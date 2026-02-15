#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/test-helpers.sh"

run_vanisource_tests() {
    init_wiki "Vanisource" 8082 "vanisource" "vanisource_"
    print_wiki_header
    run_http_health_tests
    run_api_meta_tests
    run_api_query_tests
    run_special_pages_tests
    run_page_rendering_tests
    run_vaniskin_tests
    run_db_integrity_tests 60000
    run_security_tests
    run_image_tests
    run_namespace_tests
    run_cache_perf_tests
    run_smw_tests
    run_docker_tests
    run_feed_tests
    run_error_handling_tests

    print_section "Vanisource Extensions (24 tests)"
    test_api_has_extension "Extension: CategoryTree" "CategoryTree"
    test_api_has_extension "Extension: CharInsert" "CharInsert"
    test_api_has_extension "Extension: CiteThisPage" "CiteThisPage"
    test_api_has_extension "Extension: InputBox" "InputBox"
    test_api_has_extension "Extension: ParserFunctions" "ParserFunctions"
    test_api_has_extension "Extension: ReplaceText" "Replace Text"
    test_api_has_extension "Extension: Renameuser" "Renameuser"
    test_api_has_extension "Extension: TextExtracts" "TextExtracts"
    test_api_has_extension "Extension: WikiEditor" "WikiEditor"
    test_api_has_extension "Extension: HeaderTabs" "Header Tabs"
    test_api_has_extension "Extension: Variables" "Variables"
    test_api_has_extension "Extension: RandomImage" "RandomImage"
    test_api_has_extension "Extension: Loops" "Loops"
    test_api_has_extension "Extension: RandomSelection" "RandomSelection"
    test_api_has_extension "Extension: EmbedVideo" "EmbedVideo"
    test_api_has_extension "Extension: MobileDetect" "MobileDetect"
    test_api_has_extension "Extension: SemanticMediaWiki" "SemanticMediaWiki"
    test_api_has_extension "Extension: VaniUrlRouter" "VaniUrlRouter"
    test_api_has_extension "Extension: VaniSearch" "Vanisource Search"
    test_api_has_extension "Extension: VanibotExec" "Vanibot page edit utility"
    test_api_has_extension "Extension: PrabhupadaChat" "PrabhupadaChat"
    test_api_has_extension "Extension: VaniAudio" "VaniAudio"
    test_api_has_extension "Extension: VaniVideo" "VaniVideo"
    test_api_has_extension "Extension: MarkTerms" "MarkTerms"

    print_section "Vanisource-Specific (4 tests)"
    test_api_has_namespace "Custom NS 102 (Tools)" "102"
    test_api_has_namespace "Custom NS 103 (Tools_talk)" "103"
    test_special_page_not_error "VaniSearch special page" "VaniSearch"
    test_special_page_not_error "VanibotExec special page" "VanibotExec"

    print_wiki_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_vanisource_tests
    exit $(( FAIL > 0 ? 1 : 0 ))
fi
