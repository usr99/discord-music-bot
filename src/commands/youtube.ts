import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import MusicPlayer from "../MusicPlayer";
import YoutubeGateway from "../YoutubeGateway";

export const data = new SlashCommandBuilder()
	.setName("youtube")
	.setDescription("Add a youtube video to the music queue")
	.addStringOption(option =>
		option
			.setName('title')
			.setDescription('Title of the video')
			.setRequired(true));

export async function execute(interaction: CommandInteraction) {
	if (!(interaction.member instanceof GuildMember)) {
		throw new Error('Failed to find your voice channel');
	}
	
	/* Fetch track */
	const youtube = YoutubeGateway.getInstance();
	const info = await youtube.fetchVideo(interaction.options.get('title', true).value as string);
	interaction.deferReply();

	/* Update the song queue */
	const video = await youtube.downloadVideo(info);
	const player = MusicPlayer.getInstance();
	await player.addToQueue(video);
	interaction.followUp(`Enjoy listening to ${info.title}`);

	/* Voice channel connection */
	await player.connectToChannel(interaction.member);
}
