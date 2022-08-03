import { ActivityType, Client } from "discord.js";
import config from "./config";
import * as commandModules from "./commands";

const commands = Object(commandModules);

const bot = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
	presence: {
		activities: [{
			type: ActivityType.Listening,
			name: 'rien de spécial',
		}],
		afk: true
	}
});

bot.once("ready", () => {
	console.log(`Logged in as "${bot.user?.tag}"`);
});

bot.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) {
		return ;
	}

	const { commandName } = interaction;
	commands[commandName].execute(interaction);
});

bot.login(config.DISCORD_TOKEN);
