import axios, { AxiosError } from "axios";
import { CommandInteraction, MessagePayload } from "discord.js";

function logError(error: Error | AxiosError) {
	const GetStringTimestamp = () => {
		let now = new Date();
		return `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`;
	}
	
	if (axios.isAxiosError(error)) {
		if (!error.response) {
			console.groupCollapsed(`${GetStringTimestamp()} Unexpected AxiosError`);
			console.error(error);
			console.groupEnd();
		} else {
			const { status, statusText, request, data } = error.response;
			console.groupCollapsed(`${GetStringTimestamp()} Request failed with status ${status} ${statusText}`);
			console.error(`path: ${request.path}`);
			if (typeof(data) === 'object') {
				console.error(`message: ${JSON.stringify(data)}`);
			} else {
				console.error(`message: ${data}`);
			}
			console.groupEnd();
		}
	} else {
		console.groupCollapsed(`${GetStringTimestamp()} Unexpected error`);
		console.error(error);
		console.groupEnd();
	}
}

function reply(interaction: CommandInteraction, message: string | MessagePayload) {
	if (interaction.replied) {
		interaction.reply(message);
	} else {
		interaction.followUp(message);
	}
}

export { logError, reply };
