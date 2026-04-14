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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// =========================
// CONFIG
// =========================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();
let messaggioInviato = false;

// =========================
// DOMANDE
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari sempre accesi?",
    "Rallentare in curva?",
    "Guanti obbligatori?",
    "Frenata su bagnato?",
    "Freno anteriore più forte?",
    "Sorpasso a destra vietato?",
    "Pneumatici lisci sicuri?",
    "Freccia serve?",
    "Casco allacciato?",
    "Contromano consentito?",
    "Limite 50km/h città?",
    "Senza patente permesso?",
    "Pioggia distanza maggiore?",
    "Clacson solo pericolo?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Limite 50km/h?",
    "Rosso stop?",
    "Cellulare vietato?",
    "Frenata bagnato?",
    "Bambini seggiolino?",
    "Precedenza destra?",
    "Sorpasso sinistra?",
    "Autostrada 130km/h?",
    "Fari notte?",
    "Semaforo rosso stop?",
    "Parcheggio vietato?",
    "Distanza sicurezza?",
    "Linea continua sorpasso?",
    "Rispetto limiti?"
  ],
  CD: [
    "Limite camion città?",
    "Semaforo rosso?",
    "Precedenza incrocio?",
    "Luci quando?",
    "Ambulanza cosa fai?",
    "Trasporto persone?",
    "Distanza sicurezza?",
    "Freno discesa?",
    "Dove parcheggiare?",
    "Segnale camion?"
  ]
};

// =========================
// READY (MESSAGGIO UNA VOLTA)
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!messaggioInviato) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📄 RICHIESTA PATENTE")
      .setDescription("Clicca per iniziare la richiesta patente");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Success)
    );

    await ch.send({ embeds: [embed], components: [row] });
    messaggioInviato = true;
  }
});

// =========================
// START
// =========================
client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) return;

  // START
  if (interaction.customId === "start") {

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📄 INFORMAZIONI PATENTE")
      .setDescription(`
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1) Inviare il quiz per la patente e attendere staff***

**2) Inviare 3k in game all'id Lessimanuardi123 e caricare foto pagamento**

**3) Se non hai patente puoi rifarla liberamente (una per tipo)**
      `);

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

  // ACCEPT / REJECT
  if (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_")) {

    const isAcc = interaction.customId.startsWith("accetta_");

    const member = await interaction.guild.members.fetch(
      interaction.customId.split("_")[1]
    );

    if (isAcc) {
      await member.roles.add(RUOLI.A || RUOLI.B || RUOLI.CD);
    }

    return interaction.update({
      content: isAcc
        ? `✅ ACCETTATO da ${interaction.user.tag}`
        : `❌ RIFIUTATO da ${interaction.user.tag}`,
      components: []
    });
  }
});

// =========================
// SELECT PATENTE
// =========================
client.on("interactionCreate", async interaction => {

  if (!interaction.isStringSelectMenu()) return;

  const type = interaction.values[0];

  if (userData.has(interaction.user.id) && userData.get(interaction.user.id).type === type) {
    return interaction.reply({ content: "Hai già questa patente in corso", ephemeral: true });
  }

  userData.set(interaction.user.id, { type });

  const domande = quiz[type];

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("📋 QUIZ PATENTE")
    .setDescription(
      domande.map((q, i) => `**${i + 1}.** ${q}`).join("\n")
    );

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Rispondi al Quiz");

  const input = new TextInputBuilder()
    .setCustomId("answers")
    .setLabel("Rispondi in ordine (1-2-3...)")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  await interaction.showModal(modal);
});

// =========================
// QUIZ SUBMIT
// =========================
client.on("interactionCreate", async interaction => {

  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);
    data.answers = interaction.fields.getTextInputValue("answers");

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pay")
        .setLabel("📸 Carica pagamento (galleria)")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "Ora carica la foto del pagamento (NO link)",
      components: [btn],
      ephemeral: true
    });
  }

  // PAYMENT MODAL
  if (interaction.customId === "payment") {

    const data = userData.get(interaction.user.id);

    const attachment = interaction.attachments?.first();
    if (!attachment) {
      return interaction.reply({ content: "Devi caricare una foto", ephemeral: true });
    }

    const staff = await client.channels.fetch(CANALE_STAFF);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📄 NUOVA PATENTE")
      .setDescription(`
Utente: <@${interaction.user.id}>
Tipo: ${data.type}

RISPOSTE:
${data.answers}
`)
      .setImage(attachment.url);

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

    return interaction.reply({ content: "Inviato allo staff", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
