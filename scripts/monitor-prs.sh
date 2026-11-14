#!/usr/bin/env bash
# Fusiona en orden los PRs apilados fase-N-* hacia main cuando su check "verificar" está verde.
# Uso: scripts/monitor-prs.sh [total_fases=10] [segundos=60]
TOTAL=${1:-10}
ESPERA=${2:-60}
while true; do
  fusionados=$(gh pr list --state merged --json headRefName -q '[.[]|select(.headRefName|test("^fase-[0-9]+"))]|length')
  if [ "$fusionados" -ge "$TOTAL" ]; then echo "LISTO: los $TOTAL PRs están fusionados"; exit 0; fi
  # PR abierto de menor número de fase
  fila=$(gh pr list --state open --json number,headRefName,baseRefName \
    -q '[.[]|select(.headRefName|test("^fase-[0-9]+"))]|sort_by(.headRefName|capture("^fase-(?<n>[0-9]+)").n|tonumber)|.[0]|select(.!=null)|"\(.number) \(.headRefName) \(.baseRefName)"')
  if [ -n "$fila" ]; then
    read -r num rama base <<<"$fila"
    if [ "$base" != "main" ]; then gh pr edit "$num" --base main >/dev/null && echo "PR #$num ($rama): base reajustada a main"; fi
    estado=$(gh pr view "$num" --json mergeable,statusCheckRollup -q '
      (if .mergeable=="CONFLICTING" then "CONFLICTO"
       elif ([.statusCheckRollup[]?|select(.conclusion=="FAILURE" or .conclusion=="CANCELLED")]|length)>0 then "FALLO"
       elif (.statusCheckRollup|length)==0 then "SIN_CHECKS"
       elif ([.statusCheckRollup[]?|select(.status!="COMPLETED")]|length)>0 then "PENDIENTE"
       else "VERDE" end)')
    case "$estado" in
      VERDE) gh pr merge "$num" --merge --delete-branch && echo "FUSIONADO: PR #$num ($rama)" ;;
      FALLO|CONFLICTO) echo "DETENIDO: PR #$num ($rama) en estado $estado; requiere intervención"; exit 1 ;;
      *) echo "esperando PR #$num ($rama): $estado" ;;
    esac
  else
    echo "sin PRs abiertos todavía ($fusionados/$TOTAL fusionados)"
  fi
  sleep "$ESPERA"
done
