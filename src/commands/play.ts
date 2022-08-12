import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import YouTube from "youtube-sr";
import ytdl from "ytdl-core";
import MusicPlayer from "../MusicPlayer";
import SpotifyGateway from "../SpotifyGateway";
import { Metadata } from "../types";
import { download, search } from "../utils";

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
	await interaction.deferReply();

	/* Fetch the video on youtube */
	const query = interaction.options.get('title', true).value as string;
	const track = await SpotifyGateway.getInstance().fetchTrack(query);
	const video = await search(track ? track.name : query);
	if (!video) {
		throw new Error('Video not found');
	}
	const buffer = await download(video);

	/* Update the song queue */
	const player = MusicPlayer.getInstance();
	const info = Metadata.from(video, track);
	await player.addToQueue(info, buffer);

	/* Connection to user's voice channel */
	await player.connectToChannel(interaction.member);

	await interaction.followUp(`Enjoy listening to ${info.title} by ${info.artist}`);
}
