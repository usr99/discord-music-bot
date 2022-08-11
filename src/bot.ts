import { ActivityType, Client, CommandInteraction } from "discord.js";
import config from "./config";
import * as commandModules from "./commands";
import MusicPlayer from "./MusicPlayer";
import { reply } from "./utils";
import { Video } from "youtube-sr";
import { Metadata } from "./types";

const commands = Object(commandModules);
const player = MusicPlayer.getInstance();
let lastInteraction: CommandInteraction | null = null;

function nextSongFollowUp(info: Metadata) {
	lastInteraction?.followUp(`Next song: ${info.title} by ${info.artist}`);
}

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
	player.event.on('trackChange', (info: Video) => {
		bot.user?.setActivity({
			type: ActivityType.Listening,
			name: info.title
		});
	});
	player.event.on('stop', () => {
		bot.user?.setActivity({
			type: ActivityType.Listening,
			name: 'rien de spécial'
		});
	});
});

bot.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) {
		return ;
	}

	try {
		const { commandName } = interaction;
		await commands[commandName].execute(interaction);

		if (commandName === 'play' || commandName === 'album' || commandName === 'youtube') {
			lastInteraction = interaction;
			player.event.off('trackChange', nextSongFollowUp); // remove any previous listener if any
			player.event.on('trackChange', nextSongFollowUp);
		}
	} catch (err) {
		if (err instanceof Error) {
			reply(interaction, err.message);
		} else {
			reply(interaction, 'Unexpected error, you may check logs for more information');
		}
	}
});

bot.login(config.DISCORD_TOKEN);
