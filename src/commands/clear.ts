import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import MusicPlayer from "../MusicPlayer";

export const data = new SlashCommandBuilder()
	.setName("clear")
	.setDescription("Clear the queue")

export async function execute(interaction: CommandInteraction) {
	const player = MusicPlayer.getInstance();
	player.clear();
	interaction.reply(':put_litter_in_its_place: Clearing the queue...');
}
