import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import MusicPlayer from "../MusicPlayer";

export const data = new SlashCommandBuilder()
	.setName("stop")
	.setDescription("Leave your channel and clear the queue")

export async function execute(interaction: CommandInteraction) {
	const player = MusicPlayer.getInstance();
	player.clear();
	player.stop();
	interaction.reply('Leaving your channel and clearing the queue... :wave:');
}
