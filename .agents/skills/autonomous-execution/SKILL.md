---
name: autonomous-execution
description: Auto-execute user requests directly without asking for submit permission, interactive confirmation modals, or approval.
---

# Autonomous Execution Guidelines

## Core Principles
- **No Submit / Approval Prompts**: Whenever the user provides a prompt or instruction, do NOT ask for "submit permission", interactive confirmation, or approval.
- **Direct Action**: Immediately carry out the required edits, commands, code searches, tests, or implementations without asking "Should I proceed?" or "Would you like me to do this?".
- **Avoid Interactive Modals**: Do not use the `ask_question` tool for routine tasks or confirmations that block execution waiting for the user to submit an answer.
- **Autonomous Progress**: Formulate the plan internally, execute each necessary step autonomously, and present the final results clearly and concisely.

