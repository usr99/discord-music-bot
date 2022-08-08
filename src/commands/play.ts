import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import MusicPlayer from "../MusicPlayer";
import SpotifyGateway from "../SpotifyGateway";
import { TrackInfo } from "../types";

export const data = new SlashCommandBuilder()
	.setName("play")
	.setDescription("Add a song to the music queue")
	.addStringOption(option =>
		option
			.setName('title')
			.setDescription('Title of the song')
			.setRequired(true));

export async function execute(interaction: CommandInteraction) {
	if (!(interaction.member instanceof GuildMember)) {
		throw new Error('Failed to find your voice channel');
	}
	
	/* Fetch track */
	const spotify = SpotifyGateway.getInstance();
	const info = await spotify.fetchTrack(interaction.options.get('title', true).value as string);
	await interaction.deferReply();

	/* Update the song queue */
	const track = await spotify.downloadTrack(info);
	const player = MusicPlayer.getInstance();
	await player.addToQueue(track);
	interaction.followUp(`Enjoy listening to ${info.title}`);

	/* Voice channel connection */
	await player.connectToChannel(interaction.member);
}
