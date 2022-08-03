import axios, { AxiosError } from "axios";
import config from "./config";
import { LogAxiosError } from "./utils";

async function GetAccessToken(): Promise<string> {
	let access_token = new Promise<string>((resolve, reject) => {
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
				reject('Failed to get an access token from Spotify API');
			}
			resolve(response.data.access_token);
		})
		.catch((err: Error | AxiosError) => {
			LogAxiosError(err);
			reject('Failed to get an access token from Spotify API');
		});
	});
	return access_token;
}

export { GetAccessToken };
