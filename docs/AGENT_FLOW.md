# DeliveryIQ Agent Flow

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐ │
│  │  Chat UI    │───►│   API Service    │───►│   Dashboard Visualizations  │ │
│  │  (Input)    │    │   (WebSocket)    │    │   (Charts/Metrics Output)   │ │
│  └─────────────┘    └────────┬─────────┘    └─────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (LangGraph)                                  │
│                                                                              │
│    ┌──────────────────────────────────────────────────────────────────┐     │
│    │                      State Management                             │     │
│    │  • user_query          • chat_history      • visualizations      │     │
│    │  • visualization_request  • analytical_summary                   │     │
│    └──────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Flow Diagram

```
                                    START
                                      │
                                      ▼
                              ┌───────────────┐
                              │   CHAT AGENT  │
                              │   (Router)    │
                              └───────┬───────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │     Decision Point        │
                        │  "Does user want data     │
                        │   visualization?"         │
                        └─────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌───────────┐     ┌───────────┐     ┌───────────┐
            │  Direct   │     │ Analytics │     │   END     │
            │  Response │     │  Request  │     │ (Goodbye) │
            └─────┬─────┘     └─────┬─────┘     └───────────┘
                  │                 │
                  │                 ▼
                  │         ┌───────────────┐
                  │         │  ANALYTICAL   │
                  │         │    AGENT      │
                  │         │               │
                  │         │ • Query Data  │
                  │         │ • Create Viz  │
                  │         │ • Summarize   │
                  │         └───────┬───────┘
                  │                 │
                  │                 ▼
                  │         ┌───────────────┐
                  │         │  CHAT AGENT   │
                  │         │  (Summarize)  │
                  │         └───────┬───────┘
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  HUMAN INPUT  │
                   │   (Wait for   │
                   │  next query)  │
                   └───────┬───────┘
                           │
                           └──────────► Back to CHAT AGENT
```

---

## Detailed Agent Descriptions

### 1️⃣ Chat Agent (Main Router)
**Purpose:** Conversational interface & routing decisions

| Input | Output |
|-------|--------|
| `user_query` - User's question | `chat_response` - Text response |
| `chat_history` - Previous messages | `visualization_request` - If data viz needed |

**Routing Logic:**
- **Direct Response** → General questions, greetings
- **Analytics Request** → "show me", "visualize", "chart", data questions
- **End Session** → "goodbye", "exit", "quit"

---

### 2️⃣ Analytical Agent (Data Specialist)
**Purpose:** Query data & create visualizations

| Input | Output |
|-------|--------|
| `visualization_request` - What to visualize | `visualizations` - Chart configs |
| Dataset access (72K+ records) | `analytical_summary` - Key findings |

**Capabilities:**
- 📊 Bar charts, line charts, pie charts
- 📈 Trend analysis
- 🗺️ Lane performance metrics
- 🚚 Carrier comparisons
- ⏱️ Transit time distributions

---

### 3️⃣ Human Input Node
**Purpose:** Interrupt & wait for user

| Input | Output |
|-------|--------|
| Previous `result` | `user_message` - New query |
| `visualizations` | Routes back to Chat Agent |

---

## Example Flow: "Show me late deliveries by carrier"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Input                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ User: "Show me late deliveries by carrier"                              │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Chat Agent Routes to Analytical                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Decision: Contains "show me" → visualization_request                    │
│ Output: "I'll analyze late deliveries by carrier..."                    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Analytical Agent Processes                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ • Queries dataset for late deliveries                                   │
│ • Groups by carrier_pseudo                                              │
│ • Creates bar chart configuration                                       │
│ • Generates summary: "Carrier X has highest late rate at 35%"           │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Chat Agent Summarizes                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Output: "I've created 1 visualization on your dashboard.                │
│          The analysis shows Carrier X has the highest late rate..."     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Frontend Displays                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ • Chat shows response text                                              │
│ • Dashboard renders bar chart                                           │
│ • Awaits next user input                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## State Flow Summary

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   INPUT    │────►│   PROCESS  │────►│   OUTPUT   │────►│   DISPLAY  │
├────────────┤     ├────────────┤     ├────────────┤     ├────────────┤
│ user_query │     │ Chat Agent │     │ response   │     │ Chat UI    │
│ chat_      │     │ Analytical │     │ visuali-   │     │ Dashboard  │
│ history    │     │ Agent      │     │ zations    │     │ Charts     │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

---

## Key Technologies

| Component | Technology |
|-----------|------------|
| Agent Framework | LangGraph |
| LLM | GPT-4 / Claude |
| State Management | LangGraph State |
| Frontend | React + Vite |
| Data | 72,966 shipment records |
| Visualization | Recharts |
