# DeliveryIQ Backend

Multi-agent LangGraph workflow for last-mile delivery analysis.

## Setup

```bash
# First create a venv and activate the venv

pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

## Run

```bash
# Development server
python server.py

# LangGraph Studio
langgraph dev
```

## Structure

```
backend/
├── graph.py              # Main workflow graph
├── server.py             # FastAPI server
├── agents/
│   ├── chat/             # Main conversational agent
│   └── analytical/       # Visualization agent
└── core/
    ├── config.py         # LangSmith setup
    └── configuration.py  # Graph configuration
```
