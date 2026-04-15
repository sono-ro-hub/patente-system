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
let messageSent = false;

// =========================
// TESTO INIZIALE (NON MODIFICATO)
// =========================
const INFO = `•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋Tipi di patente
__🅰️ Patente A__
Consente la guida di __motocicli__ e veicoli a due ruote.
__🅱️ Patente B__
Permette di guidare __autovetture__ e veicoli leggeri. 
__🅲 Patente C-D__
Permette di far guidare __camion__, __pullman__ o __autobus__, utili per il trasporto delle merci e delle persone.

━━━━━━━━━━━━━━━━━━
__📝Condizioni richieste__

• Essere un __cittadino__ registrato e approvato all’interno del server  
• Avere un __comportamento civile__ e rispettoso delle regole RP  
• Non essere __soggetto__ a __sospensioni__ o provvedimenti attivi  
• Dimostrare una __conoscenza adeguata__ delle norme di circolazione    

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.`;

// =========================
// INFO DOPO SCELTA
// =========================
const INFO2 = `__**INFORMAZIONI PATENTE**__

1) Completa il quiz  
2) Invia 3k a lessimanuardi123  
3) Carica screenshot del pagamento  
4) Attendi lo staff che lo corregga.`;

// =========================
// QUIZ COMPLETO
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari anche di giorno?",
    "Rallentare prima della curva?",
    "Si può guidare senza patente?",
    "Strada bagnata = frenata lunga?",
    "Contromano è permesso?",
    "Le frecce servono?",
    "Casco va allacciato?",
    "Limite città 50?",
    "Clacson solo emergenza?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso = stop?",
    "Cellulare senza vivavoce?",
    "Fari notte obbligatori?",
    "Limite autostrada 130?",
    "Sorpasso linea continua?",
    "Precedenza a destra?",
    "Seggiolino bambini?",
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
    "Uso fari?",
    "Carico sicuro?",
    "Velocità ridotta?"
  ]
};

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!messageSent) {
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(INFO);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Primary)
    );

    await ch.send({ embeds: [embed], components: [row] });
    messageSent = true;
  }
});

// =========================
// INTERACTIONS
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
        embeds: [new EmbedBuilder().setColor("Blue").setDescription(INFO2)],
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
        answers: [],
        finished: false
      });

      return sendQuiz(interaction, interaction.user.id);
    }

    // QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      await interaction.deferReply({ ephemeral: true });

      const data = userData.get(interaction.user.id);

      interaction.fields.fields.forEach(f => {
        data.answers.push(f.value);
      });

      data.step += 5;

      if (data.step < quiz[data.type].length) {
        await interaction.followUp({ content: "➡️ Prossime domande..." });
        return sendQuiz(interaction, interaction.user.id);
      }

      data.finished = true;

      return interaction.followUp({
        content: "💰 Quiz completato!\n📸 Invia QUI la foto del pagamento (allegato)",
      });
    }

    // STAFF BUTTON
    if (interaction.isButton()) {

      if (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_")) {

        const modal = new ModalBuilder()
          .setCustomId(`motivo_${interaction.customId}`)
          .setTitle("Motivo");

        const input = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Scrivi il motivo")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }
    }

    // MOTIVO
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const action = interaction.customId.replace("motivo_", "");
      const id = action.split("_")[1];
      const motivo = interaction.fields.getTextInputValue("reason");

      const guild = await client.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(id);

      const tipo = userData.get(id)?.type;

      if (action.startsWith("accetta_")) {
        await member.roles.add(RUOLI[tipo]);
      }

      await member.send(
        action.startsWith("accetta_")
          ? `✅ Patente ACCETTATA\nMotivo: ${motivo}`
          : `❌ Patente RIFIUTATA\nMotivo: ${motivo}`
      );

      return interaction.reply({
        content: `Operazione completata\nMotivo: ${motivo}`
      });
    }

  } catch (e) {
    console.log(e);
  }
});

// =========================
// QUIZ FUNCTION
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
          .setRequired(true)
      )
    );
  });

  return interaction.showModal(modal);
}

// =========================
// FOTO PAGAMENTO
// =========================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.finished) return;

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

  msg.reply("✅ Inviato allo staff!");

  userData.delete(msg.author.id);
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
