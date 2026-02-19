#!/usr/bin/env bash
#
# Ralph Wiggum Loop
#
# Runs opencode with a specified agent in a loop, reading prompt.md and working
# through spec.md until all tasks are complete.
#
# Usage:
#   ./ralph-loop.sh --agent <agent-name> [options]
#

set -euo pipefail

# Configuration
MAX_ITERATIONS="${MAX_ITERATIONS:-50}"
MODEL="${MODEL:-}"
PROMPT_FILE="prompt.md"
SPEC_FILE="spec.md"
STATE_DIR=".ralph"
STATE_FILE="$STATE_DIR/loop-state.json"
LOG_DIR="$STATE_DIR/logs"
COMPLETION_PROMISE="ALL_TASKS_COMPLETE"
AGENT=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

show_help() {
    cat << 'EOF'
Ralph Wiggum Loop

Runs opencode with a specified agent in a loop, reading prompt.md and working
through spec.md until all tasks are complete.

Usage:
  ./ralph-loop.sh --agent <agent-name> [options]

Arguments:
  --agent AGENT         Agent to use (REQUIRED)
                        Run 'opencode agent list' to see available agents

Options:
  --max-iterations N    Maximum iterations (default: 50)
  --model MODEL         Model to use (e.g., anthropic/claude-sonnet-4)
  --dry-run             Show what would be run without executing
  --status              Show current loop status
  --reset               Reset loop state (start fresh)
  --spec-format         Show how to structure spec.md for the loop
  --help                Show this help

Examples:
  ./ralph-loop.sh --agent typescript-developer
  ./ralph-loop.sh --agent generalist --max-iterations 30
  ./ralph-loop.sh --agent architect --model anthropic/claude-opus-4

How it works:
  1. Reads prompt.md for instructions and rules
  2. Finds the first incomplete task in spec.md
  3. Runs opencode with your agent to complete that task
  4. Checks if task was marked done in spec.md
  5. Repeats until all tasks complete or max iterations reached

EOF
}

show_spec_format() {
    cat << 'EOF'
spec.md Format Guide
====================

Tasks must be defined with:
1. A heading: ### X.Y Task Title (e.g., ### 1.1, ### 2.3)
2. A checkbox line: - [ ] done (pending) or - [x] done (complete)

Example:
```markdown
# Project Spec

## Phase 1

### 1.1 Add TypeScript strict mode
- [ ] done
- Enable strict: true in tsconfig.json

### 1.2 Add ESLint
- [x] done
- Already completed
```

Verification commands:
  grep -cE "^### [0-9]+\.[0-9]+ " spec.md    # Count tasks
  grep -cE "^\- \[x\] done" spec.md          # Count completed
  grep -cE "^\- \[ \] done" spec.md          # Count pending

EOF
}

# Parse arguments
DRY_RUN=false
SHOW_STATUS=false
RESET_STATE=false
SHOW_SPEC_FORMAT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --agent) AGENT="$2"; shift 2 ;;
        --model) MODEL="$2"; shift 2 ;;
        --max-iterations) MAX_ITERATIONS="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --status) SHOW_STATUS=true; shift ;;
        --reset) RESET_STATE=true; shift ;;
        --spec-format) SHOW_SPEC_FORMAT=true; shift ;;
        --help|-h) show_help; exit 0 ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

[[ "$SHOW_SPEC_FORMAT" == true ]] && { show_spec_format; exit 0; }

if [[ "$SHOW_STATUS" == false ]] && [[ "$RESET_STATE" == false ]] && [[ -z "$AGENT" ]]; then
    log_error "Missing required parameter: --agent"
    echo "Usage: ./ralph-loop.sh --agent <agent-name>"
    echo "Run 'opencode agent list' to see available agents"
    exit 1
fi

[[ ! -f "$PROMPT_FILE" ]] || [[ ! -f "$SPEC_FILE" ]] && {
    log_error "Must be run from project root with $PROMPT_FILE and $SPEC_FILE"
    exit 1
}

mkdir -p "$STATE_DIR" "$LOG_DIR"

# State management
save_state() {
    cat > "$STATE_FILE" << EOF
{"iteration": $1, "status": "$2", "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")", "agent": "$AGENT"}
EOF
}

load_state() {
    [[ -f "$STATE_FILE" ]] && jq -r "$1" "$STATE_FILE" 2>/dev/null || echo ""
}

[[ "$RESET_STATE" == true ]] && { rm -f "$STATE_FILE"; log_success "State reset."; exit 0; }

# Task tracking
count_completed() { grep -cE "^\- \[x\] done" "$SPEC_FILE" 2>/dev/null || echo "0"; }
count_pending() { grep -cE "^\- \[ \] done" "$SPEC_FILE" 2>/dev/null || echo "0"; }
get_current_task() {
    awk '/^### [0-9]+\.[0-9]+ / { task = $0; in_task = 1 }
         in_task && /^- \[ \] done/ { print task; exit }
         in_task && /^- \[x\] done/ { in_task = 0 }' "$SPEC_FILE"
}
all_complete() { [[ "$(count_pending)" -eq 0 ]]; }

# Status
if [[ "$SHOW_STATUS" == true ]]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    Ralph Loop Status                              ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Tasks:     $(grep -cE "^### [0-9]+\.[0-9]+ " "$SPEC_FILE" || echo 0) total"
    echo "Completed: $(count_completed)"
    echo "Pending:   $(count_pending)"
    echo ""
    task=$(get_current_task)
    [[ -n "$task" ]] && echo "Next: $task" || echo "All tasks complete!"
    echo ""
    [[ -f "$STATE_FILE" ]] && {
        echo "Loop: iteration $(load_state ".iteration"), $(load_state ".status")"
        echo "Agent: $(load_state ".agent")"
    }
    exit 0
fi

# Build prompt
build_prompt() {
    cat << EOF
# Ralph Wiggum Loop — Iteration $1

You are the $AGENT agent working through a spec.

## Instructions

$(cat "$PROMPT_FILE")

## Current Status

$(count_completed) tasks completed, $(count_pending) tasks remaining.

Current task: $(get_current_task)

## What To Do

1. Complete ONLY the current task listed above
2. Follow all rules in the prompt
3. Mark the task done: change \`- [ ] done\` to \`- [x] done\` in spec.md
4. Commit your changes

STOP after completing ONE task.

## Completion Signal

Only when ALL tasks are marked \`[x] done\`, output:
<promise>$COMPLETION_PROMISE</promise>

EOF
}

# Main loop
main() {
    log_info "Starting Ralph Wiggum Loop"
    log_info "Agent: $AGENT"
    log_info "Max iterations: $MAX_ITERATIONS"
    [[ -n "$MODEL" ]] && log_info "Model: $MODEL"
    echo ""
    
    all_complete && { log_success "All tasks already complete!"; exit 0; }
    
    local iteration
    iteration=$(load_state ".iteration")
    [[ -z "$iteration" || "$iteration" == "null" ]] && iteration=0
    
    while [[ $iteration -lt $MAX_ITERATIONS ]]; do
        ((iteration++)) || true
        
        log_info "════════════════════════════════════════════════════════════"
        log_info "Iteration $iteration / $MAX_ITERATIONS"
        log_info "════════════════════════════════════════════════════════════"
        log_info "Progress: $(count_completed) done, $(count_pending) pending"
        log_info "Task: $(get_current_task)"
        
        all_complete && { log_success "All tasks complete!"; save_state "$iteration" "complete"; exit 0; }
        
        save_state "$iteration" "running"
        
        local prompt log_file
        prompt=$(build_prompt "$iteration")
        log_file="$LOG_DIR/iteration-$iteration.log"
        
        echo "=== PROMPT ===" > "$log_file"
        echo "$prompt" >> "$log_file"
        echo -e "\n=== OUTPUT ===" >> "$log_file"
        
        if [[ "$DRY_RUN" == true ]]; then
            log_warn "DRY RUN: Would run opencode --agent $AGENT"
            echo "---"
            echo "$prompt" | head -30
            echo "..."
            continue
        fi
        
        local start_time cmd
        start_time=$(date +%s)
        cmd="opencode run --agent $AGENT"
        [[ -n "$MODEL" ]] && cmd="$cmd --model $MODEL"
        
        set +e
        $cmd "$prompt" 2>&1 | tee -a "$log_file"
        local exit_code=$?
        set -e
        
        log_info "Completed in $(($(date +%s) - start_time))s (exit: $exit_code)"
        
        all_complete && { log_success "All tasks done!"; save_state "$iteration" "complete"; exit 0; }
        
        grep -q "<promise>$COMPLETION_PROMISE</promise>" "$log_file" && all_complete && {
            log_success "Completion verified!"
            save_state "$iteration" "complete"
            exit 0
        }
        
        sleep 2
    done
    
    log_warn "Max iterations ($MAX_ITERATIONS) reached"
    save_state "$iteration" "max_iterations_reached"
    exit 1
}

main
