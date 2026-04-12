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
const express = require("express"); // 🔥 FIX 1

const config = require("./config.json");

// ======================
// 🌐 EXPRESS KEEP ALIVE (FIX RENDER TIMEOUT)
// ======================
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("🤖 Bot Patente online");
});

// 🔥 IMPORTANTE: bind su 0.0.0.0
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server attivo sulla porta " + PORT);
});

// 🤖 BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// 📦 LOAD COMMANDS
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// 🧠 STATO UTENTI
const userData = new Map();

// 🌐 READY (FIX EVENT CORRETTO)
client.once("ready", () => {
  console.log(`🤖 Bot Patente online: ${client.user.tag}`);
});

// 🎮 INTERACTIONS
client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    await command.execute(interaction, client, userData);
  }

  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  if (!userData.has(userId)) {
    userData.set(userId, { step: 0, score: 0 });
  }

  const data = userData.get(userId);

  if (id.startsWith("req_")) {

    const type = id.split("_")[1];

    if (data.step > 0) {
      return interaction.reply({
        content: "❌ Hai già una richiesta attiva!",
        ephemeral: true
      });
    }

    data.step = 1;
    data.type = type;

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`🏁 Patente selezionata: **${type}**

📌 Devi completare:
1️⃣ Quiz
2️⃣ Pagamento 3k
3️⃣ Invio screenshot
4️⃣ Staff approva`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_quiz")
        .setLabel("🧠 Inizia Quiz")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("pay")
        .setLabel("💳 Pagamento")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("send_staff")
        .setLabel("📤 Invia staff")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (id === "start_quiz") {
    data.step = 2;
    data.score = 3;

    return interaction.reply({
      content: "🧠 Quiz completato! Punteggio: 3/3",
      ephemeral: true
    });
  }

  if (id === "pay") {
    data.step = 3;

    return interaction.reply({
      content: "💳 Invia screenshot pagamento nel canale PAGAMENTI PATENTE",
      ephemeral: true
    });
  }

  if (id === "send_staff") {

    if (data.step < 3) {
      return interaction.reply({
        content: "❌ Devi completare quiz + pagamento",
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.find(
      c => c.name === "staff-patenti"
    );

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA PATENTE")
      .setDescription(
`👤 Utente: <@${userId}>
📌 Tipo: ${data.type}
🧠 Score: ${data.score}/3`
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

  if (id.startsWith("reject_")) {

    const idUser = id.split("_")[1];
    userData.delete(idUser);

    return interaction.update({
      content: "❌ Patente RIFIUTATA",
      components: []
    });
  }
});

client.login(process.env.TOKEN);
