# ChatCBT

An Obsidian plugin for Cognitive Behavioral Therapy journaling with AI assistance.

![Custom Prompts](docs/Screenshot%202025-10-16%20at%2023.58.15.png)

![Menu with Custom Prompts](docs/Screenshot%202025-10-16%20at%2023.57.51.png)

## Features

- **Custom Prompts** - Create your own therapy prompts with names (appear in menu and as commands)
- **Default Behavioral Therapy Prompts** - 4 pre-configured prompts: Exposure Ladder, Activity Plan, Habit Builder, Avoidance Check
- **Customizable Assistant Name** - Choose how responses are labeled in your notes
- **OpenRouter Integration** - Access 100+ AI models through one unified API
- **60+ Languages** - Get responses in your preferred language
- **Editable System Prompt** - Customize how the AI responds
- **Desktop & Mobile** - Works everywhere Obsidian does
- **Private & Secure** - Conversations stored locally on your device

### Start chatting in a note

![chat-gif](https://github.com/clairefro/obsidian-chat-cbt-plugin/assets/9841162/3b25b29e-ba86-4d39-b76f-fea17a75fe34)

### Summarize your findings when you're ready

![summary-gif](https://github.com/clairefro/obsidian-chat-cbt-plugin/assets/9841162/27130199-4398-4861-bef7-924bc9f979d2)

## What is ChatCBT?

ChatCBT is an AI-powered journaling assistant designed to help you:

- Uncover negative thinking patterns through objective questioning
- See situations from different angles
- Practice behavioral therapy techniques (exposure, activation, habit building)
- Store conversations privately in local files
- Summarize insights in organized tables
- Use custom prompts for specific therapy techniques

**Cost:** Pennies per session (depending on the model you choose via OpenRouter)

You can keep your conversations as a personal diary or share insights with your therapist.

## Setup

ChatCBT uses [OpenRouter](https://openrouter.ai/) to access AI models. OpenRouter provides a unified API to access 100+ models from different providers (OpenAI, Anthropic, Google, Meta, and more).

### Why OpenRouter?

- **Access to many models** - Choose from GPT-4, Claude, Gemini, Llama, and 100+ others
- **One API key** - No need to manage multiple provider accounts
- **Competitive pricing** - Often cheaper than going direct to providers
- **Easy switching** - Try different models without changing your setup

### Getting Started

1. **Create an OpenRouter account**
   - Go to [openrouter.ai](https://openrouter.ai/) and sign up
   - Add credits to your account (starting with $5-10 is plenty)

2. **Get your API key**
   - Navigate to [openrouter.ai/keys](https://openrouter.ai/keys)
   - Create a new API key and copy it

3. **Configure ChatCBT**
   - Open Obsidian Settings → ChatCBT
   - Paste your OpenRouter API key
   - Choose a model (default: `openai/gpt-4o-mini`)

### Choosing a Model

Browse available models at [openrouter.ai/models](https://openrouter.ai/models)

**Recommended models:**

| Model | ID | Cost (approx) | Best for |
|-------|-----|---------------|----------|
| GPT-4o Mini | `openai/gpt-4o-mini` | $0.001/session | Fast, cheap, great quality (default) |
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | $0.01/session | Best reasoning, empathy |
| Gemini Flash | `google/gemini-flash-1.5` | $0.001/session | Fast, good quality |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct` | $0.003/session | Open source, solid performance |

Enter the model ID in ChatCBT settings. You can change models anytime.

**Privacy Note:** Your messages are sent to the model provider via OpenRouter. Review [OpenRouter's privacy policy](https://openrouter.ai/privacy). Avoid sharing sensitive personal information.

## Usage

### Basic Chat

1. Create a new note
2. Write about what's bothering you
3. Click the ChatCBT ribbon icon (❤️‍🩹) → select "Chat"
4. Continue the conversation by adding your responses at the bottom
5. The AI will respond as your configured assistant name
6. When ready, use "Summarize" to create a summary table

### Using Custom Prompts

ChatCBT includes 4 default behavioral therapy prompts:

- **Exposure Ladder** - Create an anxiety hierarchy with actionable steps
- **Activity Plan** - Build a behavioral activation plan
- **Habit Builder** - Design new habits using behavioral principles
- **Avoidance Check** - Identify and address avoidance patterns

Access them via:
- **Ribbon menu** - Click the ChatCBT icon
- **Command Palette** - `Cmd/Ctrl + P` → search for prompt name
- **Slash commands** - Type `/` in your note (if enabled)

### Creating Your Own Prompts

1. Open Settings → ChatCBT → Custom Prompts
2. Click "Add Prompt"
3. Enter a name (appears in menu)
4. Write your prompt text
5. Reload the plugin to activate the new command

Examples:
- "Gratitude Practice" - List 3 things you're grateful for
- "Thought Record" - Identify thought → emotion → evidence
- "Values Check" - Examine if actions align with values

### Running Commands

**Ribbon menu**

<img width="368" alt="image" src="https://github.com/clairefro/obsidian-chat-cbt-plugin/assets/9841162/1ab0126b-48de-48c4-b33d-45896334651c">

**Command Palette (`cmd` + `p` > search "chat...")**

<img width="777" alt="image" src="https://github.com/clairefro/obsidian-chat-cbt-plugin/assets/9841162/ea32ec43-dd9e-4def-87f2-64ee59b9f849">

## Configuration

### System Prompt

Customize how the AI responds to you from Settings → ChatCBT → Edit System Prompt.

You can restore the default prompt anytime using the "Reset to Default" button.

<img width="1080" alt="image" src="https://github.com/user-attachments/assets/5f18f29f-dfbe-4002-9020-df7fac3dca0a" />

### Assistant Name

Change how responses are labeled in your notes (Settings → Assistant Name).

Examples: "ChatCBT", "Claude", "Therapist", "Guide"

### Preferred Language

ChatCBT supports 60+ languages. Select your preference in Settings.

<img width="1091" alt="image" src="https://github.com/user-attachments/assets/9a0022b6-93b9-4b94-82f3-0dd17e1005b0" />

_Responses will honor your language setting regardless of the prompt language._

## Contributing

You can install and enable ChatCBT in developer mode via these steps:

1. In Obsidian, make sure you have [enabled Community Plugins](<[url](https://help.obsidian.md/Extending+Obsidian/Plugin+security#Restricted+mode)>)
2. In your terminal, navigate to the Obsidian vault (directory) on your computer where you'd like to use ChatCBT
3. `cd .obsidian`
4. `cd plugins` (if `plugins` directory doesn't exist, create one: `mkdir plugins`, then `cd plugins`)
5. `git clone git@github.com:clairefro/obsidian-chat-cbt-plugin.git`
6. Install dependences: `npm i`
7. Run plugin `npm run dev`
8. Navigate back to Obsidian settings, add ChatCBT plugin and enable it
9. Follow setup instructions below

## Disclaimer

ChatCBT is not a replacement for actual therapy or human interaction. Instead, ChatCBT should be thought of as a journaling assistant, similar to an interactive worksheet. It is a bot that responds with objective questions to your writing help you get out of your head and see your problems from other angles.

While the bot draws inspiration from general cognitive-behavioral therapy methods, it has not undergone review or approval by licensed therapists. Though I have personally found ChatCBT useful in managing negative thoughts, it's important to note that this bot was built by someone without domain expertise in pyschology. Also note that AI generates unpredictable responses. You are responsible for deciding whether or not this tool is useful for you. Conisder seeking help from a professional therapist.

You can see the prompts that the bot uses to generate responses here: [chat](https://github.com/clairefro/obsidian-chat-cbt-plugin/blob/main/src/prompts/system.ts) and [summarize](https://github.com/clairefro/obsidian-chat-cbt-plugin/blob/main/src/prompts/summary.ts).

**The creator is not liable for your physical, mental or spiritual health, whether you are using the default prompt or a custom prompt**

I'm happy to hear about any issues you encounter with the bot in the Issues tab, or through a DM to `@clairefroe` on Twitter/X.
