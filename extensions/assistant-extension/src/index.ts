import { Assistant, AssistantExtension, fs, joinPath } from '@janhq/core'
export default class SalesboxAIAssistantExtension extends AssistantExtension {
	async onLoad() {
		if (!(await fs.existsSync('file://assistants'))) {
			await fs.mkdir('file://assistants')
		}
		const assistants = await this.getAssistants()
		if (assistants.length === 0) {
			await this.createAssistant(this.defaultAssistant)
		}
	}

	/**
	 * Called when the extension is unloaded.
	 */
	onUnload(): void {}

	async getAssistants(): Promise<Assistant[]> {
		if (!(await fs.existsSync('file://assistants')))
			return [this.defaultAssistant]
		const assistants = await fs.readdirSync('file://assistants')
		const assistantsData: Assistant[] = []
		for (const assistant of assistants) {
			const assistantPath = await joinPath([
				'file://assistants',
				assistant,
				'assistant.json',
			])
			if (!(await fs.existsSync(assistantPath))) {
				console.warn(`Assistant file not found: ${assistantPath}`)
				continue
			}
			try {
				const assistantData = JSON.parse(await fs.readFileSync(assistantPath))
				assistantsData.push(assistantData as Assistant)
			} catch (error) {
				console.error(`Failed to read assistant ${assistant}:`, error)
			}
		}
		return assistantsData
	}

	async createAssistant(assistant: Assistant): Promise<void> {
		const assistantPath = await joinPath([
			'file://assistants',
			assistant.id,
			'assistant.json',
		])
		const assistantFolder = await joinPath(['file://assistants', assistant.id])
		if (!(await fs.existsSync(assistantFolder))) {
			await fs.mkdir(assistantFolder)
		}
		await fs.writeFileSync(assistantPath, JSON.stringify(assistant, null, 2))
	}

	async deleteAssistant(assistant: Assistant): Promise<void> {
		const assistantPath = await joinPath([
			'file://assistants',
			assistant.id,
			'assistant.json',
		])
		if (await fs.existsSync(assistantPath)) {
			await fs.rm(assistantPath)
		}
	}

	private defaultAssistant: Assistant = {
		avatar: '/images/assistants/salesboxai.svg',
		thread_location: undefined,
		id: 'salesbox-ai-agent',
		object: 'assistant',
		created_at: Date.now() / 1000,
		name: 'Salesbox.AI Agent',
		description:
			"Salesbox.AI Agent is a helpful desktop assistant that can reason through complex tasks and use tools to complete them on the user's behalf.",
		model: '*',
		instructions:
			'You are a helpful AI assistant. Your primary goal is to assist users with tasks to the best of your abilities and tools.\n\nWhen responding:\n- Answer directly from your knowledge when you can\n- Be concise, clear, and helpful\n- Admit when you\'re unsure rather than making things up\n\n- Use tools when it would help answer what the user asks (e.g., "find...", "verify...", "enrich...")\n\nWhen using tools:\n- Use web search only if reasonably certain it would find a useful result\n- Use one tool at a time and wait for results before proceeding to the next tool\n- Use actual values as arguments, not variable names\n- Learn from each result before deciding next steps\n- Avoid repeating the same tool call with identical parameters\n\nCurrent date: {{current_date}}\n\n# User Context\n\nYou have access to the following business context about the user. Use this information to provide more relevant and personalized assistance:\n\n{{user_context}}',
		tools: [
			{
				type: 'retrieval',
				enabled: false,
				useTimeWeightedRetriever: false,
				settings: {
					top_k: 2,
					chunk_size: 1024,
					chunk_overlap: 64,
					retrieval_template: `Use the following pieces of context to answer the question at the end.
----------------
CONTEXT: {CONTEXT}
----------------
QUESTION: {QUESTION}
----------------
Helpful Answer:`,
				},
			},
		],
		file_ids: [],
		metadata: undefined,
	}
}
