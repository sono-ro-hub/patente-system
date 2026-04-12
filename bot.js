const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const config = require("./config.json");

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// 🧠 DATI UTENTI
const userData = new Map();

// 📦 LOAD COMMANDS
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// =========================
// AUTO REGISTER /patente
// =========================
client.once("ready", async () => {
  console.log(`🤖 Bot Patente online: ${client.user.tag}`);

  const commands = [
    {
      name: "patente",
      description: "📋 Richiedi una patente"
    }
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ /patente registrato!");
  } catch (err) {
    console.error(err);
  }
});

// =========================
// SLASH COMMANDS
// =========================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  await command.execute(interaction, client, userData);
});

// =========================
// BUTTON SYSTEM
// =========================
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  if (!userData.has(userId)) {
    userData.set(userId, { step: 0 });
  }

  const data = userData.get(userId);

  // 📌 START PATENTE
  if (id.startsWith("req_")) {
    const type = id.split("_")[1];
    data.type = type;
    data.step = 1;

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`🏁 Patente: **${type}**

⚠️ Step obbligatori:
1️⃣ Quiz
2️⃣ Pagamento 3k
3️⃣ Screenshot
4️⃣ Staff approva`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_${type}`)
        .setLabel("📋 Quiz")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`pay_${type}`)
        .setLabel("💳 Pagamento")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`send_${type}`)
        .setLabel("📤 Invia staff")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // 🧠 QUIZ (SEMPLICE)
  if (id.startsWith("quiz_")) {
    data.step = 2;
    data.score = 3;

    return interaction.reply({
      content: "🧠 Quiz completato! Score: 3/3",
      ephemeral: true
    });
  }

  // 💳 PAGAMENTO
  if (id.startsWith("pay_")) {
    data.step = 3;

    return interaction.reply({
      content: "📸 Invia ORA lo screenshot del pagamento in chat.",
      ephemeral: true
    });
  }

  // 📤 STAFF
  if (id.startsWith("send_")) {
    if (data.step < 3) {
      return interaction.reply({
        content: "❌ Devi completare quiz + pagamento",
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.find(c => c.name === "staff-patenti");

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA PATENTE")
      .setDescription(
`👤 Utente: <@${userId}>
📌 Tipo: ${data.type}
🧠 Score: ${data.score || 0}/3`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${userId}`)
        .setLabel("✅ Accetta")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`reject_${userId}`)
        .setLabel("❌ Rifiuta")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📤 Inviato allo staff!",
      ephemeral: true
    });
  }

  // ✅ ACCEPT
  if (id.startsWith("accept_")) {
    const idUser = id.split("_")[1];
    const member = await interaction.guild.members.fetch(idUser);

    const role = interaction.guild.roles.cache.get(config.patenteRoleId);

    if (role) await member.roles.add(role);

    userData.delete(idUser);

    return interaction.update({
      content: "✅ Patente APPROVATA",
      components: []
    });
  }

  // ❌ REJECT
  if (id.startsWith("reject_")) {
    const idUser = id.split("_")[1];
    userData.delete(idUser);

    return interaction.update({
      content: "❌ Patente RIFIUTATA",
      components: []
    });
  }
});

// 📸 SCREENSHOT PAGAMENTO
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const data = userData.get(userId);

  if (!data || data.step !== 3) return;

  if (message.attachments.size === 0) {
    return message.reply("❌ Invia uno screenshot.");
  }

  const file = message.attachments.first();

  const channel = message.guild.channels.cache.find(c => c.name === "staff-patenti");

  await channel.send({
    content: `💳 PAGAMENTO da <@${userId}> (${data.type})`,
    files: [file.url]
  });

  return message.reply("✅ Pagamento inviato allo staff!");
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
