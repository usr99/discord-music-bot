import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import MusicPlayer from "../MusicPlayer";

export const data = new SlashCommandBuilder()
	.setName("pause")
	.setDescription("Pauses the current song or resumes it if already paused")

export async function execute(interaction: CommandInteraction) {
	const player = MusicPlayer.getInstance();
	const isPaused = player.togglePause();
	await interaction.followUp(
		isPaused ?
		':pause_button: Music paused' :
		':arrow_forward: Music resumed'
	);
}
