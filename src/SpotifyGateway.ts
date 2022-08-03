import axios, { AxiosError } from "axios";
import config from "./config";
import { LogAxiosError } from "./utils";

class TrackInfo {
	public constructor(info: { id: string, name: string, duration_ms: number, artists: any[] }) {
		this.id = info.id;
		this.name = info.name;
		this.duration = info.duration_ms;
		this.artists = [];
		for (let artist of info.artists) {
			this.artists.push(artist.name);
		}
	}

	public id: string;
	public name: string;
	public artists: string[];
	public duration: number;
}

export default class SpotifyGateway {
	private constructor() {
		this.access_token = 'BQDMT5X9J_lb52xf3bD1FQVt8-Ym1M95oeEj3q6VgHNPvWY3-k_vul-cpgTI_rOFeZ3knCDcJSAdaPNz6PkeoJ0O5xu4jd8IFyWTLyFecSmA8rbpF6o';
		// this.getAccessToken().then(token => this.access_token = token);
	}

	public async fetchTrack(query: string): Promise<TrackInfo> {
		return new Promise<TrackInfo>(async (resolve, reject) => {
			
			if (!this.access_token) {
				try {
					this.access_token = await this.getAccessToken();
				} catch {
					reject('Failed to get an access token from Spotify API');
				}
			}
			
			axios.get('https://api.spotify.com/v1/search', {
				params: {
					q: query,
					type: 'track',
					limit: 1
				},
				headers: {
					Authorization: `Bearer ${this.access_token}`,
					'Content-Type': 'application/json'
				}
			})
			.then(response => {
				resolve(new TrackInfo(response.data.tracks.items.at(0)));
			})
			.catch(err => {
				LogAxiosError(err);

				// check for expired token

				reject('failed to fetch track');
			});
		});
	}

	private async getAccessToken(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const auth_string = Buffer.from(config.SPOTIFY_CLIENT_ID + ':' + config.SPOTIFY_CLIENT_SECRET).toString('base64');
			axios.request({
				method: 'post',
				url: 'https://accounts.spotify.com/api/token',
				headers: {
					Authorization: `Basic ${auth_string}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				data: 'grant_type=client_credentials'
			})
			.then(response => {
				if (!response.data.access_token) {
					reject();
				}
				resolve(response.data.access_token);
			})
			.catch((err: Error | AxiosError) => {
				LogAxiosError(err);
				reject();
			});
		});
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
