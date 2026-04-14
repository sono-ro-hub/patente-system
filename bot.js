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

app.get("/", (req, res) => res.send("Bot online"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔧 CONFIG
const CHANNEL_REQUEST = "1493595963942768860";
const CHANNEL_STAFF = "1493597555760824503";
const RUOLO_PATENTE = "1492884347584385164";

const userData = new Map();

// =========================
// READY
// =========================
client.once("clientReady", async () => {
  console.log("🤖 Bot pronto");

  const ch = await client.channels.fetch(CHANNEL_REQUEST);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("RICHIESTA PATENTE")
    .setDescription("Clicca per iniziare");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Richiedi patente")
      .setStyle(ButtonStyle.Success)
  );

  ch.send({ embeds: [embed], components: [row] });
});

// =========================
// INTERAZIONI
// =========================
client.on("interactionCreate", async interaction => {

  // START
  if (interaction.isButton() && interaction.customId === "start") {

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("INFORMAZIONI PATENTE")
      .setDescription(`
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1)** Inviare il quiz su MODULI-PATENTE e attendere correzione staff  

**2)** Inviare 3k all'id Lessimanuardi123 e foto su PAGAMENTI PATENTE  

**3)** Usare la patente correttamente in RP (multa 1k senza patente)
`);

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_patente")
        .setPlaceholder("Seleziona patente")
        .addOptions([
          { label: "Patente A", value: "A" },
          { label: "Patente B", value: "B" },
          { label: "Patente C-D", value: "CD" }
        ])
    );

    return interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
  }

  // SCELTA PATENTE → QUIZ
  if (interaction.isStringSelectMenu() && interaction.customId === "select_patente") {

    const tipo = interaction.values[0];

    userData.set(interaction.user.id, {
      tipo,
      step: 1
    });

    const modal = new ModalBuilder()
      .setCustomId("quiz_submit")
      .setTitle(`Quiz Patente ${tipo}`);

    const q1 = new TextInputBuilder().setCustomId("q1").setLabel("Risposta 1").setStyle(TextInputStyle.Short);
    const q2 = new TextInputBuilder().setCustomId("q2").setLabel("Risposta 2").setStyle(TextInputStyle.Short);
    const q3 = new TextInputBuilder().setCustomId("q3").setLabel("Risposta 3").setStyle(TextInputStyle.Short);
    const q4 = new TextInputBuilder().setCustomId("q4").setLabel("Risposta 4").setStyle(TextInputStyle.Short);
    const q5 = new TextInputBuilder().setCustomId("q5").setLabel("Risposta 5").setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(q1),
      new ActionRowBuilder().addComponents(q2),
      new ActionRowBuilder().addComponents(q3),
      new ActionRowBuilder().addComponents(q4),
      new ActionRowBuilder().addComponents(q5)
    );

    return interaction.showModal(modal);
  }

  // QUIZ SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === "quiz_submit") {

    const data = userData.get(interaction.user.id);
    if (!data) return;

    data.risposte = [
      interaction.fields.getTextInputValue("q1"),
      interaction.fields.getTextInputValue("q2"),
      interaction.fields.getTextInputValue("q3"),
      interaction.fields.getTextInputValue("q4"),
      interaction.fields.getTextInputValue("q5")
    ];

    data.step = 2;
    userData.set(interaction.user.id, data);

    return interaction.reply({
      content: "✅ Quiz inviato!\n📸 Ora manda la FOTO del pagamento nel canale.",
      ephemeral: true
    });
  }

  // ACCETTA / RIFIUTA STAFF
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("accetta_")) {

      const id = interaction.customId.split("_")[1];
      const member = await interaction.guild.members.fetch(id);

      await member.roles.add(RUOLO_PATENTE);

      return interaction.update({
        content: `✅ PATENTE APPROVATA DA ${interaction.user.tag}`,
        components: []
      });
    }

    if (interaction.customId.startsWith("rifiuta_")) {
      return interaction.update({
        content: `❌ PATENTE RIFIUTATA DA ${interaction.user.tag}`,
        components: []
      });
    }
  }
});

// =========================
// FOTO PAGAMENTO
// =========================
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const data = userData.get(message.author.id);
  if (!data || data.step !== 2) return;

  if (message.attachments.size === 0) return;

  const staff = await client.channels.fetch(CHANNEL_STAFF);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("NUOVA PATENTE")
    .setDescription(`
Utente: <@${message.author.id}>
Patente: ${data.tipo}

Risposte:
${data.risposte.join("\n")}
`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accetta_${message.author.id}`)
      .setLabel("ACCETTA")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`rifiuta_${message.author.id}`)
      .setLabel("RIFIUTA")
      .setStyle(ButtonStyle.Danger)
  );

  await staff.send({
    embeds: [embed],
    files: message.attachments.map(a => a.url),
    components: [row]
  });

  message.reply("📤 Inviato allo staff!");

  data.step = 3;
  userData.set(message.author.id, data);
});

client.login(process.env.TOKEN);
