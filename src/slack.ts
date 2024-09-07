import type { Handler } from '@netlify/functions';
import {parse} from 'querystring';
import {slackApi, verifySlackRequest, modal, blocks, handleInteractivity} from "./util/slack";

export async function handleSlashCommand(payload : SlackSlashCommandPayload){
	switch (payload.command){
		case '/foodfight' :
			const response = await slackApi(
				'views.open',
				modal({
					id: 'foodfight-modal',
					title: 'Start a food fight!',
					trigger_id: payload.trigger_id,
					blocks: [
						blocks.section({
							text: 'The discourse demands food drama! *Send in your spiciest food takes so we can all argue about them and feel alive.*',
						}),
						blocks.input({
							id: 'opinion',
							label: 'Deposit your controversial food opinions here.',
							placeholder:
								'Example: peanut butter and mayonnaise sandwiches are delicious!',
							initial_value: payload.text ?? '',
							hint: 'What do you believe about food that people find appalling? Say it with your chest!',
						}),
						blocks.select({
							id: 'spice_level',
							label: 'How spicy is this opinion?',
							placeholder: 'Select a spice level',
							options: [
								{ label: 'mild', value: 'mild' },
								{ label: 'medium', value: 'medium' },
								{ label: 'spicy', value: 'spicy' },
								{ label: 'nuclear', value: 'nuclear' },
							],
						}),
					],
				}),
			);

			if(!response.ok){
				console.log(response)
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

	if(body.payload){
		const payload = JSON.parse(body.payload)
		return handleInteractivity(payload);
	}

	return {
		statusCode: 200,
		body: 'TODO: handle Slack commands and interactivity',
	};
};
