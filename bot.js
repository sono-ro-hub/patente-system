// =========================
// KEEP ALIVE (RENDER FIX)
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
const config = {
  canaleRichieste: "1493595963942768860",
  canaleStaff: "1493597555760824503",
  guildId: "1484912853126221896",
  staffRoleId: "1485668955480657930",
  patenteRoleId: "1492884347584385164"
};

// =========================
// RUOLI PATENTE
// =========================
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
// INFO PATENTE (FIX RICHIESTO)
// =========================
const INFO = `
• 🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente
🅰️ Patente A → Moto
🅱️ Patente B → Auto
🅲 Patente C-D → Camion / Bus

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• Cittadino registrato
• Comportamento civile RP
• Nessuna sospensione attiva
• Conoscenza regole base

━━━━━━━━━━━━━━━━━━
⚠️ Rifiuto automatico se non rispetti i requisiti
`;

// =========================
// QUIZ COMPLETO
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari accesi sempre?",
    "Rallentare in curva?",
    "Contromano permesso?",
    "Strada bagnata aumenta frenata?",
    "Serve patente per guidare?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso stop?",
    "Cellulare vietato?",
    "Fari notturni obbligatori?",
    "Limite autostrada 130?",
    "Sorpasso linea continua?"
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al rosso?",
    "Ambulanza priorità?",
    "Cos’è freno motore?",
    "Distanza sicurezza?",
    "Parcheggio camion?"
  ]
};

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(config.canaleRichieste);

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

      return interaction.reply({
        content: "📌 Seleziona la patente e poi inizierà il quiz",
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

      return sendQuestion(interaction, interaction.user.id);
    }

    // RISPOSTA CHAT
    if (interaction.isMessageComponent()) return;

  } catch (e) {
    console.log(e);
  }
});

// =========================
// DOMANDE A CATENA (VERO ESAME)
// =========================
async function sendQuestion(interaction, userId) {

  const data = userData.get(userId);
  const domande = quiz[data.type];

  const domanda = domande[data.step];

  const embed = new EmbedBuilder()
    .setColor("#0b3d91")
    .setTitle(`Domanda ${data.step + 1}/${domande.length}`)
    .setDescription(domanda + "\n\n✍️ Rispondi in chat entro 60 secondi");

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });

  const filter = m => m.author.id === userId;

  const collector = interaction.channel.createMessageCollector({
    filter,
    max: 1,
    time: 60000
  });

  collector.on("collect", async (msg) => {

    data.answers.push(msg.content);
    data.step++;

    msg.delete().catch(() => {});

    if (data.step >= domande.length) {

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pay")
          .setLabel("Carica pagamento")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.followUp({
        content: "✅ Quiz completato! Ora invia pagamento 3000.",
        components: [btn],
        ephemeral: true
      });
    }

    sendQuestion(interaction, userId);
  });
}

// =========================
// PAGAMENTO (UPLOAD FOTO DISCORD)
// =========================
client.on("interactionCreate", async (interaction) => {

  if (interaction.isButton() && interaction.customId === "pay") {

    const modal = new ModalBuilder()
      .setCustomId("payment")
      .setTitle("Pagamento");

    const input = new TextInputBuilder()
      .setCustomId("photo")
      .setLabel("Carica immagine pagamento (NON link)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  // PAYMENT
  if (interaction.isModalSubmit() && interaction.customId === "payment") {

    const data = userData.get(interaction.user.id);

    const staff = await client.channels.fetch(config.canaleStaff);

    const embed = new EmbedBuilder()
      .setColor("#0b3d91")
      .setTitle("📄 NUOVA RICHIESTA PATENTE")
      .setDescription(`
👤 Utente: <@${interaction.user.id}>
🏷️ Tipo: ${data.type}

📋 RISPOSTE:
${data.answers.join("\n")}
`)
      .setImage(interaction.fields.getTextInputValue("photo"));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accetta_${interaction.user.id}`)
        .setLabel("ACCETTA")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`rifiuta_${interaction.user.id}`)
        .setLabel("RIFIUTA")
        .setStyle(ButtonStyle.Danger)
    );

    await staff.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "✅ Inviato allo staff",
      ephemeral: true
    });
  }

  // STAFF ACTION
  if (interaction.isButton() &&
    (interaction.customId.startsWith("accetta_") ||
     interaction.customId.startsWith("rifiuta_"))) {

    const id = interaction.customId.split("_")[1];

    const motivoModal = new ModalBuilder()
      .setCustomId(`motivo_${interaction.customId}`)
      .setTitle("Motivo decisione");

    const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Scrivi il motivo")
      .setStyle(TextInputStyle.Paragraph);

    motivoModal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(motivoModal);
  }

  // MOTIVO STAFF
  if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

    const action = interaction.customId.replace("motivo_", "");
    const id = action.split("_")[1];

    const guild = await client.guilds.fetch(config.guildId);
    const member = await guild.members.fetch(id).catch(() => null);

    const reason = interaction.fields.getTextInputValue("reason");

    if (member && action.startsWith("accetta_")) {
      await member.roles.add(RUOLI[userData.get(id)?.type]);
    }

    return interaction.reply({
      content: action.startsWith("accetta_")
        ? `✅ ACCETTATO\nMotivo: ${reason}`
        : `❌ RIFIUTATO\nMotivo: ${reason}`
    });
  }
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
