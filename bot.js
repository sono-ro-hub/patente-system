const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");
const config = require("./config.json");

// 🛡️ ANTI CRASH GLOBALE
process.on("unhandledRejection", (err) => {
  console.log("⚠️ Errore ignorato:", err);
});

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const userData = new Map();

// 📦 LOAD COMMANDS
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
});

// 🔥 CODICE PAGAMENTO GENERATOR
function generatePaymentCode() {
  return "PAT-" + Math.floor(10000 + Math.random() * 90000);
}

// =========================
// READY (FIXED)
// =========================
client.once("ready", () => {
  console.log(`🤖 Bot Patente online: ${client.user.tag}`);
});

// =========================
// SLASH COMMANDS
// =========================
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction, client, userData, generatePaymentCode);
  }
});

// =========================
// BUTTON SYSTEM
// =========================
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  if (!userData.has(userId)) {
    userData.set(userId, { step: 0, code: null });
  }

  const data = userData.get(userId);

  // 📌 START PATENTE
  if (id.startsWith("req_")) {
    const type = id.split("_")[1];

    data.type = type;
    data.step = 1;
    data.code = generatePaymentCode();

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`🏁 Patente: **${type}**

💳 CODICE PAGAMENTO:
\`${data.code}\`

⚠️ Step:
1️⃣ Quiz
2️⃣ Pagamento
3️⃣ Screenshot + codice
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

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }

  // 🧠 QUIZ
  if (id.startsWith("quiz_")) {
    data.step = 2;

    return interaction.reply({
      content: "🧠 Quiz completato!",
      ephemeral: true
    });
  }

  // 💳 PAGAMENTO
  if (id.startsWith("pay_")) {
    data.step = 3;

    return interaction.reply({
      content: "📸 Invia screenshot + CODICE PAGAMENTO nel messaggio",
      ephemeral: true
    });
  }

  // 📤 STAFF SEND
  if (id.startsWith("send_")) {
    if (data.step < 3) {
      return interaction.reply({
        content: "❌ Completa prima quiz e pagamento",
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.find(
      c => c.name === "staff-patenti"
    );

    if (!channel) {
      return interaction.reply({
        content: "❌ Canale staff-patenti non trovato",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA PATENTE")
      .setDescription(
`👤 Utente: <@${userId}>
📌 Tipo: ${data.type}
💳 Codice: ${data.code}`
      );

    await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: "📤 Inviato allo staff!",
      ephemeral: true
    });
  }

  // ✅ ACCEPT
  if (id.startsWith("accept_")) {
    return interaction.update({
      content: "✅ Patente APPROVATA",
      components: []
    });
  }

  // ❌ REJECT
  if (id.startsWith("reject_")) {
    return interaction.update({
      content: "❌ Patente RIFIUTATA",
      components: []
    });
  }
});

// 📸 PAYMENT CHECK
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const data = userData.get(message.author.id);
  if (!data || data.step !== 3) return;

  if (!message.content.includes(data.code) && message.attachments.size === 0) {
    return message.reply("❌ Devi inviare screenshot + codice pagamento!");
  }

  const channel = message.guild.channels.cache.find(
    c => c.name === "staff-patenti"
  );

  if (!channel) return;

  await channel.send({
    content: `💳 PAGAMENTO <@${message.author.id}> | Codice: ${data.code}`,
    files: message.attachments.map(a => a.url)
  });

  message.reply("✅ Pagamento inviato allo staff!");
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
