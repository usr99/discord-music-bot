import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
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

	public async fetchTrack(query: string): Promise<TrackInfo> {
		const response = await this.search(query, 'track');
		return new TrackInfo(response);
	}

	public async fetchAlbum(query: string): Promise<AlbumInfo> {
		const response = await this.search(query, 'album');
		const info = new AlbumInfo(response);

		const tracks = await this.request<SpotifySearchResponse[]>({
				method: 'get',
				url: `https://api.spotify.com/v1/albums/${info.id}`
			},
			response => { return response.data.tracks.items; }
		);

		for (let track of tracks) {
			info.tracks.push(new TrackInfo(track));
		}
		return info;
	}

	public async fetchSuggestions(from: TrackInfo): Promise<TrackInfo[]> {
		const results = await this.request<SpotifySearchResponse[]>({
			method: 'get',
			url: 'https://api.spotify.com/v1/recommendations',
			params: { seed_tracks: from.id }},
			response => { return response.data.tracks; }
		);

		return results.map(item => {
			return new TrackInfo(item);
		});
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

	private async request<ApiResponseType>(config: AxiosRequestConfig, cb: (res: AxiosResponse<any, any>) => ApiResponseType) {
		let first_try = true;
		while (true) {
			if (!this.access_token) {
				this.access_token = await this.getAccessToken();
			}
			
			try {
				config.headers = { Authorization: `Bearer ${this.access_token}` };
				const response = await axios.request(config);
				return cb(response);
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
				throw new Error('Request to Spotify services failed');
			}
		}
	}

	private async search(query: string, type: string): Promise<SpotifySearchResponse> {
		return await this.request<SpotifySearchResponse>({
			method: 'get',
			url: 'https://api.spotify.com/v1/search',
			params: {
				q: query,
				type: type,
				limit: 1
			}},
			response => { return response.data[type + 's'].items.at(0); }
		);
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
