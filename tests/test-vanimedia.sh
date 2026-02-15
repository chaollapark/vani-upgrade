#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/test-helpers.sh"

run_vanimedia_tests() {
    init_wiki "Vanimedia" 8086 "vanimedia" "vanimedia_"
    print_wiki_header
    run_http_health_tests
    run_api_meta_tests
    run_api_query_tests
    run_special_pages_tests
    run_page_rendering_tests
    run_vaniskin_tests
    run_db_integrity_tests 15000
    run_security_tests
    run_image_tests
    run_namespace_tests
    run_cache_perf_tests
    run_docker_tests
    run_feed_tests
    run_error_handling_tests

    print_section "Vanimedia Extensions (16 tests)"
    test_api_has_extension "Extension: CategoryTree" "CategoryTree"
    test_api_has_extension "Extension: Cite" "Cite"
    test_api_has_extension "Extension: InputBox" "InputBox"
    test_api_has_extension "Extension: ParserFunctions" "ParserFunctions"
    test_api_has_extension "Extension: ReplaceText" "Replace Text"
    test_api_has_extension "Extension: Renameuser" "Renameuser"
    test_api_has_extension "Extension: WikiEditor" "WikiEditor"
    test_api_has_extension "Extension: HeaderTabs" "Header Tabs"
    test_api_has_extension "Extension: Loops" "Loops"
    test_api_has_extension "Extension: RandomImage" "RandomImage"
    test_api_has_extension "Extension: RandomSelection" "RandomSelection"
    test_api_has_extension "Extension: EmbedVideo" "EmbedVideo"
    test_api_has_extension "Extension: CharInsert" "CharInsert"
    test_api_has_extension "Extension: MobileDetect" "MobileDetect"
    test_api_has_extension "Extension: VaniAudio" "VaniAudio"
    test_api_has_extension "Extension: VaniSearch" "Vanisource Search"

    print_section "Vanimedia-Specific (3 tests)"
    test_special_page_not_error "VaniSearch special page" "VaniSearch"
    test_contains "Image repository accessible" "${BASE_URL}/w/api.php?action=query&list=allimages&ailimit=5&format=json" '"name"'
    test_http_status "Upload page accessible" "${BASE_URL}/wiki/Special:Upload" "200"

    print_wiki_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_vanimedia_tests
    exit $(( FAIL > 0 ? 1 : 0 ))
fi
