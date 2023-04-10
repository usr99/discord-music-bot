import { ActivityType, Client, CommandInteraction } from "discord.js";
import config from "./config";
import * as commandModules from "./commands";
import MusicPlayer from "./MusicPlayer";
import { logError, reply } from "./utils";
import { Video } from "youtube-sr";
import { Metadata } from "./types";
import { NowPlayingEmbed } from "./embeds";

const commands = Object(commandModules);
const player = MusicPlayer.getInstance();
let lastInteraction: CommandInteraction | null = null;

function nextSongFollowUp(music: Metadata, queue: number) {
	lastInteraction?.followUp(new NowPlayingEmbed({music, queue}).toMessage())
		.catch(error => logError(error));
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
		if (commandName === 'play' || commandName === 'album') {
			lastInteraction = interaction;
			player.event.off('trackChange', nextSongFollowUp); // remove any previous listener if any
			player.event.on('trackChange', nextSongFollowUp);
		}
		await interaction.deferReply();
		await commands[commandName].execute(interaction);
	} catch (err) {
		try {
			if (err instanceof Error) {
				await interaction.followUp(err.message);
			} else {
				await interaction.followUp('Unexpected error, you may check logs for more information');
			}
		} catch (err) {
			logError(err as Error);
		}
	}
});

bot.login(config.DISCORD_TOKEN);
