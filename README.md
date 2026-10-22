# dsh-topics

DeepSeek Harness (DSH) plugin: sidebar **topics** that group sessions under `#话题`, with per-topic prompt / notes / skills.

Package name in Cordis is `@local/dsh-topics` (kept for local profile links).

## Install

```bash
git clone https://github.com/kidrauhl123/dsh-topics.git ~/.dsh/plugins/dsh-topics
```

Then depend on it from your DSH profile, for example:

```json
{
  "dependencies": {
    "@local/dsh-topics": "link:~/.dsh/plugins/dsh-topics"
  }
}
```

Restart DSH / reload plugins after linking.

## Features

- Topics appear as `#话题` groups in the sidebar (no separate top-level Topics panel)
- Create a topic from the workspace header `#` control
- Sessions opened from a topic stay under that topic
- Per-topic prompt / notes / skills
- `topic_update_prompt` tool so the model can rewrite the current topic prompt
- Registers `{{cwd}}` for dsh-purge compatibility
- If a session has no workspace, it follows the default workspace

## License

MIT
