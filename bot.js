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
    GatewayIntentBits.GuildMembers
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

// =========================
// TESTO INIZIALE (NON TOCCO)
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
• Avere un __comportamento civile__  
• Non essere __sospeso__  
• Conoscenza norme  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico.
`;

// =========================
// INFO DOPO SCELTA
// =========================
const INFO = `
INFORMAZIONI PATENTE

1) Completa il quiz  
2) Invia 3k a lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi lo staff
`;

// =========================
// QUIZ (CATENA)
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari di giorno?",
    "Rallentare in curva?",
    "Contromano permesso?",
    "Strada bagnata = frenata lunga?",
    "Frecce obbligatorie?",
    "Limite città 50?",
    "Clacson sempre?",
    "Moto senza patente?",
    "Pioggia aumenta rischio?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso = stop?",
    "Cellulare senza vivavoce?",
    "Fari notte obbligatori?",
    "Limite autostrada 130?",
    "Sorpasso linea continua?",
    "Precedenza a destra?",
    "Parcheggio vietato?",
    "Distanza sicurezza?",
    "Frecce obbligatorie?"
  ],
  CD: [
    "Limite camion città?",
    "Rosso cosa fai?",
    "Ambulanza priorità?",
    "Freno motore cos'è?",
    "Distanza sicurezza?",
    "Parcheggio camion?",
    "Segnale camion?",
    "Peso limite?",
    "Controllo freni?",
    "Uso luci?"
  ]
};

// =========================
// READY (NO SPAM)
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const messages = await ch.messages.fetch({ limit: 10 });
  const already = messages.find(m => m.author.id === client.user.id);

  if (!already) {
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(START_TEXT);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Primary)
    );

    await ch.send({ embeds: [embed], components: [row] });
  }
});

// =========================
// INTERAZIONI
// =========================
client.on("interactionCreate", async (interaction) => {

  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(INFO);

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Scegli patente")
          .addOptions([
            { label: "Patente A", value: "A" },
            { label: "Patente B", value: "B" },
            { label: "Patente C-D", value: "CD" }
          ])
      );

      return interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
    }

    // SCELTA PATENTE
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      return sendQuiz(interaction, interaction.user.id);
    }

    // RISPOSTE QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      await interaction.deferReply({ ephemeral: true });

      const data = userData.get(interaction.user.id);

      const values = [...interaction.fields.fields.values()].map(f => f.value);
      data.answers.push(...values);
      data.step += values.length;

      const total = quiz[data.type].length;

      if (data.step >= total) {

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("pay")
            .setLabel("Carica pagamento 3000")
            .setStyle(ButtonStyle.Success)
        );

        return interaction.editReply({
          content: "Quiz completato ✅ Ora invia pagamento.",
          components: [btn]
        });
      }

      await interaction.editReply({ content: "Carico prossimo modulo..." });

      setTimeout(() => {
        sendQuiz(interaction, interaction.user.id);
      }, 500);
    }

    // PAGAMENTO (ALLEGATO)
    if (interaction.isButton() && interaction.customId === "pay") {

      await interaction.reply({
        content: "📸 Invia lo screenshot QUI (allega immagine dal telefono)",
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.attachments.size > 0;

      const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

      collector.on("collect", async m => {

        const data = userData.get(interaction.user.id);
        const staff = await client.channels.fetch(CANALE_STAFF);

        const embed = new EmbedBuilder()
          .setColor("Blue")
          .setTitle("NUOVA PATENTE")
          .setDescription(`
👤 <@${interaction.user.id}>
Tipo: ${data.type}

Risposte:
${data.answers.join("\n")}
`)
          .setImage(m.attachments.first().url);

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

        await m.reply("✅ Inviato allo staff!");
        collector.stop();
      });
    }

    // STAFF
    if (interaction.isButton() && (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_"))) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Scrivi motivo")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return interaction.showModal(modal);
    }

    // RISPOSTA STAFF
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
    console.log("ERRORE:", e);
  }
});

// =========================
// FUNZIONE QUIZ
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
