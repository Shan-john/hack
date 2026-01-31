---
description: Automatically upload changes to git after successful implementation
---

# Auto Git Upload Workflow

After every successful implementation, follow these steps:

// turbo-all

1. Stage all changes:
```bash
git add .
```

2. Commit with a descriptive message based on the changes made:
```bash
git commit -m "[type]: descriptive message"
```
Types: feat, fix, refactor, docs, style, chore

3. Push to remote:
```bash
git push
```

## Notes
- Run this workflow after verifying the implementation works correctly
- Use meaningful commit messages that describe what was changed
- If there are conflicts, resolve them before pushing
