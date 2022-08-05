import axios, { AxiosError } from "axios";
import config from "./config";
import { LogAxiosError } from "./utils";

export class TrackInfo {
	public constructor(info: any ) {
		this.id = info.id;
		this.title = info.name;
		this.duration = info.duration_ms;
		this.url = info.external_urls.spotify;
		this.artists = [];
		for (let artist of info.artists) {
			this.artists.push(artist.name);
		}
	}

	public id: string;
	public title: string;
	public artists: string[];
	public duration: number;
	public url: string;
}

export default class SpotifyGateway {
	private constructor() {
		this.access_token = null;
		this.getAccessToken().then(token => this.access_token = token);
	}

	public async fetchTrack(query: string): Promise<TrackInfo> {
		let first_try = true;
		while (true) {
			if (!this.access_token) {
				this.access_token = await this.getAccessToken();
			}
			
			try {
				const response = await axios.get('https://api.spotify.com/v1/search', {
					params: {
						q: query,
						type: 'track',
						limit: 1
					},
					headers: {
						Authorization: `Bearer ${this.access_token}`,
						'Content-Type': 'application/json'
					}
				});
				return new TrackInfo(response.data.tracks.items.at(0));
			} catch (err) {
				const error = err as AxiosError;
				LogAxiosError(error);
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
				throw new Error('Search request failed');
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
			LogAxiosError(err as AxiosError);
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
