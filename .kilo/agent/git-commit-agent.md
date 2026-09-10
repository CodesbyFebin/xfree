---
name: git-commit-agent
description: Agent with bash permissions for git operations
permission:
  "*": allow
  bash:
    "*": allow
    "git *": allow
  external_directory:
    "*": allow
---
This agent has elevated permissions to execute git commands.
