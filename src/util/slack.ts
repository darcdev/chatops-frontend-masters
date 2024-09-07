import type {HandlerEvent} from "@netlify/functions";
import {createHmac} from "node:crypto";
import {saveItem} from "./notion";

// TODO create Slack utilities

export function slackApi(
    endpoint : SlackApiEndpoint,
    body : SlackApiRequestBody
){
    return fetch(`https://slack.com/api/${endpoint}`, {
        method : 'POST',
        headers : {
            Authorization : `Bearer ${process.env.SLACK_BOT_AUTH_TOKEN}`,
            'Content-Type' : 'application/json; charset=utf-8'
        },
        body : JSON.stringify(body)
    }).then(res => res.json())
}

export function verifySlackRequest(request : HandlerEvent){
    const secret = process.env.SLACK_SIGNING_SECRET as string;
    const signature = request.headers['x-slack-signature'];
    const timestamp = Number(request.headers['x-slack-request-timestamp']);
    const now = Math.floor(Date.now() / 1000)

    if(Math.abs(now - timestamp) > 300){
        return false;
    }

    const hash = createHmac('sha256', secret).update(`v0:${timestamp}:${request.body}`).digest('hex');

    return `v0=${hash}` === signature;
}

export const blocks = {
    section: ({ text }: SectionBlockArgs): SlackBlockSection => {
        return {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text,
            },
        };
    },
    input({
              id,
              label,
              placeholder,
              initial_value = '',
              hint = '',
          }: InputBlockArgs): SlackBlockInput {
        return {
            block_id: `${id}_block`,
            type: 'input',
            label: {
                type: 'plain_text',
                text: label,
            },
            element: {
                action_id: id,
                type: 'plain_text_input',
                placeholder: {
                    type: 'plain_text',
                    text: placeholder,
                },
                initial_value,
            },
            hint: {
                type: 'plain_text',
                text: hint,
            },
        };
    },
    select({
               id,
               label,
               placeholder,
               options,
           }: SelectBlockArgs): SlackBlockInput {
        return {
            block_id: `${id}_block`,
            type: 'input',
            label: {
                type: 'plain_text',
                text: label,
                emoji: true,
            },
            element: {
                action_id: id,
                type: 'static_select',
                placeholder: {
                    type: 'plain_text',
                    text: placeholder,
                    emoji: true,
                },
                options: options.map(({ label, value }) => {
                    return {
                        text: {
                            type: 'plain_text',
                            text: label,
                            emoji: true,
                        },
                        value,
                    };
                }),
            },
        };
    },
};

export function modal({
                          trigger_id,
                          id,
                          title,
                          submit_text = 'Submit',
                          blocks,
                      }: ModalArgs) {
    return {
        trigger_id,
        view: {
            type: 'modal',
            callback_id: id,
            title: {
                type: 'plain_text',
                text: title,
            },
            submit: {
                type: 'plain_text',
                text: submit_text,
            },
            blocks,
        },
    };
}

export async function handleInteractivity(payload : SlackModalPayload){
    const callback_id = payload.callback_id ?? payload.view.callback_id
    switch (callback_id){
        case 'foodfight-modal' :
            const data =  payload.view.state.values
            const fields = {
                opinion : data.opinion_block.opinion.value,
                spiceLevel : data.spice_level_block.spice_level.selected_option.value,
                submitter : payload.user.name,
            }

            await saveItem(fields)

            await slackApi('chat.postMessage', {
                channel : 'C07LEH3E9B6',
                text : `Oh dang, y'all! :eyes: <@${payload.user.id}> just started a food figth with a ${fields.spiceLevel} take:\n\n ${fields.opinion}\n\n...discuss`
            })
            console.log('todo bien')
            break;
        case 'start-food-fight-nudge':
            const channel = payload.channel?.id;
            const user_id = payload.user.id;
            const thread_ts = payload.message.thread_ts ?? payload.message.ts;

            await slackApi('chat.postMessage', {
                channel,
                thread_ts,
                text: `Hey <@${user_id}>, an opinion like this one deserves a heated public debate. Run the \`/foodfight\` slash command in a main channel to start one!`,
            });

            break;
        default:
            console.log(`not handler defined for ${callback_id}`)
            return {
                statusCode : 400,
                body : `not handler defined for ${callback_id}`
            }
    }
    console.log('todo bien 2')
    return {
        statusCode : 200,
        body : ''
    }
}