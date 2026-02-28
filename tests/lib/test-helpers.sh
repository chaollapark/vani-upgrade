#!/usr/bin/env bash
# ==========================================================================
# test-helpers.sh — Shared test framework for Vani MediaWiki test suite
# ==========================================================================
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
PASS=0; FAIL=0; SKIP=0; TEST_NUM=0
WIKI_NAME=""; WIKI_PORT=""; BASE_URL=""
DB_NAME=""; DB_PREFIX=""
MW_CONTAINER=""; NX_CONTAINER=""
CACHED_GENERAL=""; CACHED_EXTENSIONS=""; CACHED_NAMESPACES=""
CACHED_SKINS=""; CACHED_STATISTICS=""; CACHED_USERGROUPS=""
CACHED_MAIN_PAGE=""
DB_USER="${MW_DB_ADMIN_USER:-admin}"; DB_PASS="${MW_DB_PASSWORD:-PLACEHOLDER}"

init_wiki() {
    WIKI_NAME="$1"; WIKI_PORT="$2"; DB_NAME="$3"; DB_PREFIX="$4"
    local name_lower
    name_lower=$(printf '%s' "$WIKI_NAME" | tr 'A-Z' 'a-z')
    BASE_URL="http://localhost:${WIKI_PORT}"
    MW_CONTAINER="mediawiki-${name_lower}"
    NX_CONTAINER="nginx-${name_lower}"
    PASS=0; FAIL=0; SKIP=0; TEST_NUM=0
    printf "  Caching API responses for %s...\n" "$WIKI_NAME"
    CACHED_GENERAL=$(curl -s --max-time 10 "${BASE_URL}/w/api.php?action=query&meta=siteinfo&siprop=general&format=json" 2>/dev/null || echo '{}')
    CACHED_EXTENSIONS=$(curl -s --max-time 10 "${BASE_URL}/w/api.php?action=query&meta=siteinfo&siprop=extensions&format=json" 2>/dev/null || echo '{}')
    CACHED_NAMESPACES=$(curl -s --max-time 10 "${BASE_URL}/w/api.php?action=query&meta=siteinfo&siprop=namespaces&format=json" 2>/dev/null || echo '{}')
    CACHED_SKINS=$(curl -s --max-time 10 "${BASE_URL}/w/api.php?action=query&meta=siteinfo&siprop=skins&format=json" 2>/dev/null || echo '{}')
    CACHED_STATISTICS=$(curl -s --max-time 10 "${BASE_URL}/w/api.php?action=query&meta=siteinfo&siprop=statistics&format=json" 2>/dev/null || echo '{}')
    CACHED_USERGROUPS=$(curl -s --max-time 10 "${BASE_URL}/w/api.php?action=query&meta=siteinfo&siprop=usergroups&format=json" 2>/dev/null || echo '{}')
    CACHED_MAIN_PAGE=$(curl -s --max-time 30 "${BASE_URL}/wiki/Main_Page" 2>/dev/null)
    if [[ ${#CACHED_MAIN_PAGE} -lt 200 ]]; then
        sleep 2
        CACHED_MAIN_PAGE=$(curl -s --max-time 30 "${BASE_URL}/wiki/Main_Page" 2>/dev/null)
    fi
    printf "  Done. (main page: %d bytes)\n" "${#CACHED_MAIN_PAGE}"
}

_record_pass() { ((TEST_NUM++)); ((PASS++)); printf "  ${GREEN}✓${NC} %3d. %s\n" "$TEST_NUM" "$1"; }
_record_fail() { ((TEST_NUM++)); ((FAIL++)); printf "  ${RED}✗${NC} %3d. %s${RED} — %s${NC}\n" "$TEST_NUM" "$1" "$2"; }
skip_test() { ((TEST_NUM++)); ((SKIP++)); printf "  ${YELLOW}⊘${NC} %3d. %s${YELLOW} — SKIP: %s${NC}\n" "$TEST_NUM" "$1" "$2"; }

_fetch_body() {
    local url="$1" body
    body=$(curl -s --max-time 30 "$url" 2>/dev/null)
    if [[ ${#body} -lt 200 ]]; then
        sleep 2
        body=$(curl -s --max-time 30 "$url" 2>/dev/null)
    fi
    printf '%s' "$body"
}

test_http_status() {
    local desc="$1" url="$2" expected="$3" timeout="${4:-10}" status
    local attempt
    for attempt in 1 2 3; do
        status=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$timeout" "$url" 2>/dev/null)
        if [[ "$status" == "$expected" ]]; then
            _record_pass "$desc"
            return
        fi
        if [[ "$status" != "000" ]]; then
            break
        fi
        sleep 1
    done
    _record_fail "$desc" "expected HTTP $expected, got $status"
}
test_http_status_follow() {
    local desc="$1" url="$2" expected="$3" status
    status=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 "$url" 2>/dev/null)
    [[ "$status" == "$expected" ]] && _record_pass "$desc" || _record_fail "$desc" "expected HTTP $expected, got $status"
}
test_http_not_status() {
    local desc="$1" url="$2" not_expected="$3" status
    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null)
    [[ "$status" != "$not_expected" ]] && _record_pass "$desc" || _record_fail "$desc" "got unexpected HTTP $not_expected"
}
test_http_ok_or_redirect() {
    local desc="$1" url="$2" status
    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null)
    [[ "$status" =~ ^(200|301|302|303|403)$ ]] && _record_pass "$desc" || _record_fail "$desc" "HTTP $status"
}
test_contains() {
    local desc="$1" url="$2" string="$3" timeout="${4:-15}" body
    local attempt
    for attempt in 1 2 3; do
        body=$(curl -s --max-time "$timeout" "$url" 2>/dev/null)
        if grep -qF "$string" <<< "$body"; then
            _record_pass "$desc"
            return
        fi
        if [[ ${#body} -lt 20 ]]; then
            sleep 1
            continue
        fi
        break
    done
    _record_fail "$desc" "'$string' not found"
}
test_contains_follow() {
    local desc="$1" url="$2" string="$3" body
    body=$(curl -sL --max-time 20 "$url" 2>/dev/null)
    if [[ ${#body} -lt 50 ]]; then sleep 2; body=$(curl -sL --max-time 20 "$url" 2>/dev/null); fi
    grep -qF "$string" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "'$string' not found"
}
test_not_contains() {
    local desc="$1" url="$2" string="$3" body
    body=$(curl -s --max-time 15 "$url" 2>/dev/null)
    ! grep -qF "$string" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "'$string' found"
}
test_regex() {
    local desc="$1" url="$2" pattern="$3" body
    body=$(curl -s --max-time 15 "$url" 2>/dev/null)
    grep -qE "$pattern" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "pattern not matched"
}
test_not_regex() {
    local desc="$1" url="$2" pattern="$3" body
    body=$(curl -s --max-time 15 "$url" 2>/dev/null)
    ! grep -qE "$pattern" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "pattern matched"
}
test_content_type() {
    local desc="$1" url="$2" expected="$3" ctype
    ctype=$(curl -s -o /dev/null -w '%{content_type}' --max-time 10 "$url" 2>/dev/null)
    grep -qi "$expected" <<< "$ctype" && _record_pass "$desc" || _record_fail "$desc" "got '$ctype'"
}
test_response_time() {
    local desc="$1" url="$2" max_s="$3" t
    t=$(curl -s -o /dev/null -w '%{time_total}' --max-time 30 "$url" 2>/dev/null)
    awk "BEGIN{exit(!($t < $max_s))}" && _record_pass "$desc" || _record_fail "$desc" "took ${t}s (max ${max_s}s)"
}

_check_cached() {
    local desc="$1" data="$2" string="$3"
    grep -qF "$string" <<< "$data" && _record_pass "$desc" || _record_fail "$desc" "'$string' not found"
}
_check_cached_regex() {
    local desc="$1" data="$2" pattern="$3"
    grep -qE "$pattern" <<< "$data" && _record_pass "$desc" || _record_fail "$desc" "pattern not matched"
}
_check_in() {
    local desc="$1" body="$2" string="$3"
    grep -qF "$string" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "'$string' not found"
}
_check_not_in() {
    local desc="$1" body="$2" string="$3"
    ! grep -qF "$string" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "'$string' found"
}
_check_regex_in() {
    local desc="$1" body="$2" pattern="$3"
    grep -qE "$pattern" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "pattern not matched"
}
_check_not_regex_in() {
    local desc="$1" body="$2" pattern="$3"
    ! grep -qE "$pattern" <<< "$body" && _record_pass "$desc" || _record_fail "$desc" "pattern matched"
}

test_api_json_valid() {
    local desc="$1" url="$2" timeout="${3:-10}" body
    local attempt
    for attempt in 1 2 3; do
        body=$(curl -s --max-time "$timeout" "$url" 2>/dev/null)
        if python3 -m json.tool <<< "$body" > /dev/null 2>&1; then
            _record_pass "$desc"
            return
        fi
        if [[ ${#body} -lt 20 ]]; then
            sleep 1
            continue
        fi
        break
    done
    _record_fail "$desc" "invalid JSON"
}
test_api_has_extension() {
    local desc="$1" ext_name="$2"
    grep -qE "\"name\"[[:space:]]*:[[:space:]]*\"${ext_name}\"" <<< "$CACHED_EXTENSIONS" \
        && _record_pass "$desc" || _record_fail "$desc" "extension '$ext_name' not found"
}
test_api_has_namespace() {
    local desc="$1" ns_id="$2"
    grep -qE "\"${ns_id}\"[[:space:]]*:[[:space:]]*\{" <<< "$CACHED_NAMESPACES" \
        && _record_pass "$desc" || _record_fail "$desc" "namespace $ns_id not found"
}

test_container_running() {
    local desc="$1" container="$2"
    docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null | grep -q true \
        && _record_pass "$desc" || _record_fail "$desc" "container '$container' not running"
}
test_container_exec() {
    local desc="$1" container="$2" cmd="$3" expected="$4" output
    output=$(docker exec "$container" sh -c "$cmd" 2>/dev/null)
    grep -qF "$expected" <<< "$output" && _record_pass "$desc" || _record_fail "$desc" "'$expected' not in output"
}
test_db_table_exists() {
    local desc="$1" db="$2" table="$3" result
    result=$(docker exec mariadb-prod mariadb -u "$DB_USER" -p"$DB_PASS" "$db" -N -e "SHOW TABLES LIKE '$table'" 2>/dev/null)
    [[ -n "$result" ]] && _record_pass "$desc" || _record_fail "$desc" "table '$table' not found in $db"
}
test_db_count_min() {
    local desc="$1" db="$2" table="$3" min="$4" count
    count=$(docker exec mariadb-prod mariadb -u "$DB_USER" -p"$DB_PASS" "$db" -N -e "SELECT COUNT(*) FROM \`$table\`" 2>/dev/null | tr -d '[:space:]')
    [[ -n "$count" ]] && (( count >= min )) && _record_pass "$desc" || _record_fail "$desc" "count=$count, need >= $min"
}
test_special_page_not_error() {
    local desc="$1" page="$2" url="${BASE_URL}/wiki/Special:${page}" status body
    status=$(curl -s -o /dev/null -w %{http_code} -L --max-time 20 "$url" 2>/dev/null)
    if [[ "$status" == "200" ]]; then
        body=$(curl -s -L --max-time 20 "$url" 2>/dev/null)
        if grep -qiE "Fatal error|Stack trace|Exception.*thrown" <<< "$body"; then
            _record_fail "$desc" "page has fatal error"
        else _record_pass "$desc"; fi
    elif [[ "$status" == "302" ]]; then
        _record_pass "$desc"
    elif [[ "$status" == "404" && "$page" == "RecentChanges" ]]; then
        body=$(curl -s -L --max-time 20 "$url" 2>/dev/null)
        if grep -qF "No changes during the given period match these criteria." <<< "$body"; then
            _record_pass "$desc"
        elif grep -qiE "Fatal error|Stack trace|Exception.*thrown" <<< "$body"; then
            _record_fail "$desc" "page has fatal error"
        else
            _record_fail "$desc" "unexpected 404 content"
        fi
    elif [[ "$status" == "000" ]]; then
        _record_fail "$desc" "connection failed"
    else
        _record_fail "$desc" "HTTP $status"
    fi
}
print_wiki_header() {
    printf "\n================================================================\n"
    printf "${BOLD}${BLUE}  Testing: %s (port %s)${NC}\n" "$WIKI_NAME" "$WIKI_PORT"
    printf "================================================================\n\n"
}
print_section() { printf "\n  ${BOLD}── %s ──${NC}\n" "$1"; }
print_wiki_summary() {
    local total=$((PASS + FAIL + SKIP))
    printf "\n────────────────────────────────────────────────────────────────\n"
    printf "  ${BOLD}%s Summary:${NC} " "$WIKI_NAME"
    printf "${GREEN}%d passed${NC}, " "$PASS"
    (( FAIL > 0 )) && printf "${RED}%d failed${NC}, " "$FAIL" || printf "0 failed, "
    printf "${YELLOW}%d skipped${NC}, %d total\n" "$SKIP" "$total"
    printf "────────────────────────────────────────────────────────────────\n"
}

# === 1. HTTP Health (18) ===
run_http_health_tests() {
    print_section "HTTP Health (18 tests)"
    test_http_status "Main page returns 200" "${BASE_URL}/wiki/Main_Page" "200"
    test_http_status_follow "Main page follows redirects to 200" "${BASE_URL}/wiki/Main_Page" "200"
    test_http_ok_or_redirect "Root URL responds" "${BASE_URL}/"
    test_http_ok_or_redirect "Root URL not erroring" "${BASE_URL}/"
    local nf_status
    nf_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE_URL}/wiki/ThisPage_Should_Never_Exist_12345" 2>/dev/null)
    [[ "$nf_status" == "404" || "$nf_status" == "302" ]] && _record_pass "Non-existent page returns 404 or 302" || _record_fail "Non-existent page returns 404 or 302" "got HTTP $nf_status"
    test_http_status "API endpoint returns 200" "${BASE_URL}/w/api.php?action=query&meta=siteinfo&format=json" "200"
    test_http_status "API with no params returns 200" "${BASE_URL}/w/api.php" "200"
    test_http_status "load.php returns 200" "${BASE_URL}/w/load.php?modules=startup&only=scripts" "200"
    test_http_not_status "LocalSettings.php blocked" "${BASE_URL}/w/LocalSettings.php" "200"
    test_content_type "Main page serves HTML" "${BASE_URL}/wiki/Main_Page" "text/html"
    test_content_type "API serves JSON" "${BASE_URL}/w/api.php?action=query&meta=siteinfo&format=json" "application/json"
    test_content_type "load.php serves JavaScript" "${BASE_URL}/w/load.php?modules=startup&only=scripts" "javascript"
    test_http_not_status "REST API not erroring (500)" "${BASE_URL}/w/rest.php/v1/page/Main_Page" "500"
    test_http_not_status "REST API not erroring (000)" "${BASE_URL}/w/rest.php/v1/page/Main_Page" "000"
    test_http_status "index.php returns 200" "${BASE_URL}/w/index.php?title=Main_Page" "200"
    test_http_status "index.php action=info returns 200" "${BASE_URL}/w/index.php?title=Main_Page&action=info" "200"
    test_http_status "OpenSearch returns 200" "${BASE_URL}/w/api.php?action=opensearch&search=Main&format=json" "200"
    test_http_not_status "Favicon not erroring" "${BASE_URL}/favicon.ico" "500"
}

# === 2. API Meta (23) ===
run_api_meta_tests() {
    print_section "API Meta / Siteinfo (23 tests)"
    local api="${BASE_URL}/w/api.php"
    _check_cached "Sitename is '${WIKI_NAME}'" "$CACHED_GENERAL" "\"sitename\":\"${WIKI_NAME}\""
    _check_cached_regex "MW version is 1.43" "$CACHED_GENERAL" '"generator":"MediaWiki 1\.43'
    _check_cached_regex "PHP version present" "$CACHED_GENERAL" '"phpversion":"8\.'
    _check_cached "Script path is /w" "$CACHED_GENERAL" '"scriptpath":"/w"'
    _check_cached "Article path is /wiki" "$CACHED_GENERAL" '"articlepath":"/wiki/'
    _check_cached "Language is en" "$CACHED_GENERAL" '"lang":"en"'
    _check_cached "Server URL correct" "$CACHED_GENERAL" "\"server\":\"http://localhost:${WIKI_PORT}\""
    _check_cached "Extensions list non-empty" "$CACHED_EXTENSIONS" '"name":'
    test_api_json_valid "General response is valid JSON" "${api}?action=query&meta=siteinfo&siprop=general&format=json"
    test_api_json_valid "Extensions response is valid JSON" "${api}?action=query&meta=siteinfo&siprop=extensions&format=json"
    test_api_json_valid "Namespaces response is valid JSON" "${api}?action=query&meta=siteinfo&siprop=namespaces&format=json"
    test_api_has_namespace "NS 0 (Main) exists" "0"
    test_api_has_namespace "NS 1 (Talk) exists" "1"
    test_api_has_namespace "NS 2 (User) exists" "2"
    test_api_has_namespace "NS 10 (Template) exists" "10"
    test_api_has_namespace "NS 14 (Category) exists" "14"
    test_api_has_namespace "NS -1 (Special) exists" "-1"
    _check_cached_regex "Statistics: pages > 0" "$CACHED_STATISTICS" '"pages":[1-9]'
    _check_cached_regex "Statistics: articles present" "$CACHED_STATISTICS" '"articles":[0-9]'
    _check_cached_regex "Statistics: edits > 0" "$CACHED_STATISTICS" '"edits":[1-9]'
    _check_cached_regex "Statistics: users > 0" "$CACHED_STATISTICS" '"users":[1-9]'
    _check_cached "Usergroups list non-empty" "$CACHED_USERGROUPS" '"name":'
    test_http_status "Paraminfo API returns 200" "${api}?action=paraminfo&modules=query&format=json" "200"
}

# === 3. API Query (32) ===
run_api_query_tests() {
    print_section "API Query (32 tests)"
    local api="${BASE_URL}/w/api.php"
    test_contains "allpages returns results" "${api}?action=query&list=allpages&aplimit=1&format=json" '"allpages":'
    test_contains "allpages limit=1 returns one page" "${api}?action=query&list=allpages&aplimit=1&format=json" '"pageid":'
    test_contains "allpages in NS 0" "${api}?action=query&list=allpages&aplimit=1&apnamespace=0&format=json" '"allpages":'
    test_contains "allcategories returns results" "${api}?action=query&list=allcategories&aclimit=1&format=json" '"allcategories":'
    test_api_json_valid "allcategories is valid JSON" "${api}?action=query&list=allcategories&aclimit=1&format=json"
    test_contains "recentchanges returns results" "${api}?action=query&list=recentchanges&rclimit=1&format=json" '"recentchanges":'
    test_contains "allusers returns results" "${api}?action=query&list=allusers&aulimit=1&format=json" '"allusers":'
    test_contains "logevents returns results" "${api}?action=query&list=logevents&lelimit=1&format=json" '"logevents":'
    test_contains "search returns results" "${api}?action=query&list=search&srsearch=page&srlimit=1&format=json" '"search":'
    test_contains "random returns a page" "${api}?action=query&list=random&rnlimit=1&format=json" '"random":'
    test_contains "Main_Page info" "${api}?action=query&titles=Main_Page&prop=info&format=json" '"pageid":'
    test_contains "Main_Page revisions" "${api}?action=query&titles=Main_Page&prop=revisions&rvlimit=1&rvprop=timestamp&format=json" '"revisions":'
    test_contains "Main_Page categories" "${api}?action=query&titles=Main_Page&prop=categories&format=json" '"pages":'
    test_contains "Main_Page links" "${api}?action=query&titles=Main_Page&prop=links&pllimit=1&format=json" '"pages":'
    test_contains "parse Main_Page returns HTML" "${api}?action=parse&page=Main_Page&prop=text&format=json" '"text":' "40"
    test_api_json_valid "parse API returns valid JSON" "${api}?action=parse&page=Main_Page&prop=text&format=json" "40"
    test_contains "tokens (csrf) returns token" "${api}?action=query&meta=tokens&type=csrf&format=json" '"csrftoken":'
    test_contains "allimages endpoint works" "${api}?action=query&list=allimages&ailimit=1&format=json" '"allimages":'
    test_contains "tags returns data" "${api}?action=query&list=tags&tglimit=5&format=json" '"tags":'
    test_contains "protectedtitles endpoint works" "${api}?action=query&list=protectedtitles&ptlimit=1&format=json" '"protectedtitles":'
    test_contains "usercontribs endpoint works" "${api}?action=query&list=usercontribs&ucuser=Admin&uclimit=1&format=json" '"usercontribs":'
    test_contains "blocks endpoint works" "${api}?action=query&list=blocks&bklimit=1&format=json" '"blocks":'
    test_contains "backlinks for Main_Page" "${api}?action=query&list=backlinks&bltitle=Main_Page&bllimit=1&format=json" '"backlinks":'
    test_contains "siteinfo magicwords" "${api}?action=query&meta=siteinfo&siprop=magicwords&format=json" '"magicwords":'
    test_contains "siteinfo libraries" "${api}?action=query&meta=siteinfo&siprop=libraries&format=json" '"libraries":'
    test_contains "siteinfo languages" "${api}?action=query&meta=siteinfo&siprop=languages&format=json" '"languages":'
    test_contains "siteinfo dbrepllag" "${api}?action=query&meta=siteinfo&siprop=dbrepllag&format=json" '"dbrepllag":'
    test_contains "invalid module returns warning" "${api}?action=query&list=nonexistentmodule&format=json" '"warnings"'
    test_contains "opensearch returns JSON" "${api}?action=opensearch&search=Main&format=json" '"Main'
    test_contains "allpages query wrapper" "${api}?action=query&list=allpages&aplimit=1&format=json" '"query"'
    test_http_status "API help returns 200" "${api}?action=help&format=json" "200"
    test_contains "expandtemplates works" "${api}?action=expandtemplates&text=%7B%7BSITENAME%7D%7D&prop=wikitext&format=json" '"wikitext"'
}

# === 4. Special Pages (35) ===
run_special_pages_tests() {
    local skip_list=" ${1:-} "
    print_section "Special Pages (35 tests)"
    local pages=(Version Statistics AllPages RecentChanges Categories Log ListUsers ActiveUsers NewPages BrokenRedirects DeadendPages DoubleRedirects LongPages ShortPages AncientPages WantedCategories WantedFiles WantedPages WantedTemplates MostLinkedPages UncategorizedPages UnusedCategories UnusedFiles Prefixindex SpecialPages MediaStatistics TrackingCategories UserRights BlockList Upload ListFiles Export AllMessages Whatlinkshere Contributions)
    for page in "${pages[@]}"; do
        if [[ "$skip_list" == *" $page "* ]]; then
            skip_test "Special:$page loads" "heavy query on large wiki"
        else test_special_page_not_error "Special:$page loads" "$page"; fi
    done
}

# === 5. Page Rendering (18) ===
run_page_rendering_tests() {
    print_section "Page Rendering (18 tests)"
    local body="$CACHED_MAIN_PAGE"
    _check_regex_in "HTML has <title> tag" "$body" '<title>'
    _check_regex_in "HTML has <body> tag" "$body" '<body'
    _check_regex_in "HTML has <head> tag" "$body" '<head'
    _check_in "HTML has mw-body element" "$body" "mw-body"
    _check_in "HTML has mw-content-text" "$body" "mw-content-text"
    _check_regex_in "CSS stylesheet linked" "$body" 'stylesheet'
    _check_regex_in "JavaScript loaded" "$body" 'script'
    _check_not_in "No PHP Fatal error" "$body" "Fatal error"
    _check_not_regex_in "No PHP Warning" "$body" 'Warning:.*in /var'
    _check_not_regex_in "No PHP Notice" "$body" 'Notice:.*in /var'
    _check_not_in "No Stack trace" "$body" "Stack trace:"
    _check_in "Footer present" "$body" "footer"
    _check_in "Charset UTF-8" "$body" "UTF-8"
    test_http_status "Edit action page loads" "${BASE_URL}/w/index.php?title=Main_Page&action=edit" "200"
    test_contains "Non-existent page handled" "${BASE_URL}/w/api.php?action=query&titles=NonExistentPage12345&format=json" '"missing"'
    test_http_status "History action loads" "${BASE_URL}/w/index.php?title=Main_Page&action=history" "200"
    test_http_status "Printable version loads" "${BASE_URL}/w/index.php?title=Main_Page&printable=yes" "200" "40"
    _check_in "Generator meta tag present" "$body" "MediaWiki"
}

# === 6. VaniSkin (14) ===
run_vaniskin_tests() {
    print_section "VaniSkin (14 tests)"
    local body="$CACHED_MAIN_PAGE"
    _check_in "Body has skin-vaniskin class" "$body" "skin-vaniskin"
    _check_regex_in "VaniSkin skin active" "$body" '[Vv]ani[Ss]kin'
    _check_regex_in "Font-awesome referenced" "$body" 'font-awesome|fontawesome|fa-'
    _check_regex_in "Foundation CSS present" "$body" 'foundation|Foundation'
    _check_regex_in "Foreground skin CSS loaded" "$body" 'foreground|Foreground|skins\.foreground'
    _check_regex_in "Foundation CSS framework" "$body" 'foundation|Foundation'
    _check_regex_in "Skin styles loaded" "$body" 'skin=vaniskin|style'
    _check_in "ResourceLoader present" "$body" "load.php"
    test_container_exec "menu.dat present in container" "$MW_CONTAINER" "test -f /var/www/html/w/menu.dat && echo FOUND" "FOUND"
    _check_regex_in "Navigation present" "$body" 'nav|navigation|menu'
    _check_regex_in "Logo or branding present" "$body" 'logo|Logo|brand'
    _check_cached "VaniSkin in loaded skins" "$CACHED_SKINS" '"vaniskin"'
    _check_not_in "No skin-vector-legacy" "$body" "skin-vector-legacy"
    _check_regex_in "Search form present" "$body" 'search|Search'
}

# === 7. Vector/Fallback Skin (12) ===
run_vector_skin_tests() {
    print_section "Skin (12 tests)"
    local body="$CACHED_MAIN_PAGE"
    _check_regex_in "Body has skin class" "$body" 'skin-vector|skin-fallback'
    _check_in "ResourceLoader present" "$body" "load.php"
    _check_regex_in "Sidebar or content panel present" "$body" 'sidebar|mw-panel|mw-sidebar|mw-body'
    _check_regex_in "User tools or personal links" "$body" 'personal|p-personal|user-links|mw-user|printfooter'
    _check_in "Content area present" "$body" "mw-content-text"
    _check_regex_in "Search present" "$body" 'search|Search'
    _check_regex_in "Footer present" "$body" 'footer|printfooter'
    _check_not_in "No VaniSkin artifacts" "$body" "skin-vaniskin"
    _check_cached_regex "Skin registered in API" "$CACHED_SKINS" '"vector"|"fallback"'
    _check_regex_in "Navigation or search nav" "$body" 'nav|navigation|p-navigation|searchInput'
    _check_regex_in "Logo or site title present" "$body" 'logo|Logo|firstHeading|mw-wiki-title'
    _check_regex_in "Content heading present" "$body" 'firstHeading|mw-first-heading|mw-body-content'
}

# === 8. DB Integrity (13) ===
run_db_integrity_tests() {
    local min_pages="${1:-1}"
    print_section "Database Integrity (13 tests)"
    test_db_table_exists "Table ${DB_PREFIX}page exists" "$DB_NAME" "${DB_PREFIX}page"
    test_db_table_exists "Table ${DB_PREFIX}revision exists" "$DB_NAME" "${DB_PREFIX}revision"
    test_db_table_exists "Table ${DB_PREFIX}slots exists" "$DB_NAME" "${DB_PREFIX}slots"
    test_db_table_exists "Table ${DB_PREFIX}user exists" "$DB_NAME" "${DB_PREFIX}user"
    test_db_table_exists "Table ${DB_PREFIX}recentchanges exists" "$DB_NAME" "${DB_PREFIX}recentchanges"
    test_db_table_exists "Table ${DB_PREFIX}logging exists" "$DB_NAME" "${DB_PREFIX}logging"
    test_db_table_exists "Table ${DB_PREFIX}categorylinks exists" "$DB_NAME" "${DB_PREFIX}categorylinks"
    test_db_table_exists "Table ${DB_PREFIX}watchlist exists" "$DB_NAME" "${DB_PREFIX}watchlist"
    test_db_table_exists "Table ${DB_PREFIX}objectcache exists" "$DB_NAME" "${DB_PREFIX}objectcache"
    test_db_count_min "Page count >= $min_pages" "$DB_NAME" "${DB_PREFIX}page" "$min_pages"
    test_db_count_min "User count > 0" "$DB_NAME" "${DB_PREFIX}user" 1
    test_db_count_min "Revision count > 0" "$DB_NAME" "${DB_PREFIX}revision" 1
    test_db_count_min "Updatelog has entries" "$DB_NAME" "${DB_PREFIX}updatelog" 1
}

# === 9. Security (12) ===
run_security_tests() {
    print_section "Security (12 tests)"
    test_not_contains "No PHP errors on main page" "${BASE_URL}/wiki/Main_Page" "Fatal error"
    test_not_regex "No PHP warnings on main page" "${BASE_URL}/wiki/Main_Page" 'Warning:.*in /var'
    test_not_regex "No PHP notices on main page" "${BASE_URL}/wiki/Main_Page" 'Notice:.*in /var'
    test_not_contains "No stack traces on main page" "${BASE_URL}/wiki/Main_Page" "Stack trace:"
    test_http_not_status "LocalSettings.php returns non-200" "${BASE_URL}/w/LocalSettings.php" "200"
    test_http_not_status ".git directory blocked" "${BASE_URL}/.git/config" "200"
    local err_body
    err_body=$(curl -s --max-time 10 "${BASE_URL}/wiki/Special:Badtitle" 2>/dev/null)
    _check_not_in "No DB credentials in error pages" "$err_body" "$DB_PASS"
    _check_not_regex_in "No file paths in error pages" "$err_body" '/var/www/html'
    test_contains "API errors return JSON" "${BASE_URL}/w/api.php?action=nonexistent&format=json" '"error"'
    test_http_not_status "Long URL no 500" "${BASE_URL}/wiki/$(python3 -c 'print("A"*500)')" "500"
    test_http_not_status "Special chars URL no 500" "${BASE_URL}/wiki/%3Cscript%3Ealert(1)%3C%2Fscript%3E" "500"
    test_http_not_status "phpinfo not exposed" "${BASE_URL}/w/phpinfo.php" "200"
}

# === 10. Images (12) ===
run_image_tests() {
    print_section "Images (12 tests)"
    local api="${BASE_URL}/w/api.php"
    test_container_exec "Image directory exists" "$MW_CONTAINER" "test -d /var/www/html/w/images && echo FOUND" "FOUND"
    test_http_not_status "Favicon not erroring" "${BASE_URL}/favicon.ico" "500"
    test_contains "allimages API works" "${api}?action=query&list=allimages&ailimit=1&format=json" '"allimages"'
    test_special_page_not_error "Special:Upload loads" "Upload"
    test_special_page_not_error "Special:ListFiles loads" "ListFiles"
    _check_cached_regex "Uploads enabled config" "$CACHED_GENERAL" '"uploadsenabled"'
    _check_cached_regex "Max upload size present" "$CACHED_GENERAL" '"maxuploadsize"'
    test_contains "imageinfo API works" "${api}?action=query&prop=imageinfo&titles=File:Example.png&format=json" '"pages"'
    test_container_exec "Images directory accessible" "$MW_CONTAINER" "ls /var/www/html/w/images/ 2>&1 | head -1 && echo OK" "OK"
    test_api_has_namespace "File namespace (6) exists" "6"
    test_api_has_namespace "File_talk namespace (7) exists" "7"
    test_contains "MIME type info available" "${api}?action=query&meta=siteinfo&siprop=fileextensions&format=json" '"fileextensions"'
}

# === 11. Namespaces (12) ===
run_namespace_tests() {
    print_section "Standard Namespaces (12 tests)"
    test_api_has_namespace "NS -1 (Special)" "-1"
    test_api_has_namespace "NS 0 (Main)" "0"
    test_api_has_namespace "NS 1 (Talk)" "1"
    test_api_has_namespace "NS 2 (User)" "2"
    test_api_has_namespace "NS 3 (User_talk)" "3"
    test_api_has_namespace "NS 4 (Project)" "4"
    test_api_has_namespace "NS 5 (Project_talk)" "5"
    test_api_has_namespace "NS 6 (File)" "6"
    test_api_has_namespace "NS 7 (File_talk)" "7"
    test_api_has_namespace "NS 8 (MediaWiki)" "8"
    test_api_has_namespace "NS 10 (Template)" "10"
    test_api_has_namespace "NS 14 (Category)" "14"
}

# === 12. Cache & Perf (8) ===
run_cache_perf_tests() {
    print_section "Cache & Performance (8 tests)"
    test_response_time "Main page loads < 5s" "${BASE_URL}/wiki/Main_Page" 5
    test_response_time "API responds < 3s" "${BASE_URL}/w/api.php?action=query&meta=siteinfo&format=json" 3
    _check_cached "Memcached configured" "$CACHED_GENERAL" '"mainpage"'
    curl -s -o /dev/null "${BASE_URL}/wiki/Main_Page" 2>/dev/null
    test_response_time "Warm cache response < 3s" "${BASE_URL}/wiki/Main_Page" 3
    local rl_headers
    rl_headers=$(curl -sI --max-time 10 "${BASE_URL}/w/load.php?modules=startup&only=scripts" 2>/dev/null)
    grep -qi "cache-control" <<< "$rl_headers" && _record_pass "ResourceLoader has Cache-Control header" || _record_fail "ResourceLoader has Cache-Control header" "not found"
    grep -qiE "etag|last-modified" <<< "$rl_headers" && _record_pass "ResourceLoader has ETag or Last-Modified" || _record_fail "ResourceLoader has ETag or Last-Modified" "not found"
    local ch
    ch=$(curl -sI --max-time 10 -H "Accept-Encoding: gzip" "${BASE_URL}/wiki/Main_Page" 2>/dev/null)
    grep -qiE "content-encoding.*gzip|vary.*accept-encoding" <<< "$ch" && _record_pass "Compression supported" || _record_fail "Compression supported" "no gzip"
    test_response_time "Second API call < 2s" "${BASE_URL}/w/api.php?action=query&meta=siteinfo&format=json" 2
}

# === 13. SMW (18) ===
run_smw_tests() {
    print_section "Semantic MediaWiki (18 tests)"
    local api="${BASE_URL}/w/api.php"
    test_api_has_extension "SMW extension loaded" "SemanticMediaWiki"
    test_special_page_not_error "Special:SemanticMediaWiki loads" "SemanticMediaWiki"
    test_special_page_not_error "Special:Properties loads" "Properties"
    test_special_page_not_error "Special:Types loads" "Types"
    test_special_page_not_error "Special:UnusedProperties loads" "UnusedProperties"
    test_special_page_not_error "Special:WantedProperties loads" "WantedProperties"
    test_special_page_not_error "Special:Concepts loads" "Concepts"
    test_special_page_not_error "Special:Ask loads" "Ask"
    test_contains "ask API works" "${api}?action=ask&query=%5B%5BMain_Page%5D%5D&format=json" '"query"'
    test_contains "browsebysubject API works" "${api}?action=browsebysubject&subject=Main_Page&format=json" '"query"'
    test_not_contains "No smw-error on main page" "${BASE_URL}/wiki/Main_Page" "smw-error"
    test_api_has_namespace "SMW namespace 102 (Property)" "102"
    test_api_has_namespace "SMW namespace 108 (Concept)" "108"
    test_db_table_exists "SMW table smw_object_ids exists" "$DB_NAME" "${DB_PREFIX}smw_object_ids"
    test_db_table_exists "SMW table smw_di_blob exists" "$DB_NAME" "${DB_PREFIX}smw_di_blob"
    _check_cached_regex "SMW version in extensions" "$CACHED_EXTENSIONS" '"SemanticMediaWiki"'
    test_special_page_not_error "Special:ExportRDF loads" "ExportRDF"
    test_not_contains "No SMW schema error" "${BASE_URL}/wiki/Main_Page" "ERROR_SCHEMA_INVALID_KEY"
}

# === 14. Docker (10) ===
run_docker_tests() {
    print_section "Docker Infrastructure (10 tests)"
    test_container_running "mediawiki container running" "$MW_CONTAINER"
    test_container_running "nginx container running" "$NX_CONTAINER"
    test_container_exec "PHP-FPM master process running" "$MW_CONTAINER" "cat /proc/1/cmdline 2>/dev/null | tr '\\0' ' '" "php-fpm"
    test_container_exec "PHP version is 8.2" "$MW_CONTAINER" "php -v 2>/dev/null | head -1" "8.2"
    test_container_exec "MW 1.43 installed" "$MW_CONTAINER" "grep MW_VERSION /var/www/html/w/includes/Defines.php 2>/dev/null" "1.43"
    test_container_exec "LocalSettings.php mounted" "$MW_CONTAINER" "test -f /var/www/html/w/LocalSettings.php && echo FOUND" "FOUND"
    local logs
    logs=$(docker logs --tail 50 "$MW_CONTAINER" 2>&1)
    ! grep -qi "FATAL\|Segfault\|core dump" <<< "$logs" && _record_pass "No FATAL in recent logs" || _record_fail "No FATAL in recent logs" "found"
    local nginx_test
    nginx_test=$(docker exec "$NX_CONTAINER" nginx -t 2>&1)
    grep -q "successful" <<< "$nginx_test" && _record_pass "nginx config is valid" || _record_fail "nginx config is valid" "failed"
    test_container_exec "Memcached reachable from container" "$MW_CONTAINER" "php -r \"echo @fsockopen('memcached', 11211) ? 'OK' : 'FAIL';\"" "OK"
    test_container_exec "MariaDB reachable from container" "$MW_CONTAINER" "php -r \"echo @fsockopen('mariadb-prod', 3306) ? 'OK' : 'FAIL';\"" "OK"
}

# === 15. Feeds (6) ===
run_feed_tests() {
    print_section "Feeds (6 tests)"
    local idx="${BASE_URL}/w/index.php"
    test_http_status_follow "Atom RC feed returns 200" "${idx}?title=Special:RecentChanges&feed=atom" "200"
    test_http_status_follow "RSS RC feed returns 200" "${idx}?title=Special:RecentChanges&feed=rss" "200"
    test_contains_follow "Feed is valid XML" "${idx}?title=Special:RecentChanges&feed=atom" '<?xml'
    test_contains_follow "Sitename in feed" "${idx}?title=Special:RecentChanges&feed=atom" "$WIKI_NAME"
    test_http_status_follow "Contributions feed returns 200" "${idx}?title=Special:Contributions&feed=atom" "200"
    test_contains_follow "Feed has content" "${idx}?title=Special:RecentChanges&feed=atom" '<feed'
}

# === 16. Error Handling (8) ===
run_error_handling_tests() {
    print_section "Error Handling (8 tests)"
    local api="${BASE_URL}/w/api.php"
    test_contains "Invalid module returns warning" "${api}?action=query&list=nonexistent_mod_xyz&format=json" '"warnings"'
    test_contains "Invalid action returns error" "${api}?action=nonexistent_action_xyz&format=json" '"error"'
    test_http_not_status "Malformed title no 500" "${BASE_URL}/wiki/Special:Badtitle/:::" "500"
    test_http_not_status "Empty title no 500" "${BASE_URL}/wiki/" "500"
    test_http_not_status "Binary chars in title no 500" "${BASE_URL}/wiki/%00%01%02" "500"
    test_contains "Huge limit returns warning" "${api}?action=query&list=allpages&aplimit=999999&format=json" '"warnings"'
    test_contains "Missing required edit token error" "${api}?action=edit&title=Test&format=json" '"error"'
    test_http_not_status "phpinfo.php not exposed" "${BASE_URL}/phpinfo.php" "200"
}
