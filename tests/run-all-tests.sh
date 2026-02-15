#!/usr/bin/env bash
# ==========================================================================
# run-all-tests.sh — Run test suites for all (or specific) Vani wikis
# Usage:
#   ./run-all-tests.sh                  # test all 8 wikis
#   ./run-all-tests.sh vanipedia        # test one wiki
#   ./run-all-tests.sh vanisource vaniquotes  # test specific wikis
# ==========================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALL_WIKIS=(vanisource vaniquotes vanipedia vanitest vanimedia vanibooks vanictionary vaniversity)

if (( $# > 0 )); then WIKIS=("$@"); else WIKIS=("${ALL_WIKIS[@]}"); fi

for wiki in "${ALL_WIKIS[@]}"; do source "${SCRIPT_DIR}/test-${wiki}.sh"; done

GRAND_PASS=0; GRAND_FAIL=0; GRAND_SKIP=0; GRAND_TOTAL=0
declare -A WIKI_RESULTS

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          Vani MediaWiki Test Suite — MW 1.43 LTS               ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
printf "║  Wikis: %-55s ║\n" "${WIKIS[*]}"
printf "║  Date:  %-55s ║\n" "$(date '+%Y-%m-%d %H:%M:%S')"
echo "╚══════════════════════════════════════════════════════════════════╝"

for wiki in "${WIKIS[@]}"; do
    func="run_${wiki}_tests"
    if type "$func" &>/dev/null; then
        "$func"
        local_total=$((PASS + FAIL + SKIP))
        WIKI_RESULTS[$wiki]="${PASS}/${FAIL}/${SKIP}/${local_total}"
        GRAND_PASS=$((GRAND_PASS + PASS))
        GRAND_FAIL=$((GRAND_FAIL + FAIL))
        GRAND_SKIP=$((GRAND_SKIP + SKIP))
        GRAND_TOTAL=$((GRAND_TOTAL + local_total))
    else
        echo "ERROR: No test function '$func' found for wiki '$wiki'"
        GRAND_FAIL=$((GRAND_FAIL + 1))
    fi
done

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; BOLD='\033[1m'; NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                      GRAND SUMMARY                             ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
printf "║  %-16s %8s %8s %8s %8s  ║\n" "Wiki" "Pass" "Fail" "Skip" "Total"
echo "║──────────────────────────────────────────────────────────────────║"
for wiki in "${WIKIS[@]}"; do
    if [[ -n "${WIKI_RESULTS[$wiki]:-}" ]]; then
        IFS='/' read -r p f s t <<< "${WIKI_RESULTS[$wiki]}"
        if (( f > 0 )); then
            printf "║  %-16s ${GREEN}%8s${NC} ${RED}%8s${NC} ${YELLOW}%8s${NC} %8s  ║\n" "$wiki" "$p" "$f" "$s" "$t"
        else
            printf "║  %-16s ${GREEN}%8s${NC} %8s ${YELLOW}%8s${NC} %8s  ║\n" "$wiki" "$p" "$f" "$s" "$t"
        fi
    fi
done
echo "║──────────────────────────────────────────────────────────────────║"
printf "║  ${BOLD}%-16s${NC} ${GREEN}%8s${NC} " "TOTAL" "$GRAND_PASS"
if (( GRAND_FAIL > 0 )); then printf "${RED}%8s${NC} " "$GRAND_FAIL"
else printf "%8s " "0"; fi
printf "${YELLOW}%8s${NC} ${BOLD}%8s${NC}  ║\n" "$GRAND_SKIP" "$GRAND_TOTAL"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
if (( GRAND_FAIL > 0 )); then
    printf "${RED}${BOLD}RESULT: %d test(s) FAILED${NC}\n" "$GRAND_FAIL"
    exit 1
else
    printf "${GREEN}${BOLD}RESULT: ALL %d tests PASSED (%d skipped)${NC}\n" "$GRAND_TOTAL" "$GRAND_SKIP"
    exit 0
fi
