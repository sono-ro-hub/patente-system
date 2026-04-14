// =========================
// KEEP ALIVE (RENDER FIX)
// =========================
require("http").createServer((req, res) => {
  res.write("Bot attivo");
  res.end();
}).listen(3000);

// =========================
// IMPORT
// =========================
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

// =========================
// CLIENT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// CONFIG
// =========================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";
const GUILD_ID = "1484912853126221896";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// =========================
// MEMORY
// =========================
const userData = new Map();
let sent = false;

// =========================
// QUIZ COMPLETO
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari di giorno?",
    "Rallentare in curva?",
    "Serve patente?",
    "Frenata su bagnato?",
    "Freno anteriore più forte?",
    "Superare a destra?",
    "Gomme lisce sicure?",
    "Freccia obbligatoria?",
    "Casco allacciato?",
    "Contromano?",
    "Limite città 50?",
    "Distanza pioggia?",
    "Clacson emergenza?",
    "Sorpasso vietato?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso?",
    "Cellulare alla guida?",
    "Fari notte?",
    "Linea continua?",
    "Autostrada 130?",
    "Seggiolino bambini?",
    "Precedenza destra?",
    "Parcheggio vietato?",
    "Distanza sicurezza?",
    "Sorpasso sinistra?",
    "Rispettare limiti?",
    "Clacson?",
    "Fari giorno?",
    "Stop obbligatorio?"
  ],
  CD: [
    "Limite camion città?",
    "Semaforo rosso?",
    "Ambulanza?",
    "Freno motore?",
    "Parcheggio camion?",
    "Segnale camion?",
    "Distanza sicurezza?",
    "Anabbaglianti?",
    "Peso massimo?",
    "Controlli mezzo?",
    "Riposo obbligatorio?",
    "Carico sicuro?",
    "Sorpasso camion?",
    "Frenata lunga?",
    "Specchietti obbligatori?"
  ]
};

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!sent) {
    const embed = new EmbedBuilder()
      .setColor("#0a0aff")
      .setTitle("🏛️ Dipartimento Trasporti — Sud Italy RP")
      .setDescription(`
Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale.

━━━━━━━━━━━━━━━━━━
📋 Tipi patente
🅰️ Moto
🅱️ Auto
🅲 Camion/Bus

━━━━━━━━━━━━━━━━━━
⚠️ Rispetta i requisiti
`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Success)
    );

    await ch.send({ embeds: [embed], components: [row] });
    sent = true;
  }
});

// =========================
// INTERAZIONI
// =========================
client.on("interactionCreate", async (interaction) => {

  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Seleziona patente")
          .addOptions([
            { label: "Patente A", value: "A" },
            { label: "Patente B", value: "B" },
            { label: "Patente C-D", value: "CD" }
          ])
      );

      return interaction.reply({ content: "Scegli patente", components: [menu], ephemeral: true });
    }

    // SELECT
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: [],
        awaitingPhoto: false
      });

      return sendQuiz(interaction, interaction.user.id);
    }

    // QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      const risposte = interaction.fields.fields.map(f => f.value);

      data.answers.push(...risposte);
      data.step += 5;

      if (data.step >= quiz[data.type].length) {

        data.awaitingPhoto = true;

        return interaction.reply({
          content: "📸 Invia ORA lo screenshot del pagamento QUI in chat (allegato dalla galleria)",
          ephemeral: true
        });

      } else {
        return sendQuiz(interaction, interaction.user.id);
      }
    }

    // STAFF BUTTON
    if (interaction.isButton()) {

      if (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_")) {

        const modal = new ModalBuilder()
          .setCustomId(`motivo_${interaction.customId}`)
          .setTitle("Motivo obbligatorio");

        const input = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Scrivi il motivo")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }
    }

    // MOTIVO STAFF
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const action = interaction.customId.replace("motivo_", "");
      const id = action.split("_")[1];

      const guild = await client.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(id);

      const tipo = userData.get(id)?.type;

      if (action.startsWith("accetta_")) {
        await member.roles.add(RUOLI[tipo]);
      }

      return interaction.reply({
        content: action.startsWith("accetta_")
          ? `✅ ACCETTATO\nMotivo: ${interaction.fields.getTextInputValue("reason")}`
          : `❌ RIFIUTATO\nMotivo: ${interaction.fields.getTextInputValue("reason")}`
      });
    }

  } catch (e) {
    console.log(e);
  }
});

// =========================
// FOTO (ALLEGATO)
// =========================
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  const data = userData.get(message.author.id);
  if (!data || !data.awaitingPhoto) return;

  if (message.attachments.size === 0) {
    return message.reply("❌ Devi inviare una FOTO dalla galleria");
  }

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setColor("#0a0aff")
    .setTitle("NUOVA PATENTE")
    .setDescription(`
👤 <@${message.author.id}>
Tipo: ${data.type}

Risposte:
${data.answers.join("\n")}
`)
    .setImage(message.attachments.first().url);

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

  await staff.send({ embeds: [embed], components: [row] });

  message.reply("✅ Richiesta inviata allo staff!");

  data.awaitingPhoto = false;
});

// =========================
// QUIZ A BLOCCHI
// =========================
function sendQuiz(interaction, userId) {

  const data = userData.get(userId);
  const domande = quiz[data.type].slice(data.step, data.step + 5);

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  domande.forEach((d, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`q${i}`)
          .setLabel(d)
          .setStyle(TextInputStyle.Short)
      )
    );
  });

  return interaction.showModal(modal);
}

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
