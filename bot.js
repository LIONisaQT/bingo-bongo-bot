require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

const EMERGENCY_MEETING_URL = "https://cdn.vox-cdn.com/thumbor/h5-DmD2dNDNSOhwYExHXLLf692Y=/0x0:1920x1080/920x613/filters:focal(807x387:1113x693):format(webp)/cdn.vox-cdn.com/uploads/chorus_image/image/67390942/Emergency_Meeting.0.jpg";
const MAX_STRING_LEN = 10;
const LOBBY_STATES = {
	NULL: 'null',
	LOBBY: 'lobby',
	INGAME: 'ingame',
	RESULTS: 'results'
};

var lastLobbyMessageId;
var lastFinishMessageId;
var currentLobbyStatus = LOBBY_STATES.NULL;

var lobby = [];

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
})

client.on('message', msg => {
	if (client.user.id === msg.author.id) return;

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

	switch (currentLobbyStatus) {
		case LOBBY_STATES.LOBBY:
			lobby.push(user);
			console.log(`lobby_add ${user.tag}`);
			break;
		case LOBBY_STATES.RESULTS:
			console.log(`${user.tag} reacted with ${reaction.emoji.name}`);
			break;
		default:
			break;
	}
})

client.on('messageReactionRemove', async (reaction, user) => {
	if (client.user.tag !== reaction.message.author.tag) return;

	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Oof ', error);
			return;
		}
	}

	switch (currentLobbyStatus) {
		case LOBBY_STATES.LOBBY:
			let index = lobby.indexOf(user);
			if (index > -1) {
				lobby.splice(index, 1);
			}
			console.log(`lobby_remove ${user.tag}`);
			break;
		default:
			break;
	}
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
			console.log(`command_arg_unrecognized_${command[0]}`);
			msg.channel.send(`Command arg \`${command[0]}\` not recognized`);
			break;
	}
}

function amongUsMakeLobby(discord) {
	if (currentLobbyStatus == LOBBY_STATES.RESULTS) {
		console.log('lobby_make_during_results');
		discord.channel.send(`Making new lobby before previous game results were recorded. Previous game data wiped.`);
	}

	console.log('lobby_make');
	currentLobbyStatus = LOBBY_STATES.LOBBY;
	if (lobby.length > 0) {
		console.log('lobby_make_remove_all');
	}
	lobby.length = 0;
	discord.channel.send('Making Among Us lobby! Please react to this message to be recorded into stats.\nEnter `!au start` to begin the lobby.');
}

function amongUsStartLobby(discord) {
	if (currentLobbyStatus != LOBBY_STATES.LOBBY) {
		console.log(`lobby_start_bad_state_${currentLobbyStatus}`);
		discord.channel.send(`\`!au start\` command given during invalid game state (${currentLobbyStatus})`);
		return;
	}

	console.log('lobby_start');
	currentLobbyStatus = LOBBY_STATES.INGAME;
	
	discord.channel.send(`Starting Among Us lobby! There ${lobby.length == 1 ? 'is' : 'are'} currently ${lobby.length} player${lobby.length == 1 ? '' : 's'} locked in.`);
	lobby.forEach(user => discord.channel.send(`<@${user.id}>`));
	discord.channel.send('If you need to add more players, re-enter `!au lobby`. Users locked in previously will not be migrated, so they will have to lock in again.\nWhen the game is finished, enter `!au finish crew/imp` depending on who won.');
}

function amongUsGameFinish(discord, winner) {
	if (currentLobbyStatus != LOBBY_STATES.INGAME) {
		console.log(`lobby_finish_bad_state_${currentLobbyStatus}`);
		discord.channel.send(`\`!au finish\` command given during invalid game state (${currentLobbyStatus})`);
		return;
	}

	currentLobbyStatus = LOBBY_STATES.RESULTS;
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
	discord.channel.send(`Among Us game finished! Winners: **${winnersString}**.\nPlease react with :raised_hand: if you were alive at the end of the game. Next, please react with :innocent: if you were a crewmate, or :knife: if you were an imposter. You can only record stats if you reacted during the lobby phase (subject to iteration).\nOnce everyone has reacted, enter \`!au record\` to record stats.`);
}

function amongUsRecordStats(discord) {
	if (currentLobbyStatus == LOBBY_STATES.RESULTS) {
		console.log('lobby_record');
		discord.channel.send('Recording stats. To begin next game, enter `!au lobby`.');
		currentLobbyStatus = LOBBY_STATES.NULL;
		lobby.length = 0;
	} else {
		console.log(`lobby_record_bad_state_${currentLobbyStatus}`);
		discord.channel.send(`\`!au record\` command given during invalid game state (${currentLobbyStatus})`);
	}
}

client.login(process.env.BOT_TOKEN);