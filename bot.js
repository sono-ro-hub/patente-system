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
// INFO PATENTE (BLUE STYLE)
// =========================
const INFO = `
• 🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente
🅰️ Patente A → Moto
🅱️ Patente B → Auto
🅲 Patente C-D → Camion/Bus

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• Essere cittadino registrato
• Comportamento civile RP
• Nessuna sospensione attiva
• Conoscenza regole base

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporta rifiuto automatico
`;

// =========================
// STEP INFO
// =========================
const INFO_STEP = `
__**INFORMAZIONI PATENTE**__

1) Completa il quiz  
2) Invia 3000 a Lessimanuardi123  
3) Carica screenshot pagamento (FILE NON LINK)  
4) Attendi staff  

⚠️ Senza patente = multa 1k
`;

// =========================
// QUIZ COMPLETO
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari di giorno?",
    "Rallentare in curva?",
    "Guida senza patente?",
    "Strada bagnata = frenata lunga?",
    "Contromano permesso?",
    "Freccia obbligatoria?",
    "Guanti obbligatori?",
    "Sorpasso a destra?",
    "Limite città?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso = stop?",
    "Cellulare senza vivavoce?",
    "Fari notte obbligatori?",
    "Limite autostrada 130?",
    "Sorpasso linea continua?",
    "Seggiolino bambini?",
    "Precedenza a destra?",
    "Distanza sicurezza?",
    "Rispettare limiti?"
  ],
  CD: [
    "Limite camion città?",
    "Rosso cosa fai?",
    "Ambulanza priorità?",
    "Freno motore cos'è?",
    "Distanza sicurezza?",
    "Parcheggio camion?",
    "Segnale camion?",
    "Anabbaglianti quando?",
    "Peso massimo?",
    "Carico sicurezza?"
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
      .setColor("#0b3d91")
      .setTitle("📄 RICHIESTA PATENTE")
      .setDescription(INFO);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Primary)
    );

    await ch.send({ embeds: [embed], components: [row] });
    sent = true;
  }
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {
  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("#0b3d91")
        .setDescription(INFO);

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

      return interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
    }

    // SELECT PATENTE
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: [],
        awaitingPhoto: false
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start_quiz")
          .setLabel("📄 Inizia Quiz")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: INFO_STEP,
        components: [row],
        ephemeral: true
      });
    }

    // START QUIZ BUTTON
    if (interaction.isButton() && interaction.customId === "start_quiz") {
      return sendQuiz(interaction, interaction.user.id);
    }

    // QUIZ SUBMIT
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      const risposte = Object.values(interaction.fields.fields).map(f => f.value);

      data.answers.push(...risposte);
      data.step += 5;

      if (data.step >= quiz[data.type].length) {

        data.awaitingPhoto = true;

        return interaction.reply({
          content: "📸 Ora carica lo SCREENSHOT del pagamento (FILE dalla galleria)",
          ephemeral: true
        });

      } else {
        await interaction.deferUpdate().catch(() => {});
        return sendQuiz(interaction, interaction.user.id);
      }
    }

  } catch (e) {
    console.log(e);
  }
});

// =========================
// UPLOAD FOTO (NO LINK)
// =========================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.awaitingPhoto) return;

  if (!msg.attachments.size) {
    return msg.reply("❌ Devi caricare una FOTO dalla galleria (file upload)!");
  }

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setColor("#0b3d91")
    .setTitle("NUOVA PATENTE")
    .setDescription(`
👤 <@${msg.author.id}>
Tipo: ${data.type}

💰 Pagamento: 3000

📋 Risposte:
${data.answers.join("\n")}
`)
    .setImage(msg.attachments.first().url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accetta_${msg.author.id}`)
      .setLabel("ACCETTA")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rifiuta_${msg.author.id}`)
      .setLabel("RIFIUTA")
      .setStyle(ButtonStyle.Danger)
  );

  await staff.send({ embeds: [embed], components: [row] });

  msg.reply("✅ Inviato allo staff!");

  data.awaitingPhoto = false;
});

// =========================
// QUIZ FUNCTION (5 DOMANDE A BLOCCHI)
// =========================
function sendQuiz(interaction, userId) {

  const data = userData.get(userId);
  const domande = quiz[data.type].slice(data.step, data.step + 5);

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  domande.forEach((q, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`q${i}`)
          .setLabel(q)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
  });

  return interaction.showModal(modal);
}

// =========================
// STAFF MOTIVO + RUOLO AUTOMATICO
// =========================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

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

});

// =========================
// MOTIVO HANDLER
// =========================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isModalSubmit()) return;

  if (interaction.customId.startsWith("motivo_")) {

    const action = interaction.customId.replace("motivo_", "");
    const id = action.split("_")[1];

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(id);

    const tipo = userData.get(id)?.type;

    if (action.startsWith("accetta_")) {
      await member.roles.add(RUOLI[tipo]).catch(() => {});
    }

    return interaction.reply({
      content: action.startsWith("accetta_")
        ? `✅ ACCETTATO\nMotivo: ${interaction.fields.getTextInputValue("reason")}`
        : `❌ RIFIUTATO\nMotivo: ${interaction.fields.getTextInputValue("reason")}`
    });
  }

});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
