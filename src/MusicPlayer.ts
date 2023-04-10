import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { CommandInteraction, GuildMember } from "discord.js";
import EventEmitter from "events";
import { Readable } from "stream";
import { Metadata } from "./types";
import { logError } from "./utils";

export default class MusicPlayer {
	private queue: AudioResource<Metadata>[];
	private player: AudioPlayer;
	private guildId: string | null;
	private eventHandler: EventEmitter;
	private autoplay: boolean;

	private constructor() {
		this.queue = [];
		this.player = createAudioPlayer();
		this.guildId = null;
		this.eventHandler = new EventEmitter;
		this.autoplay = false;

		this.player.on(AudioPlayerStatus.Idle, async () => {
			const last = this.queue.shift();

			if (this.queue.length === 0) {
				if (this.autoplay) {

				} else {
					entersState(this.player, AudioPlayerStatus.Buffering, 10e3)
					.catch(() => { this.stop(); });
				}

				// fetch
				// download
				// add to queue
			} else {
				// console.log('auto next');
				// console.log(`queue: ${this.queue.length} tracks`);
	
				this.next();
			}
		});
		this.player.on('error', err => {
			console.error('ABORTED ECONNRESET');
			console.error(err.name);
			console.error(err.message);
			console.error(err.resource);
		});
	}

	public async addToQueue(info: Metadata, buffer: Readable) {
		this.queue.push(createAudioResource(buffer, { metadata: info }));

		const status = this.player.state.status;
		if (status === AudioPlayerStatus.Idle || status === AudioPlayerStatus.AutoPaused) {
			await this.next();
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
				logError(error as Error);
				throw new Error('Failed to establish a voice connection');
			}
		}
	}

	public async next(forceNextSong: boolean = false) {
		if (forceNextSong) {
			this.queue.shift();
		}

		const music = this.queue.at(0);
		if (music) {
			this.player.play(music);
			try {
				await entersState(this.player, AudioPlayerStatus.Playing, 5e3);
				this.eventHandler.emit('trackChange', music.metadata, this.queue.length);
			} catch(error) {
				this.stop();
				logError(error as Error);
				throw new Error(`Failed to play ${music.metadata.title}`);
			}
		} else {
			this.stop();
		}
	}

	public clear() {
		this.queue = [];
	}

	public togglePause() {
		if (this.player.state.status === AudioPlayerStatus.Playing) {
			this.player.pause();
			return true;
		} else if (this.player.state.status === AudioPlayerStatus.Paused) {
			this.player.unpause();
			return false;
		} else {
			throw new Error('There is no music playing');
		}
	}

	public stop() {
		this.eventHandler.emit('stop');
		this.player.stop();
		if (this.guildId) {
			getVoiceConnection(this.guildId)?.destroy();
			this.guildId = null;
		}
	}

	public get event() {
		return this.eventHandler;
	}

	public static getInstance(): MusicPlayer {
		if (!MusicPlayer.instance) {
			MusicPlayer.instance = new MusicPlayer();
		}
		return MusicPlayer.instance;
	}
	private static instance: MusicPlayer;
}
