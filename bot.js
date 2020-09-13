require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

const EMERGENCY_MEETING_URL = "https://cdn.vox-cdn.com/thumbor/h5-DmD2dNDNSOhwYExHXLLf692Y=/0x0:1920x1080/920x613/filters:focal(807x387:1113x693):format(webp)/cdn.vox-cdn.com/uploads/chorus_image/image/67390942/Emergency_Meeting.0.jpg";
const MAX_STRING_LEN = 10;

var lastLobbyMessageId;
var lastFinishMessageId;

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
})

client.on('message', msg => {
	if (client.user.tag === msg.member.user.tag) return;

	// Emergency meetings
	if (msg.content.startsWith('!here')) {
		emergencyMeeting(msg, true);
		return;
	} else if (msg.content === "@here" || msg.content === "@everyone") {
		emergencyMeeting(msg, false);
		return;
	}

	// Among Us
	if (msg.content.startsWith('!au')) {
		amongUsHandleArgs(msg, msg.content.substring(msg.content.indexOf(' ') + 1));
		return;
	}

	// Reacts
	if (msg.content.substring(0, 1) === '!') {
		let args = msg.content.substring(1).split(' ');
		args.forEach(function(arg) {
			findReact(msg, arg);
		});
		return;
	}
})

client.on('messageReactionAdd', async (reaction, user) => {
	if (client.user.tag !== reaction.message.author.tag) return;

	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Oof ', error);
			return;
		}
	}

	console.log(`${reaction.message.author.tag}'s message "${reaction.message.content.substring(0, MAX_STRING_LEN)}..." gained a reaction from ${user.tag}`);
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
})

function findReact(msg, name) {
	let url = 'https://raw.githubusercontent.com/LIONisaQT/LIONisaQT.github.io/master/static/reacts/' + name + '.gif';
	msg.channel.send('', {files: [url]})
		.catch(() => onFindReactFail(msg, name));
}

function onFindReactFail(msg, name) {
	msg.channel.send("Could not find file for \"" + name + "\"");
}

function emergencyMeeting(msg, includeAt) {
	let message = `${includeAt ? "@here" : ""}`;
	msg.channel.send(message, {files: [EMERGENCY_MEETING_URL]});
}

function amongUsHandleArgs(msg, args) {
	let command = args.split(' ');
	switch (command[0]) {
		case 'lobby':
			amongUsMakeLobby(msg);
			break;
		case 'start':
			amongUsStartLobby(msg);
			break;
		case 'finish':
			if (command.length == 1) {
				console.log('lobby_finish_not_enough_args');
				msg.channel.send('Finish command requires one more arg! (crew/imp, e.g. `!au finish crew` or `!au finish imp`)');
				break;
			}
			amongUsGameFinish(msg, command[1]);
			break;
		case 'record':
			amongUsRecordStats(msg);
			break;
		default:
			sendConsoleAndDiscordMessages(msg, `Command ${command[0]} not recognized`);
			break;
	}
}

function amongUsMakeLobby(discord) {
	console.log('lobby_make');
	discord.channel.send('Making Among Us lobby! Please react to this message to be recorded into stats.\nEnter `!au start` to begin the lobby.');
}

function amongUsStartLobby(discord) {
	console.log('lobby_start');
	// Add log here with participants
	discord.channel.send('Starting Among Us lobby! Players are locked in.\nIf you need to add more players, re-enter `!au lobby`.\nWhen the game is finished, enter `!au finish crew/imp` depending on who won.');
}

function amongUsGameFinish(discord, winner) {
	let winnersString;
	switch (winner) {
		case 'inno':
		case 'innocent':
		case 'innocents':
		case 'good':
		case 'town':
		case 'crew':
		case 'crewmate':
		case 'crewmates':
			winnersString = 'Crewmates';
			break;
		case 'maf':
		case 'mafia':
		case 'evil':
		case 'imp':
		case 'imposter':
		case 'imposters':
			winnersString = 'Imposters';
			break;
		default:
			break;
	}
	console.log(`lobby_finish_${winnersString.toLowerCase()}`);
	discord.channel.send(`Among Us game finished! Winners: **${winnersString}**.\nPlease react if you were alive at the end of the game. Only works if you reacted during the lobby phase.`);
}

function amongUsRecordStats(discord) {
	console.log('lobby_record');
	discord.channel.send('Recording stats. To begin next game, enter `!au lobby`!');
}

client.login(process.env.BOT_TOKEN);