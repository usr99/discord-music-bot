import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import MusicPlayer from "../MusicPlayer";

export const data = new SlashCommandBuilder()
	.setName("next")
	.setDescription("Play the next song in queue")

export async function execute(interaction: CommandInteraction) {
	await MusicPlayer.getInstance().next(true);
	await interaction.reply({
		content: "I hope the next song will be more to your liking :)",
		ephemeral: true
	});
}
