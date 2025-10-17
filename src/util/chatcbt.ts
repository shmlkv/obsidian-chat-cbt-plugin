import { requestUrl } from 'obsidian';
import summaryPrompt from '../prompts/summary';
import {
	OPENROUTER_DEFAULT_MODEL,
	AI_PROVIDERS,
} from '../constants';
import { Notice } from 'obsidian';

const defaultPromptPrefix = (lang: string) =>
	`Respond to the user in ${lang}.\n`;

export interface Message {
	role: string;
	content: string;
}

export type Mode = AI_PROVIDERS;
export interface ChatInput {
	openRouterApiKey: string | undefined;
	messages: Message[];
	isSummary: boolean | undefined;
	mode: Mode;
	model: string | undefined;
	language: string;
	prompt: string;
}

export class ChatCbt {
	constructor() {}

	async chat({
		openRouterApiKey,
		messages,
		isSummary = false,
		mode = AI_PROVIDERS.OPENROUTER,
		model,
		language,
		prompt,
	}: ChatInput): Promise<string> {
		if (!model) {
			new Notice('Please select a model from the settings');
		}

		const SYSTEM_MSG = {
			role: 'system',
			content: defaultPromptPrefix(language) + prompt,
		};
		const SUMMARY_MSG = { role: 'user', content: summaryPrompt(language) };

		const resolvedMsgs = [...messages];

		if (isSummary) {
			resolvedMsgs.push(SUMMARY_MSG);
		}

		let response = '';

		const msgs = [SYSTEM_MSG, ...resolvedMsgs];

		if (mode === AI_PROVIDERS.OPENROUTER && !!openRouterApiKey) {
			const url = 'https://openrouter.ai/api/v1/chat/completions';
			console.log('[ChatCBT] Making request to OpenRouter with model:', model || OPENROUTER_DEFAULT_MODEL);
			response = await this._chat(
				url,
				msgs,
				openRouterApiKey,
				model || OPENROUTER_DEFAULT_MODEL,
			);
			console.log('[ChatCBT] Received response from OpenRouter');
		}

		return response;
	}

	async _chat(
		url: string,
		messages: Message[],
		apiKey: string,
		model: string | undefined,
	): Promise<string> {
		const data = {
			model,
			messages,
			temperature: 0.7,
		};

		const headers: Record<string, string> = {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		};

		// Add OpenRouter-specific headers
		if (url.includes('openrouter.ai')) {
			headers['HTTP-Referer'] = 'https://github.com/clairefro/obsidian-chat-cbt-plugin';
			headers['X-Title'] = 'ChatCBT Obsidian Plugin';
		}

		const options = {
			url,
			method: 'POST',
			body: JSON.stringify(data),
			headers,
		};

		try {
			const response: {
				json: {
					choices: { message: { content: string } }[];
					error?: { message: string; code: string };
				};
			} = await requestUrl(options);

			// Check for API errors in response
			if (response.json.error) {
				throw new Error(`API Error: ${response.json.error.message || 'Unknown error'}`);
			}

			if (!response.json.choices || response.json.choices.length === 0) {
				throw new Error('No response from API');
			}

			return response.json.choices[0].message.content;
		} catch (error: any) {
			// Enhance error message for common issues
			if (error.status === 401) {
				throw new Error('Invalid API key. Please check your OpenRouter API key in settings.');
			} else if (error.status === 403) {
				throw new Error('Access forbidden. Please verify your OpenRouter API key has proper permissions.');
			} else if (error.status === 404) {
				throw new Error(`Model '${model}' not found. Please check the model name in settings.`);
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please try again later.');
			} else if (error.status >= 500) {
				throw new Error('OpenRouter service error. Please try again later.');
			}
			throw error;
		}
	}
}
