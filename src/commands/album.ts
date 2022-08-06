import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import MusicPlayer from "../MusicPlayer";
import SpotifyGateway from "../SpotifyGateway";

export const data = new SlashCommandBuilder()
	.setName("album")
	.setDescription("Add an entire album to the music queue")
	.addStringOption(option =>
		option
			.setName('title')
			.setDescription('Title of the album')
			.setRequired(true));

export async function execute(interaction: CommandInteraction) {
	if (!(interaction.member instanceof GuildMember)) {
		throw new Error('Failed to find your voice channel');
	}
	
	/* Fetch album */
	const spotify = SpotifyGateway.getInstance();
	const info = await spotify.fetchAlbum(interaction.options.get('title', true).value as string);
	interaction.reply(`Enjoy listening to ${info.title}`);

	/*
	** Download all tracks from album
	** connect to the channel after the first one is downloaded
	*/
	const player = MusicPlayer.getInstance();
	for (let i = 0; i < info.tracks.length; i++) {
		let track = await spotify.downloadTrack(info.tracks[i]);
		await player.addToQueue(track);
		if (i == 0) {
			await player.connectToChannel(interaction.member);
		}
	}
}
