require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

const leetCodeDatabase = {};
const ryanUserId = '169572455218806784';

function printDatabase(msg) {
	if (Object.entries(leetCodeDatabase).length === 0) {
		msg.channel.send(`No one has submitted any LeetCode submissions. Sad! 😤`);
		return;
	}

	for (const entry in leetCodeDatabase) {
		printDatabaseForUser(msg, entry);
	}
}

function printDatabaseForUser(msg, userId) {
	let user = client.users.find(usr => usr.id === userId);
	if (!user) {
		console.warn(`⚠️ ${userId} does not exist in this server! ⚠️`);
		return;
	}

	if (leetCodeDatabase[userId] == null) {
		msg.channel.send(`${user.username} has not logged any LeetCode problems. Shame! 🔔`);
		return;
	}

	let finalString = `${user.username} has completed a total of:\n`;
	for (const submissions in leetCodeDatabase[userId]) {
		let submissionCount = leetCodeDatabase[userId][submissions];
		let emoji;
		switch (submissions) {
			case 'easy':
				emoji = '🟢';
				break;
			case 'medium':
				emoji = '🟡';
				break;
			case 'hard':
				emoji = '🔴';
				break;
		}
		finalString += `${emoji} ${submissionCount} ${submissions} problem${submissionCount != 1 ? 's' : ''}\n`;
	}

	msg.channel.send(finalString);
}

function clearDataForUser(msg, userId) {
	let user = client.users.find(usr => usr.id === userId);
	if (!user) {
		msg.channel.send(`⚠️ That person does not exist in this server! ⚠️`);
		return;
	}

	if (leetCodeDatabase[userId] == null) {
		msg.channel.send(`${user.username} has no data to clear! 🤔`);
		return;
	}

	leetCodeDatabase[userId] = null;
	msg.channel.send(`Cleared data for ${user.username}! 💀`);
}

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
})

client.on('message', msg => {
	// Return so that the bot doesn't respond to its own messages.
	if (client.user.id === msg.author.id) return;

	const message = msg.content;

	if (message.startsWith('!lc')) {
		const command = message.substring(message.indexOf(' ') + 1);
		if (command.startsWith('record')) {
			handleLeetCodeArgs(msg, command.substring(command.indexOf(' ') + 1));
		} else if (command.startsWith('check')) {
			let userId = command.substring(command.indexOf(' ') + 1);

			if (userId !== 'check') {
				userId = userId.replace(/\D/g, '');
				printDatabaseForUser(msg, userId);
			} else {
				printDatabase(msg);
			}

		} else if (command.startsWith('clear')) {
			if (msg.author.id !== ryanUserId) {
				msg.channel.send(`🚨🚨🚨 Unauthorized user ${msg.author} has tried to clear database. Alerting <@${ryanUserId}>. 🚨🚨🚨`);
				return;
			}

			let userId = command.substring(command.indexOf(' ') + 1);

			if (userId !== 'clear') {
				userId = userId.replace(/\D/g, '');
				clearDataForUser(msg, userId);
			} else {
				msg.channel.send(`Must provide user when attempting to clear data! 🧐`);
			}

		} else {
			msg.channel.send(`Command \`${command}\` is undefined. 🤔`);
		}
	}
});

function handleLeetCodeArgs(msg, args) {
	const command = args.split(' ');
	let finalString = '';
	command.forEach(arg => finalString += handleSingleLeetCodeArg(msg, arg));
	msg.channel.send(finalString);
}

function handleSingleLeetCodeArg(msg, arg) {
	let resultString;

	if (arg.startsWith('easy') || arg.startsWith('medium') || arg.startsWith('hard')) {
		resultString = `${handleLeetCodeSubmission(msg, arg)}\n`;
	} else {
		resultString = `Arg ${arg} is not defined. 🤔\n`;
	}

	return resultString;
}

function handleLeetCodeSubmission(msg, arg) {
	let resultString = `${msg.author.username} finished `;
	let submissionCount = 0;

	if (arg.startsWith('easy')) {
		submissionCount = arg.substring('easy'.length);
		resultString += `${submissionCount} easy problem${submissionCount != 1 ? 's' : ''} 🟢`;
		setDatabaseResults(msg.author.id, 'easy', submissionCount);
	} else if (arg.startsWith('medium')) {
		submissionCount = arg.substring('medium'.length);
		resultString += `${submissionCount} medium problem${submissionCount != 1 ? 's' : ''} 🟡`;
		setDatabaseResults(msg.author.id, 'medium', submissionCount);
	} else {
		submissionCount = arg.substring('hard'.length);
		resultString += `${submissionCount} hard problem${submissionCount != 1 ? 's' : ''} 🔴`;
		setDatabaseResults(msg.author.id, 'hard', submissionCount);
	}

	return resultString;
}

function setDatabaseResults(authorId, difficulty, submissionCount) {
	if (leetCodeDatabase[authorId] == null) {
		leetCodeDatabase[authorId] = {};

		leetCodeDatabase[authorId].easy = 0;
		leetCodeDatabase[authorId].medium = 0;
		leetCodeDatabase[authorId].hard = 0;
	}

	leetCodeDatabase[authorId][difficulty] += Number(submissionCount);
}

client.login(process.env.BOT_TOKEN);