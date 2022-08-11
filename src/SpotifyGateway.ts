import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import config from "./config";
import { SpotifyAlbum, SpotifyTrack } from "./types";
import { logError } from "./utils";

export default class SpotifyGateway {
	private constructor() {
		this.access_token = null;
	}

	public fetchTrack(query: string): Promise<SpotifyTrack> {
		return this.request<SpotifyTrack>({
			method: 'get',
			url: 'https://api.spotify.com/v1/search',
			params: {
				q: query,
				type: 'track',
				limit: 1
			}},
			response => { return response.data.tracks.items.at(0); }
		);
	}

	public async fetchAlbum(query: string): Promise<SpotifyAlbum> {
		const album = await this.request<SpotifyAlbum>({
			method: 'get',
			url: 'https://api.spotify.com/v1/search',
			params: {
				q: query,
				type: 'album',
				limit: 1
			}},
			response => { return response.data.albums.items.at(0); }
		);

		album.tracks = await this.request<SpotifyTrack[]>({
				method: 'get',
				url: `https://api.spotify.com/v1/albums/${album.id}`
			},
			response => { return response.data.tracks.items; }
		);
		return album;
	}

	// public async fetchSuggestions(from: TrackInfo): Promise<TrackInfo[]> {
	// 	const results = await this.request<SpotifySearchResponse[]>({
	// 		method: 'get',
	// 		url: 'https://api.spotify.com/v1/recommendations',
	// 		params: { seed_tracks: from.id }},
	// 		response => { return response.data.tracks; }
	// 	);

	// 	return results.map(item => {
	// 		return new TrackInfo(item);
	// 	});
	// }

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

	private access_token: string | null;

	public static getInstance(): SpotifyGateway {
		if (!SpotifyGateway.instance) {
			SpotifyGateway.instance = new SpotifyGateway();
		}
		return SpotifyGateway.instance;
	}
	private static instance: SpotifyGateway;
}
