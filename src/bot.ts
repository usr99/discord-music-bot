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

	try {
		const { commandName } = interaction;
		await commands[commandName].execute(interaction);
	} catch (err) {
		if (err instanceof Error) {
			interaction.reply(err.message);
		} else {
			interaction.reply('Unexpected error, you may check logs for more information');
		}
	}
});

bot.login(config.DISCORD_TOKEN);
