import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { AxiosError } from "axios";
import { GuildMember } from "discord.js";
import { Track } from "./SpotifyGateway";
import { LogError } from "./utils";

export default class MusicPlayer {
	private queue: Track[];
	private player: AudioPlayer;
	private guildId: string | null;

	private constructor() {
		this.queue = [];
		this.player = createAudioPlayer();
		this.guildId = null;
	}

	public async addToQueue(tracks: TrackInfo[]) {
		for (let info of tracks) {
			try {
				///////////////////////////////////////////////////
				const spotify = new Spotify({
					clientId: config.SPOTIFY_CLIENT_ID,
					clientSecret: config.SPOTIFY_CLIENT_SECRET
				});
				///////////////////////////////////////////////////
				const buffer = await spotify.downloadTrack(info.url);
				const audio = createAudioResource(Readable.from(buffer));
				this.queue.push({ audio, info });
			} catch(err) {
				LogAxiosError(err as AxiosError);
				throw new Error(`Failed to download ${info.title}. Previous tracks, if any, were added to queue anyway.`);
			}
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
		// this.client.setActivity({
			// type: ActivityTypes.LISTENING,
			// name: 'rien de spécial'
		// });

		this.clear();
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
