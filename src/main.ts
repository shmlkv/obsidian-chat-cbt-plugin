import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	Menu,
	MarkdownRenderer,
	Component,
} from 'obsidian';
import { ChatCbt, Mode } from './util/chatcbt';
import { buildAssistantMsg, convertTextToMsg } from './util/messages';
import { platformBasedSecrets } from './util/platformBasedSecrets';
import { OPENROUTER_DEFAULT_MODEL } from './constants';
import { languages } from './util/languages';
import defaultSystemPrompt from './prompts/system';
import { AI_PROVIDERS } from './constants';

/** Interfaces */
interface CustomPrompt {
	id: string;
	name: string;
	prompt: string;
}

interface ChatCbtPluginSettings {
	openRouterApiKey: string;
	mode: AI_PROVIDERS;
	language: string;
	prompt: string;
	openRouterModel: string;
	assistantName: string;
	customPrompts: CustomPrompt[];
}

interface ChatCbtResponseInput {
	isSummary: boolean;
	mode: Mode;
	customPrompt?: string;
}

/** Constants */
const DEFAULT_LANG = 'English';

const DEFAULT_SETTINGS: ChatCbtPluginSettings = {
	openRouterApiKey: '',
	mode: AI_PROVIDERS.OPENROUTER,
	language: DEFAULT_LANG,
	prompt: defaultSystemPrompt,
	openRouterModel: '',
	assistantName: 'ChatCBT',
	customPrompts: [],
};

/** Initialize chat client */
const chatCbt = new ChatCbt();

export default class ChatCbtPlugin extends Plugin {
	settings: ChatCbtPluginSettings;

	async onload() {
		console.log('[ChatCBT] Loading plugin...');

		await this.loadSettings();
		console.log('[ChatCBT] Settings loaded. Mode:', this.settings.mode, 'Model:', this.settings.openRouterModel || 'default');

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('heart-handshake', 'ChatCBT', (evt: MouseEvent) => {
			const menu = new Menu();

			const model = this.getCurrentModel();

			menu.addItem((item) =>
				item
					.setTitle(`Chat`)
					.setIcon('message-circle')
					.onClick(async () => {
						try {
							await this.getChatCbtRepsonse({
								isSummary: false,
								mode: this.settings.mode,
							});
						} catch (e) {
							new Notice(e.message);
						}
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(`Summarize`)
					.setIcon('table')
					.onClick(() => {
						this.getChatCbtSummary();
					}),
			);

			menu.showAtMouseEvent(evt);
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'chat',
			name: 'Chat',
			editorCallback: (_editor: Editor, _view: MarkdownView) => {
				this.getChatCbtRepsonse({
					isSummary: false,
					mode: this.settings.mode as Mode,
				});
			},
		});

		this.addCommand({
			id: 'summarize',
			name: 'Summarize',
			editorCallback: (_editor: Editor, _view: MarkdownView) => {
				this.getChatCbtSummary();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MySettingTab(this.app, this));
	}

	/** Run when plugin is disabled */
	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Migrate old settings to OpenRouter
		let needsSave = false;

		// Force mode to OpenRouter
		if (this.settings.mode !== AI_PROVIDERS.OPENROUTER) {
			this.settings.mode = AI_PROVIDERS.OPENROUTER;
			needsSave = true;
		}

		// Migrate old API keys to OpenRouter if present
		if (loadedData) {
			const oldData = loadedData as any;
			if ((oldData.openAiApiKey || oldData.deepseekApiKey) && !this.settings.openRouterApiKey) {
				// Use OpenAI key as default if present
				if (oldData.openAiApiKey) {
					this.settings.openRouterApiKey = oldData.openAiApiKey;
					needsSave = true;
				} else if (oldData.deepseekApiKey) {
					this.settings.openRouterApiKey = oldData.deepseekApiKey;
					needsSave = true;
				}
			}

			// Migrate model settings
			if ((oldData.openaiModel || oldData.deepseekModel || oldData.ollamaModel) && !this.settings.openRouterModel) {
				if (oldData.openaiModel) {
					// Convert OpenAI model to OpenRouter format
					this.settings.openRouterModel = oldData.openaiModel.includes('/')
						? oldData.openaiModel
						: `openai/${oldData.openaiModel}`;
					needsSave = true;
				}
			}
		}

		if (needsSave) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getChatCbtRepsonse({ isSummary = false, customPrompt }: ChatCbtResponseInput) {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			return;
		}

		if (!Object.values(AI_PROVIDERS).includes(this.settings.mode)) {
			new Notice(
				`Invalid mode '${this.settings.mode}' detected. Update in ChatCBT plugin settings and select a valid mode`,
			);
			return;
		}

		if (
			this.settings.mode === AI_PROVIDERS.OPENROUTER &&
			!this.settings.openRouterApiKey
		) {
			new Notice('Missing OpenRouter API Key - update in ChatCBT plugin settings');
			return;
		}

		const existingText = await this.app.vault.read(activeFile);
		if (!existingText.trim()) {
			new Notice('First, share how you are feeling in a note');
			return;
		}

		const messages = existingText
			.split(/---+/)
			.map((i) => i.trim())
			.map((i) => convertTextToMsg(i, this.settings.assistantName));

		// Add custom prompt as a user message if provided
		if (customPrompt) {
			messages.push({ role: 'user', content: customPrompt });
		}

		const selectedModel = this.getCurrentModel();

		const loadingModal = new MarkdownTextModel(
			this.app,
			`Asking ChatCBT...\n\n_mode: ${this.settings.mode}_\n\n_model: ${selectedModel}_`,
		);
		loadingModal.open();

		let response = '';

		try {
			const openRouterApiKey = this.settings.openRouterApiKey
				? platformBasedSecrets.decrypt(this.settings.openRouterApiKey)
				: '';

			const res = await chatCbt.chat({
				openRouterApiKey,
				messages,
				isSummary,
				mode: this.settings.mode as Mode,
				model: selectedModel,
				language: this.settings.language,
				prompt: this.settings.prompt,
			});
			response = res;
		} catch (e: any) {
			console.error('ChatCBT error:', e);

			let errorMsg = 'An error occurred while processing your request.';

			// Use the enhanced error message if available
			if (e.message) {
				errorMsg = e.message;
			} else if (e.status) {
				if (e.status === 401) {
					errorMsg = 'Invalid API key. Please check your OpenRouter API key in settings.';
				} else if (e.status === 404) {
					errorMsg = `Model '${selectedModel}' not found. Check the model name at https://openrouter.ai/models`;
				} else if (e.status >= 400 && e.status < 500) {
					errorMsg = `Unable to connect to OpenRouter.\n\nEnsure you have:\n- A valid OpenRouter API key\n- Credits in your OpenRouter account\n- The correct model name`;
				} else if (e.status >= 500) {
					errorMsg = 'OpenRouter service error. Please try again later.';
				}
			}

			new Notice(`ChatCBT Error: ${errorMsg}`, 10000);
		} finally {
			loadingModal.close();
		}

		if (response) {
			const MSG_PADDING = '\n\n';
			const appendMsg = isSummary
				? MSG_PADDING + response
				: buildAssistantMsg(response, this.settings.assistantName);
			await this.app.vault.append(activeFile, appendMsg);
		}
	}

	async getChatCbtSummary() {
		await this.getChatCbtRepsonse({
			isSummary: true,
			mode: this.settings.mode,
		});
	}

	private getCurrentModel(): string {
		return this.settings.openRouterModel || OPENROUTER_DEFAULT_MODEL;
	}
}

class MySettingTab extends PluginSettingTab {
	plugin: ChatCbtPlugin;

	constructor(app: App, plugin: ChatCbtPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('a', {
			href: 'https://github.com/clairefro/obsidian-chat-cbt-plugin/blob/main/README.md',
			text: 'Read the setup guide ↗️ ',
		});
		containerEl.createEl('br');
		containerEl.createEl('br');

		// OPENROUTER MODEL
		new Setting(containerEl)
			.setName('OpenRouter Model')
			.setDesc('Enter model ID (e.g., openai/gpt-4o-mini, anthropic/claude-3.5-sonnet)')
			.addText((text) =>
				text
					.setPlaceholder(OPENROUTER_DEFAULT_MODEL)
					.setValue(this.plugin.settings.openRouterModel)
					.onChange(async (value) => {
						this.plugin.settings.openRouterModel = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		// ASSISTANT NAME
		new Setting(containerEl)
			.setName('Assistant Name')
			.setDesc('Name that appears in responses (e.g., ChatCBT, Claude, OpenRouter)')
			.addText((text) =>
				text
					.setPlaceholder('ChatCBT')
					.setValue(this.plugin.settings.assistantName)
					.onChange(async (value) => {
						this.plugin.settings.assistantName = value.trim() || 'ChatCBT';
						await this.plugin.saveSettings();
					}),
			);

		// OPENROUTER API KEY
		new Setting(containerEl)
			.setName('OpenRouter API Key')
			.setDesc('Get your API key from OpenRouter')
			.addText((text) =>
				text
					.setPlaceholder('Enter your API Key')
					.setValue(
						this.plugin.settings.openRouterApiKey
							? platformBasedSecrets.decrypt(this.plugin.settings.openRouterApiKey)
							: '',
					)
					.onChange(async (value) => {
						if (!value.trim()) {
							this.plugin.settings.openRouterApiKey = '';
						} else {
							this.plugin.settings.openRouterApiKey = platformBasedSecrets.encrypt(
								value.trim(),
							);
						}
						await this.plugin.saveSettings();
					}),
			);

		const openRouterLinkboxEl = document.createElement('div');

		const link = openRouterLinkboxEl.createEl('a');
		link.textContent = 'Get OpenRouter API Key';
		link.href = 'https://openrouter.ai/keys';
		link.target = '_blank';
		link.style.textDecoration = 'underline';

		openRouterLinkboxEl.createEl('br');

		const modelsLink = openRouterLinkboxEl.createEl('a');
		modelsLink.textContent = 'Browse available models';
		modelsLink.href = 'https://openrouter.ai/models';
		modelsLink.target = '_blank';
		modelsLink.style.textDecoration = 'underline';

		openRouterLinkboxEl.createEl('br');
		openRouterLinkboxEl.createEl('br');

		containerEl.appendChild(openRouterLinkboxEl);

		// LANGUAGE
		new Setting(containerEl)
			.setName('Preferred Language (Beta)')
			.setDesc('For responses from ChatCBT')
			.addDropdown((dropdown) => {
				languages.forEach((lang) => {
					dropdown.addOption(lang.value, lang.label);
				});

				dropdown
					.setValue(this.plugin.settings.language || 'English')
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();
					});
			});

		// SYSTEM PROMPT
		const promptSetting = new Setting(containerEl)
			.setName('Edit System Prompt')
			.setDesc('Customize the prompt that controls how ChatCBT responds to you')
			.setClass('chat-cbt-prompt-setting');

		promptSetting.addTextArea((text) => {
			text.setValue(this.plugin.settings.prompt).onChange(async (value) => {
				this.plugin.settings.prompt = value;
				updateResetButtonVisibility(value);
				await this.plugin.saveSettings();
			});

			text.inputEl.addClass('chat-cbt-prompt-textarea');

			return text;
		});

		const buttonContainer = containerEl.createDiv('chat-cbt-button-container');

		const resetButton = new Setting(buttonContainer).addButton((button) => {
			button.setButtonText('Reset to Default').onClick(async () => {
				const confirmReset = confirm(
					"Are you sure you want to reset the prompt to default? You'll lose your custom prompt.",
				);

				if (confirmReset) {
					this.plugin.settings.prompt = defaultSystemPrompt;

					const textareaElement = containerEl.querySelector(
						'.chat-cbt-prompt-textarea',
					) as HTMLTextAreaElement;
					if (textareaElement) {
						textareaElement.value = defaultSystemPrompt;
					}

					await this.plugin.saveSettings();
					new Notice('ChatCBT prompt reset to default');

					// Update button visibility
					updateResetButtonVisibility(defaultSystemPrompt);
				}
			});

			return button;
		});

		const updateResetButtonVisibility = (value: string) => {
			const shouldShow = value !== defaultSystemPrompt;
			buttonContainer.style.display = shouldShow ? 'flex' : 'none';
		};
		// hide the reset button setting's name/desc elements
		resetButton.nameEl.remove();
		resetButton.controlEl.addClass('chat-cbt-reset-button-control');
		// run this on initial settings load
		updateResetButtonVisibility(this.plugin.settings.prompt);
	}
}

class MarkdownTextModel extends Modal {
	text: string;
	component: Component;
	constructor(app: App, _text: string) {
		super(app);
		this.text = _text;
		this.component = new Component();
	}

	onOpen() {
		const { contentEl } = this;

		const markdownContainer = contentEl.createDiv('markdown-container');

		MarkdownRenderer.render(
			this.app,
			this.text,
			markdownContainer,
			'',
			this.component,
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
