require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

const EMERGENCY_MEETING_URL = "https://cdn.vox-cdn.com/thumbor/h5-DmD2dNDNSOhwYExHXLLf692Y=/0x0:1920x1080/920x613/filters:focal(807x387:1113x693):format(webp)/cdn.vox-cdn.com/uploads/chorus_image/image/67390942/Emergency_Meeting.0.jpg";

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
})

client.on('message', msg => {
	if (client.user.tag === msg.member.user.tag) return;

	if (msg.content.startsWith('!here') || msg.content.startsWith('@here')) {
		emergencyMeeting(msg);
		return;
	}

	if (msg.content.substring(0, 1) === '!') {
		let args = msg.content.substring(1).split(' ');
		args.forEach(function(arg) {
			findReact(msg, arg);
		});
		return;
	}
})

function findReact(msg, name) {
	let url = 'https://raw.githubusercontent.com/LIONisaQT/LIONisaQT.github.io/master/static/reacts/' + name + '.gif';
	msg.channel.send('', {files: [url]})
		.catch(() => onFindReactFail(msg, name));
}

function onFindReactFail(msg, name) {
	console.log("Could not find file for \"" + name + "\"");
	msg.channel.send("Could not find file for \"" + name + "\".");
}

function emergencyMeeting(msg) {
	msg.channel.send("@here", {files: [EMERGENCY_MEETING_URL]});
}

client.login(process.env.BOT_TOKEN);