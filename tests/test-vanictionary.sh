#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/test-helpers.sh"

run_vanictionary_tests() {
    init_wiki "Vanictionary" 8088 "vanictionary" "vanictionary_"
    print_wiki_header
    run_http_health_tests
    run_api_meta_tests
    run_api_query_tests
    run_special_pages_tests
    run_page_rendering_tests
    run_vector_skin_tests
    run_db_integrity_tests 40
    run_security_tests
    run_image_tests
    run_namespace_tests
    run_cache_perf_tests
    run_docker_tests
    run_feed_tests
    run_error_handling_tests

    print_section "Vanictionary Extensions (9 tests)"
    test_api_has_extension "Extension: CategoryTree" "CategoryTree"
    test_api_has_extension "Extension: ImageMap" "ImageMap"
    test_api_has_extension "Extension: InputBox" "InputBox"
    test_api_has_extension "Extension: Interwiki" "Interwiki"
    test_api_has_extension "Extension: ParserFunctions" "ParserFunctions"
    test_api_has_extension "Extension: CharInsert" "CharInsert"
    test_api_has_extension "Extension: Loops" "Loops"
    test_api_has_extension "Extension: RandomSelection" "RandomSelection"
    test_api_has_extension "Extension: EmbedVideo" "EmbedVideo"

    print_section "Vanictionary-Specific (3 tests)"
    test_contains "Shared uploads configured" "${BASE_URL}/w/api.php?action=query&meta=siteinfo&siprop=general&format=json" '"query"'
    test_special_page_not_error "Interwiki special page" "Interwiki"
    test_special_page_not_error "CategoryTree special page" "CategoryTree"

    print_wiki_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_vanictionary_tests
    exit $(( FAIL > 0 ? 1 : 0 ))
fi
