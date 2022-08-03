import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import SpotifyGateway from "../SpotifyGateway";

export const data = new SlashCommandBuilder()
	.setName("play")
	.setDescription("Add a song to the music queue")
	.addStringOption(option =>
		option
			.setName('title')
			.setDescription('Title of the song')
			.setRequired(true));

export async function execute(interaction: CommandInteraction) {
	const spotify = SpotifyGateway.getInstance();
	
	spotify.fetchTrack(interaction.options.get('title', true).value as string)
		.then(info => interaction.reply(JSON.stringify(info)))
		.catch(err => interaction.reply(err));

	// download stream
	// add to queue
}
