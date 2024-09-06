import type { Handler } from '@netlify/functions';
import {parse} from 'querystring';
import {slackApi, verifySlackRequest} from "./util/slack";

export async function handleSlashCommand(payload : SlackSlashCommandPayload){
	console.log(payload.command)
	switch (payload.command){
		case '/foodfight' :
			const response = await slackApi("chat.postMessage", {
				channel : payload.channel_id,
				text : 'Italian Food is delicious!!!'
			})
			if(!response.ok){
				return {
					statusCode : 500,
					body : 'No se puedo enviar el mensaje al chat' // lo que el que envia el mensaje ve
				}
			}
			return {
				statusCode : 200,
				body : '' // lo que el que envia el mensaje ve
			}
		default :
			return {
				statusCode : 200,
				body : `Command ${payload.command} is not recognized`
			}
	}
}

export const handler: Handler = async (event) => {
	// TODO validate the Slack request
	const valid = verifySlackRequest(event);

	if(!valid){
		console.error('Invalid request');

		return {
			statusCode : 400,
			body : 'invalid request'
		}
	}
	// TODO handle slash commands
	const body = parse(event.body || '') as SlackPayload;

	if(body.command){
		return handleSlashCommand(body as SlackSlashCommandPayload);
	}

	// TODO handle interactivity (e.g. context commands, modals)

	return {
		statusCode: 200,
		body: 'TODO: handle Slack commands and interactivity',
	};
};
