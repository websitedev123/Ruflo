#!/usr/bin/env bash
# ============================================================
#  AI Stack setup — clones all 16 GitHub repos from your dump,
#  installs the safe Claude-skill collections (namespaced to
#  avoid collisions), and leaves autonomous-agent installers
#  behind explicit opt-in flags.
#
#  Tested target: macOS + Claude Code.
#  Usage:
#     chmod +x setup.sh
#     ./setup.sh                 # clone everything + install curated skills
#     INSTALL_ALL_SKILLS=1 ./setup.sh   # also copy the mega skill repos
#     INSTALL_CLIS=1 ./setup.sh         # also npm-install the global CLIs
#  Heavy apps (zeroclaw / paperclip / OpenMontage / open-design)
#  are cloned but NEVER auto-built — see notes at the end.
# ============================================================
set -euo pipefail

ROOT="${HOME}/ai-stack"
SKILLS="${HOME}/.claude/skills"
mkdir -p "$ROOT" "$SKILLS"
cd "$ROOT"

clone() {  # $1=url  $2=dir
  if [ -d "$2/.git" ]; then
    echo "↻ updating $2"; git -C "$2" pull --ff-only || true
  else
    echo "⬇ cloning  $2"; git clone --depth 1 "$1" "$2"
  fi
}

echo "==> Cloning into $ROOT"

# --- A. Read-only references -------------------------------------------------
clone https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools.git system-prompts
clone https://github.com/JimmyLv/awesome-nano-banana.git                    awesome-nano-banana
clone https://github.com/public-apis/public-apis.git                        public-apis

# --- B. Paste-only prompt ----------------------------------------------------
clone https://github.com/AKCodez/ai-web-agency-prompt.git                   ai-web-agency-prompt

# --- C. Claude skill collections --------------------------------------------
clone https://github.com/coreyhaines31/marketingskills.git                  marketingskills
clone https://github.com/AKCodez/promo-video-skill.git                      promo-video-skill
clone https://github.com/ComposioHQ/awesome-claude-skills.git               awesome-claude-skills
clone https://github.com/alirezarezvani/claude-skills.git                   claude-skills-rezvani
clone https://github.com/anthropics/claude-code.git                         claude-code

# --- D. Heavier agent stacks (cloned, NOT auto-installed) --------------------
clone https://github.com/affaan-m/everything-claude-code.git                everything-claude-code
clone https://github.com/garrytan/gstack.git                                gstack
clone https://github.com/ruvnet/ruflo.git                                   ruflo

# --- E. Full apps (cloned, build separately) --------------------------------
clone https://github.com/openagen/zeroclaw.git                              zeroclaw
clone https://github.com/paperclipai/paperclip.git                          paperclip
clone https://github.com/calesthio/OpenMontage.git                          OpenMontage
clone https://github.com/nexu-io/open-design.git                            open-design

echo
echo "==> Repos ready in $ROOT"

# ----------------------------------------------------------------------------
#  Install Claude skills, namespaced as ~/.claude/skills/<repo>__<skill>/
#  so repos with same-named skills don't clobber each other.
# ----------------------------------------------------------------------------
install_skills() {  # $1=repo dir under $ROOT  $2=prefix
  local repo="$ROOT/$1" prefix="$2" count=0
  [ -d "$repo" ] || return 0
  while IFS= read -r skillmd; do
    local dir; dir="$(dirname "$skillmd")"
    local base; base="$(basename "$dir")"
    local dest="$SKILLS/${prefix}__${base}"
    rm -rf "$dest"; cp -R "$dir" "$dest"; count=$((count+1))
  done < <(find "$repo" -iname "SKILL.md" -not -path "*/node_modules/*")
  echo "   installed $count skill(s) from $1  ->  ${prefix}__*"
}

echo
echo "==> Installing curated skills into $SKILLS"
install_skills marketingskills   mktg
install_skills promo-video-skill promo

if [ "${INSTALL_ALL_SKILLS:-0}" = "1" ]; then
  echo "==> INSTALL_ALL_SKILLS=1 — copying the large collections too (this is a lot)"
  install_skills awesome-claude-skills composio
  install_skills claude-skills-rezvani rezvani
else
  echo "   (skipping mega-repos awesome-claude-skills + claude-skills-rezvani — run with INSTALL_ALL_SKILLS=1 to include)"
fi

# ----------------------------------------------------------------------------
#  Optional global CLIs (off by default — these install software / agents)
# ----------------------------------------------------------------------------
if [ "${INSTALL_CLIS:-0}" = "1" ]; then
  echo "==> Installing global CLIs"
  npm i -g @anthropic-ai/claude-code
  npm i -g ruflo
  # ECC:  (cd "$ROOT/everything-claude-code" && ./install.sh)   # review first
else
  echo
  echo "==> Skipped global CLIs. To add them:"
  echo "    npm i -g @anthropic-ai/claude-code     # official Claude Code"
  echo "    npm i -g ruflo                         # ruvnet/ruflo agent framework"
fi

cat <<'NOTES'

============================================================
 NEXT STEPS — opt-in only (review code first; these run agents)
============================================================
 ECC (operator system):
   cd ~/ai-stack/everything-claude-code && less install.sh && ./install.sh
 gstack (dev stack):
   cd ~/ai-stack/gstack && less README.md && npm install
 zeroclaw (autonomous Rust agent):
   cd ~/ai-stack/zeroclaw && less install.sh   # or: docker compose up
 paperclip (agent manager):
   cd ~/ai-stack/paperclip && pnpm install      # see docker/ for container
 OpenMontage (video producer):
   cd ~/ai-stack/OpenMontage && pip install -r requirements.txt && make
 open-design (desktop app):
   open https://github.com/nexu-io/open-design/releases   # grab a build

 Restart Claude Code so it re-scans ~/.claude/skills.
============================================================
NOTES
echo "Done."
