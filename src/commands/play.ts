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
	
	/* Fetch the video on youtube */
	const track = await SpotifyGateway.getInstance().fetchTrack(interaction.options.get('title', true).value as string);
	const video = await search(track.name);
	const buffer = await download(video);

	/* Update the song queue */
	const player = MusicPlayer.getInstance();
	await player.addToQueue(Metadata.from(video, track), buffer);

	/* Connection to user's voice channel */
	await player.connectToChannel(interaction.member);

	interaction.reply(`Enjoy listening to ${track.name} by ${track.artists.at(0)?.name}`);
}
