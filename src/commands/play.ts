import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import MusicPlayer from "../MusicPlayer";
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
	/* Fetch track info */
	const spotify = SpotifyGateway.getInstance();
	const info = await spotify.fetchTrack(interaction.options.get('title', true).value as string);
	
	/* Voice channel connection */
	const player = MusicPlayer.getInstance();
	if (!(interaction.member instanceof GuildMember)) {
		throw new Error('Failed to find your voice channel');
	}
	await player.connectToChannel(interaction.member);

	/* Play song */
	interaction.reply('Downloading track...');
	await player.addToQueue([info]);
}
