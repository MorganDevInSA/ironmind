#!/bin/bash
# Hook: Intercept "Complete CI/CD run" and inject CI/CD automation instructions

input=$(cat)
user_prompt=$(echo "$input" | jq -r '.prompt // empty')

# Check if the user typed the trigger phrase
if [[ "$user_prompt" =~ "Complete CI/CD run" ]]; then
  # Inject agent instructions to run the CI/CD sequence
  echo '{
    "permission": "allow",
    "agent_message": "🚀 CI/CD automation triggered. Running `npm run ci` followed by `npm run publish` (if CI passes).",
    "additional_context": "IMPORTANT: The user has invoked the CI/CD automation shortcut. Execute the following workflow immediately:\n\n1. Run `npm run ci` (lint + typecheck + build)\n2. If CI passes, check git status\n3. If uncommitted changes exist, create a commit with a descriptive message covering all changes\n4. Run `npm run publish` to push and deploy\n5. Report the deployment status and live URL to the user\n\nDo NOT ask for confirmation. Execute the full sequence automatically."
  }'
  exit 0
fi

# Allow all other prompts through unchanged
echo '{ "permission": "allow" }'
exit 0
