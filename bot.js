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
    GatewayIntentBits.DirectMessages
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
// TESTO INIZIALE (NON MODIFICATO)
// =========================
const START_TEXT = `
•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋Tipi di patente
__🅰️ Patente A__
Consente la guida di __motocicli__ e veicoli a due ruote.
__🅱️ Patente B__
Permette di guidare __autovetture__ e veicoli leggeri. 
__🅲 Patente C-D__
Permette di far guidare __camion__, __pullman__ o __autobus__.

━━━━━━━━━━━━━━━━━━
__📝Condizioni richieste__

• Essere un __cittadino__ registrato  
• Comportamento civile  
• Nessuna sospensione  
• Conoscenza base regole  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico
`;

// =========================
// INFO PATENTE
// =========================
const INFO_PATENTE = `
__**INFORMAZIONI PATENTE**__

1) Completa il quiz  
2) Invia 3k a Lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi lo staff  
`;

// =========================
// QUIZ (TANTE DOMANDE)
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari anche di giorno?",
    "Rallentare in curva?",
    "Contromano permesso?",
    "Strada bagnata = frenata lunga?",
    "Frecce obbligatorie?",
    "Sorpasso a destra?",
    "Pneumatici lisci sicuri?",
    "Casco va allacciato?",
    "Limite città 50?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso stop?",
    "Cellulare alla guida?",
    "Fari notte obbligatori?",
    "Limite autostrada?",
    "Sorpasso linea continua?",
    "Seggiolino bambini?",
    "Precedenza a destra?",
    "Parcheggio vietato segnalato?",
    "Distanza sicurezza?"
  ],
  CD: [
    "Limite camion città?",
    "Rosso cosa fai?",
    "Ambulanza priorità?",
    "Freno motore?",
    "Parcheggio camion?",
    "Segnale camion?",
    "Distanza sicurezza?",
    "Luci anabbaglianti?"
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
      .setColor("#0A1AFF")
      .setDescription(START_TEXT);

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
        .setColor("#0A1AFF")
        .setDescription(INFO_PATENTE);

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

    // SELECT
    if (interaction.isStringSelectMenu()) {

      userData.set(interaction.user.id, {
        type: interaction.values[0],
        answers: []
      });

      return sendQuiz(interaction, interaction.user.id);
    }

    // QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);

      interaction.fields.fields.forEach(f => {
        data.answers.push(f.value);
      });

      return interaction.reply({
        content: "📸 Invia QUI la foto del pagamento (allegato)",
        ephemeral: true
      });
    }

    // FOTO (MESSAGGIO)
    if (interaction.isChatInputCommand()) return;

  } catch (e) {
    console.log(e);
  }
});

// =========================
// FOTO HANDLER
// =========================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data) return;

  if (!msg.attachments.size) return;

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("NUOVA PATENTE")
    .setDescription(`
👤 <@${msg.author.id}>
Tipo: ${data.type}

Risposte:
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

  msg.reply("✅ Inviato allo staff");
});

// =========================
// STAFF (MOTIVO + RUOLO)
// =========================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_")) {

    const modal = new ModalBuilder()
      .setCustomId(`motivo_${interaction.customId}`)
      .setTitle("Motivo");

    const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Scrivi il motivo")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

    const action = interaction.customId.replace("motivo_", "");
    const id = action.split("_")[1];

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(id);

    const tipo = userData.get(id)?.type;
    const motivo = interaction.fields.getTextInputValue("reason");

    if (action.startsWith("accetta_")) {
      await member.roles.add(RUOLI[tipo]);

      await member.send(`✅ Patente ACCETTATA\nMotivo: ${motivo}`);
    } else {
      await member.send(`❌ Patente RIFIUTATA\nMotivo: ${motivo}`);
    }

    return interaction.reply({
      content: `✔️ Azione eseguita da ${interaction.user.tag}\nMotivo: ${motivo}`
    });
  }

});

// =========================
// FUNZIONE QUIZ
// =========================
function sendQuiz(interaction, userId) {

  const data = userData.get(userId);
  const domande = quiz[data.type];

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  domande.slice(0, 5).forEach((d, i) => {
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
