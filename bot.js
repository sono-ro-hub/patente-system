const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot online"));
app.listen(PORT, () => console.log("🌐 Server attivo"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// CONFIG
const CHANNEL_RICHIESTE = "1493595963942768860";
const CHANNEL_STAFF = "1493597555760824503";
const RUOLO_PATENTE = "1492884347584385164";

const userData = new Map();

// READY
client.once("clientReady", async () => {
  console.log("🤖 Bot pronto");

  const ch = await client.channels.fetch(CHANNEL_RICHIESTE);

  const embed = new EmbedBuilder()
    .setTitle("🚗 RICHIESTA PATENTE")
    .setColor("Green")
    .setDescription("Premi il bottone per iniziare");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("richiedi")
      .setLabel("📄 Richiedi patente")
      .setStyle(ButtonStyle.Success)
  );

  ch.send({ embeds: [embed], components: [row] });
});

// INTERAZIONI
client.on("interactionCreate", async interaction => {

  // CLICK START
  if (interaction.isButton() && interaction.customId === "richiedi") {

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📄 INFORMAZIONI PATENTE")
      .setDescription(`
1) Compila quiz  
2) Invia pagamento  
3) Attendi staff  
Multa: 1k
`);

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("patente")
        .setPlaceholder("Scegli patente")
        .addOptions([
          { label: "Patente A", value: "A" },
          { label: "Patente B", value: "B" },
          { label: "Patente C-D", value: "CD" }
        ])
    );

    return interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
  }

  // SCELTA PATENTE → MODAL
  if (interaction.isStringSelectMenu()) {
    const tipo = interaction.values[0];

    userData.set(interaction.user.id, { tipo });

    const modal = new ModalBuilder()
      .setCustomId("quiz_modal")
      .setTitle("Quiz Patente " + tipo);

    const q1 = new TextInputBuilder()
      .setCustomId("q1")
      .setLabel("Domanda 1")
      .setStyle(TextInputStyle.Short);

    const q2 = new TextInputBuilder()
      .setCustomId("q2")
      .setLabel("Domanda 2")
      .setStyle(TextInputStyle.Short);

    const q3 = new TextInputBuilder()
      .setCustomId("q3")
      .setLabel("Domanda 3")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(q1),
      new ActionRowBuilder().addComponents(q2),
      new ActionRowBuilder().addComponents(q3)
    );

    return interaction.showModal(modal);
  }

  // INVIO QUIZ
  if (interaction.isModalSubmit()) {

    const data = userData.get(interaction.user.id);
    if (!data) return;

    data.risposte = [
      interaction.fields.getTextInputValue("q1"),
      interaction.fields.getTextInputValue("q2"),
      interaction.fields.getTextInputValue("q3")
    ];

    userData.set(interaction.user.id, data);

    return interaction.reply({
      content: "✅ Quiz inviato!\n📸 Ora invia QUI la foto del pagamento",
      ephemeral: true
    });
  }
});

// FOTO PAGAMENTO
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const data = userData.get(message.author.id);
  if (!data) return;

  if (message.attachments.size === 0) return;

  const staff = await client.channels.fetch(CHANNEL_STAFF);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("🚗 NUOVA RICHIESTA")
    .setDescription(`
Utente: <@${message.author.id}>
Patente: ${data.tipo}

🧠 Risposte:
${data.risposte.join("\n")}
`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("accetta_" + message.author.id)
      .setLabel("✅ Accetta")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("rifiuta")
      .setLabel("❌ Rifiuta")
      .setStyle(ButtonStyle.Danger)
  );

  staff.send({
    embeds: [embed],
    files: message.attachments.map(a => a.url),
    components: [row]
  });

  message.reply("📤 Inviato allo staff!");
});

// ACCETTA
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith("accetta_")) {
    const userId = interaction.customId.split("_")[1];

    const member = await interaction.guild.members.fetch(userId);
    await member.roles.add(RUOLO_PATENTE);

    interaction.update({
      content: "✅ Patente approvata",
      components: []
    });
  }

  if (interaction.customId === "rifiuta") {
    interaction.update({
      content: "❌ Patente rifiutata",
      components: []
    });
  }
});

client.login(process.env.TOKEN);
