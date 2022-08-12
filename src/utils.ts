import axios, { AxiosError } from "axios";
import { CommandInteraction, MessagePayload } from "discord.js";
import { Readable } from "stream";
import YouTube, { Video } from "youtube-sr";
import ytdl from "ytdl-core";

async function search(query: string): Promise<Video> {
	const results = await YouTube.search(query, { limit: 1, type: 'video' });
	if (results.length < 1) {
		throw new Error('Video not found');
	}
	return results[0];
}

async function download(video: Video): Promise<Readable> {
	return await ytdl(video.url, { filter: 'audioonly' });
}

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

async function reply(interaction: CommandInteraction, message: string | MessagePayload) {
	if (!interaction.replied) {
		await interaction.reply(message);
	} else {
		await interaction.followUp(message);
	}
}

export { search, download, logError, reply };
