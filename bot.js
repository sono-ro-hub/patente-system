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

// 🤖 DISCORD CLIENT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// 📦 CARICA COMANDI
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ✅ READY
client.once("clientReady", () => {
  console.log(`🤖 Bot Patente online: ${client.user.tag}`);
});

// 🎮 INTERACTIONS
client.on("interactionCreate", async interaction => {

  // SLASH COMMANDS
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    await command.execute(interaction, client);
  }

  // BUTTONS
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  // 📌 RICHIESTA PATENTE
  if (id.startsWith("req_")) {
    const type = id.split("_")[1];

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`🏁 Patente selezionata: **${type}**

⚠️ REQUISITI OBBLIGATORI:
• Compilare il quiz
• Pagare 3.000$
• Inviare screenshot pagamento
• Attendere approvazione staff`
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
        .setLabel("📤 Invia richiesta")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // 💳 PAGAMENTO
  if (id.startsWith("pay_")) {
    return interaction.reply({
      content: "💳 Devi inviare lo screenshot nel canale PAGAMENTI PATENTE.",
      ephemeral: true
    });
  }

  // 📤 INVIO STAFF
  if (id.startsWith("send_")) {

    const channel = interaction.guild.channels.cache.find(c =>
      c.name === "staff-patenti"
    );

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA PATENTE")
      .setDescription(
`👤 Utente: <@${interaction.user.id}>
📌 Tipo: ${id.split("_")[1]}

⚠️ Controllare:
• Quiz completato
• Pagamento inviato
• Screenshot verificato`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${interaction.user.id}`)
        .setLabel("✅ Accetta")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`reject_${interaction.user.id}`)
        .setLabel("❌ Rifiuta")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📤 Richiesta inviata allo staff!",
      ephemeral: true
    });
  }

  // ✅ APPROVA / ❌ RIFIUTA
  if (id.startsWith("accept_")) {
    return interaction.update({
      content: "✅ Patente APPROVATA",
      components: []
    });
  }

  if (id.startsWith("reject_")) {
    return interaction.update({
      content: "❌ Patente RIFIUTATA",
      components: []
    });
  }
});

client.login(process.env.TOKEN);
