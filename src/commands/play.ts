import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { GetAccessToken } from "../api";

export const data = new SlashCommandBuilder()
	.setName("play")
	.setDescription("Play the requested song in your channel");

export async function execute(interaction: CommandInteraction) {
	GetAccessToken()
		.then(token => interaction.reply(token))
		.catch(message => interaction.reply(message));
}
