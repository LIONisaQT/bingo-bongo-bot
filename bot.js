require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
})
client.on('message', msg => {
	if (msg.content.substring(0, 1) === '!') {
		let args = msg.content.substring(1).split(' ');
		let cmd = args[0];
		let url = 'https://ryanshee.com/static/reacts/' + cmd + '.gif'

		msg.channel.send('', {files: [url]});
	}
})
client.login(process.env.BOT_TOKEN);