import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { AxiosError } from "axios";
import { GuildMember } from "discord.js";
import EventEmitter from "events";
import { Track } from "./SpotifyGateway";
import { LogError } from "./utils";

export default class MusicPlayer {
	private queue: Track[];
	private player: AudioPlayer;
	private guildId: string | null;
	private eventHandler: EventEmitter;

	private constructor() {
		this.queue = [];
		this.player = createAudioPlayer();
		this.guildId = null;
		this.eventHandler = new EventEmitter;

		this.player.on(AudioPlayerStatus.Idle, async () => {
			this.queue.shift();
			this.next();
		});
	}

	public on(event: string, cb: (...args: any[]) => void) {
		this.eventHandler.on(event, cb);
	}

	public async addToQueue(tracks: Track[]) {
		this.queue.push(...tracks);
		if (this.player.state.status === AudioPlayerStatus.Idle) {
			this.next();
		}
	}
	
	public async connectToChannel(user: GuildMember) {
		const channel = user.voice.channel;
		if (!channel) {
			throw new Error('You must be in a voice channel');
		}

		this.guildId = channel.guild.id;
		let connection = getVoiceConnection(this.guildId);
		if (!connection) {
			connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: this.guildId,
				adapterCreator: channel.guild.voiceAdapterCreator
			});
			
			try {
				await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
				connection.subscribe(this.player);
			} catch (error) {
				this.stop();
				LogError(error as AxiosError);
				throw new Error('Failed to establish a voice connection');
			}
		}
	}

	public async next() {
		const track = this.queue.at(0);
		if (track) {
			const audio = createAudioResource(track.buffer);
			this.player.play(audio);
			try {
				await entersState(this.player, AudioPlayerStatus.Playing, 5e3);
				this.eventHandler.emit('trackChange', track.info.title);
			} catch {
				this.stop();
				throw new Error(`Failed to play ${track.info.title}`);
			}
		} else {
			this.stop();
		}
	}

	public clear() {
		this.queue = [];
	}

	public stop() {
		this.eventHandler.emit('trackChange', 'rien de spécial');
		this.player.stop();
		if (this.guildId) {
			getVoiceConnection(this.guildId)?.destroy();
			this.guildId = null;
		}
	}

	public static getInstance(): MusicPlayer {
		if (!MusicPlayer.instance) {
			MusicPlayer.instance = new MusicPlayer();
		}
		return MusicPlayer.instance;
	}
	private static instance: MusicPlayer;
}
