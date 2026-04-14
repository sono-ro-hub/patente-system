// =========================
// KEEP ALIVE
// =========================
require("http").createServer((req, res) => {
  res.end("Bot attivo");
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
// INFO PATENTE (FIX)
// =========================
const INFO = `
• 🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente
🅰️ Patente A → Moto
🅱️ Patente B → Auto
🅲 Patente C-D → Camion/Bus

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• Cittadino registrato
• Comportamento civile
• Nessuna sospensione
• Conoscenza regole base

━━━━━━━━━━━━━━━━━━
⚠️ Rifiuto automatico se non rispetti i requisiti
`;

// =========================
// PROCEDURA
// =========================
const STEPS_INFO = `
__INFORMAZIONI PATENTE__

1) Completa il quiz  
2) Invia 3000 a Lessimanuardi123  
3) Carica screenshot del pagamento  
4) Attendi lo staff che lo corregga
`;

// =========================
// QUIZ
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari di giorno?",
    "Rallentare in curva?",
    "Guida senza patente?",
    "Strada bagnata?",
    "Contromano?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso?",
    "Cellulare vietato?",
    "Fari notte?",
    "Limite 130?",
    "Sorpasso continuo?"
  ],
  CD: [
    "Limite camion?",
    "Rosso cosa fai?",
    "Ambulanza priorità?",
    "Freno motore?",
    "Distanza sicurezza?",
    "Carico sicuro?"
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
// INTERACTION
// =========================
client.on("interactionCreate", async (interaction) => {

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

    return interaction.reply({
      embeds: [{ color: 0x0b3d91, description: STEPS_INFO }],
      components: [menu],
      ephemeral: true
    });
  }

  // SELECT
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, {
      type,
      step: 0,
      answers: []
    });

    return sendStep(interaction);
  }

  // QUIZ MODAL
  if (interaction.isModalSubmit() && interaction.customId.startsWith("quiz_")) {

    const data = userData.get(interaction.user.id);

    const risposte = Object.values(interaction.fields.fields).map(f => f.value);
    data.answers.push(...risposte);

    data.step += 3;

    if (data.step >= quiz[data.type].length) {

      return interaction.reply({
        content: "📸 Ora carica lo screenshot del pagamento (FILE dalla galleria)",
        ephemeral: true
      });

    }

    return sendStep(interaction);
  }

});

// =========================
// STEP AUTOMATICO QUIZ
// =========================
async function sendStep(interaction) {

  const data = userData.get(interaction.user.id);
  const domande = quiz[data.type].slice(data.step, data.step + 3);

  const modal = new ModalBuilder()
    .setCustomId(`quiz_${data.step}`)
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
// LOGIN
// =========================
client.login(process.env.TOKEN);
