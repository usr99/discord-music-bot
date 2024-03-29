import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import YouTube from "youtube-sr";
import ytdl from "ytdl-core";
import MusicPlayer from "../MusicPlayer";
import SpotifyGateway from "../SpotifyGateway";
import { Metadata } from "../types";
import { download, search } from "../utils";
import { AddMusicEmbed } from "../embeds";

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

	/* Fetch the video on youtube */
	const query = interaction.options.get('title', true).value as string;
	const video = await search(query);
	if (!video) {
		throw new Error('Video not found');
	}
	const buffer = await download(video);

	/* Connection to user's voice channel */
	const player = MusicPlayer.getInstance();
	await player.connectToChannel(interaction.member);

	/* Update the song queue */
	const info = Metadata.from(video, undefined);
	await interaction.followUp(new AddMusicEmbed(info).toMessage());
	await player.addToQueue(info, buffer);
}
