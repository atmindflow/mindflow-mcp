# Mindflow MCP (v3)

A lightweight, extensible **multi-agent task scheduler** in Python.

This repository also contains a small static landing page (deployed on Vercel) showcasing the latest release.

## What’s new in v3

- **Multi-agent scheduler**: orchestrate multiple agents, each with its own queue of tasks.
- **Threaded execution**: each agent runs concurrently via `threading.Thread`.
- **Task abstraction with params**: reusable `Task(name, action, params)` building blocks.
- **Structured logging**: consistent visibility into execution and failures.

## How it works

1. Create one or more `Agent` objects.
2. Add `Task` objects to each agent.
3. Add agents to `Scheduler`.
4. Start the scheduler — it runs agents in parallel and waits for completion.

## Run the v3 example

```bash
python v3.py
```

You should see log output and the example tasks run (printing a message and computing a sum).

## Website

- Live site: https://mindflow-mcp.vercel.app
- Repo: https://github.com/atmindflow/mindflow-mcp
