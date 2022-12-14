import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import config from "./config";
import * as commandModules from "./commands";
import { SlashCommandBuilder } from "discord.js";

type Command = {
	data: Omit<SlashCommandBuilder, any>
}

const commands: Omit<SlashCommandBuilder, any>[] = [];
for (const module of Object.values<Command>(commandModules)) {
	commands.push(module.data);
}

const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);
rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: commands })
	.then(() => { console.log("Successfully registerd application commands."); })
	.catch(console.error);