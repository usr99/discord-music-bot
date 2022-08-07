import axios, { AxiosError } from "axios";
import Spotify from "spotifydl-core/dist";
import SpotifyFetcher from "spotifydl-core/dist/Spotify";
import { Readable } from "stream";
import config from "./config";
import { AlbumInfo, SpotifySearchResponse, Track, TrackInfo } from "./types";
import { logError } from "./utils";

export default class SpotifyGateway {
	private constructor() {
		this.downloader = new Spotify({
			clientId: config.SPOTIFY_CLIENT_ID,
			clientSecret: config.SPOTIFY_CLIENT_SECRET
		});
		this.access_token = null;
	}

	public async downloadTrack(info: TrackInfo): Promise<Track> {
		try {
			const buffer = await this.downloader.downloadTrack(info.url);
			return { buffer: Readable.from(buffer), info };
		} catch(err) {
			logError(err as AxiosError);
			throw new Error(`Failed to download ${info.title}`);
		}
	}

	public async fetchTrack(query: string): Promise<TrackInfo> {
		const response = await this.search(query, 'track');
		return new TrackInfo(response);
	}

	public async fetchAlbum(query: string): Promise<AlbumInfo> {
		const response = await this.search(query, 'album');
		const info = new AlbumInfo(response);

		try {
			const response = await axios.get(`https://api.spotify.com/v1/albums/${info.id}`, {
				headers: { Authorization: `Bearer ${this.access_token}` }
			});

			const tracks: SpotifySearchResponse[] = response.data.tracks.items;
			for (let track of tracks) {
				info.tracks.push(new TrackInfo(track));
			}
		} catch(error) {
			logError(error as AxiosError);
			throw new Error('Failed to fetch album items');
		}
		return info;
	}

	private async search(query: string, type: string): Promise<SpotifySearchResponse> {
		let first_try = true;
		while (true) {
			if (!this.access_token) {
				this.access_token = await this.getAccessToken();
			}
			
			try {
				const response = await axios.get('https://api.spotify.com/v1/search', {
					params: {
						q: query,
						type: type,
						limit: 1
					},
					headers: {
						Authorization: `Bearer ${this.access_token}`,
						'Content-Type': 'application/json'
					}
				});
				return response.data[type + 's'].items.at(0);
			} catch (err) {
				const error = err as AxiosError;
				logError(error);
				if (error.response) {
					if (error.response.status === 401) {
						if (!first_try) {
							throw new Error('Failure when attempting to connect to Spotify');
						}
						first_try = false;
						this.access_token = null;
						continue ;
					} else if (error.response.status === 429) {
						throw new Error('Rate limit exceeded');
					}
				}
				throw new Error('Search request to Spotify services failed');
			}
		}
	}

	private async getAccessToken(): Promise<string> {
		try {
			const auth_string = Buffer.from(config.SPOTIFY_CLIENT_ID + ':' + config.SPOTIFY_CLIENT_SECRET).toString('base64');
			const response = await axios.request({
				method: 'post',
				url: 'https://accounts.spotify.com/api/token',
				headers: {
					Authorization: `Basic ${auth_string}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				data: 'grant_type=client_credentials'
			});
			if (!response.data.access_token) {
				throw new Error('Failure when attempting to connect to Spotify');
			}
			return response.data.access_token;
		} catch(err) {
			logError(err as AxiosError);
			throw new Error('Failure when attempting to connect to Spotify');
		}
	}

	private downloader: SpotifyFetcher;
	private access_token: string | null;

	public static getInstance(): SpotifyGateway {
		if (!SpotifyGateway.instance) {
			SpotifyGateway.instance = new SpotifyGateway();
		}
		return SpotifyGateway.instance;
	}
	private static instance: SpotifyGateway;
}
