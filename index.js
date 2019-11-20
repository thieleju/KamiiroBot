/**
 * TODO
 *
 */

const { Client, Collection } = require("discord.js");
const { config } = require("dotenv");
const { getDateTimeStr } = require("./functions");
const conf = require("./configs/config");

config({
  path: __dirname + "/.env"
});

const client = new Client({
  disableEveryone: false
});

client.commands = new Collection();
client.aliases = new Collection();

// user command handler
["command"].forEach(handler => {
  require("./handler/" + handler)(client);
});

// wake up -> Status
client.on("ready", async () => {
  console.log(getDateTimeStr() + client.user.username + " is now running...");
  // client.user.setActivity("with yt api!");
  client.user.setPresence({
    status: "online",
    game: {
      name: "twitch.tv/juliversal",
      type: "WATCHING"
    }
  });
});

/**
 * Access levels:
 * 0  |  admin    |  @♠️ Admin
 * 1  |  mod      |  @💎 Twitch Mod
 * 2  |  sub      |  @🏆 Twitch Sub
 * 3  |  user     |  @🎮 Mitglied
 */

// message is sent event
client.on("message", async msg => {
  // ignore messages for nonprefix and bot
  if (!msg.content.startsWith(conf.prefix) || msg.author.bot || !msg.guild)
    return;
  // fetch member if there is none
  if (!msg.member) msg.member = await msg.guild.fetchMember(msg);

  // split input into cmd and arguments
  const args = msg.content
    .slice(conf.prefix.length)
    .trim()
    .split(/ +/g);
  args.forEach(el => {
    el.toLowerCase();
  });

  // sets cmd to first argument
  const cmd = args.shift();
  // check length
  if (cmd.length === 0) return;
  // set command
  let command = client.commands.get(cmd);
  // if nothing found -> check aliases
  if (!command) command = client.commands.get(client.aliases.get(cmd));

  // exit if no command was found
  if (!command) return;

  // get required minimal access role name
  let accessRoleName = null;

  conf.commands.forEach(c => {
    // get matching command from config
    if (c.name.split(".js")[0] === cmd) {
      // get access level from config
      accessRoleName = c.access;
    }
  });

  // check if user access level is enough to execute cmd
  if (
    msg.member.roles.find(r => {
      let userLevel = getLevelFromRole(getRoleFromID(r.id));

      if (
        userLevel <= getLevelFromRole(accessRoleName) &&
        userLevel != undefined
      ) {
        console.log(getDateTimeStr() + msg.member.user.username + " > " + cmd);
        return true;
      }
    })
  ) {
    // user has access to this command -> execute cmd
    command.run(client, msg, args);
  } else {
    // no access
    msg.channel.send(
      "<@" + msg.member.user.id + "> you are not allowed to do that!"
    );
    console.log(
      getDateTimeStr() +
        msg.member.user.username +
        " has no access to perform -" +
        cmd
    );
  }
});

// login to discord servers with TOKEN
client.login(process.env.TOKEN);

// returns level of rolename
function getLevelFromRole(role) {
  let ret = null;
  conf.roles.forEach(r => {
    if (r.name === role) {
      ret = r.level;
    }
  });
  return ret;
}

// returns rolename of roleID
function getRoleFromID(id) {
  let ret = null;
  conf.roles.forEach(r => {
    if (r.id === id) {
      ret = r.name;
    }
  });
  return ret;
}
