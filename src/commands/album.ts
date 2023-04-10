import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { Readable } from "stream";
import { Video } from "youtube-sr";
import MusicPlayer from "../MusicPlayer";
import SpotifyGateway from "../SpotifyGateway";
import { Metadata } from "../types";
import { download, search } from "../utils";
import { AddAlbumEmbed } from "../embeds";

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
	
	/* Fetch album from Spotify API */
	const spotify = SpotifyGateway.getInstance();
	const album = await spotify.fetchAlbum(interaction.options.get('title', true).value as string);
	if (!album) {
		throw new Error('Album not found');
	}

	/* Download all tracks from album */
	let musics: { video: Video, buffer: Promise<Readable> }[] = [];
	for (let track of album.tracks) {
		const video = await search(`${track.name} ${track.artists[0].name}`);
		musics.push({ video, buffer: download(video) });
	}

	/* Connection to user's voice channel */
	const player = MusicPlayer.getInstance();
	await player.connectToChannel(interaction.member);

	/* Update the song queue */
	await interaction.followUp(new AddAlbumEmbed(album).toMessage());
	for (let i = 0; i < musics.length; i++) {
		player.addToQueue(
			Metadata.from(musics[i].video, album.tracks[i]),
			await musics[i].buffer
		);
	}
}
