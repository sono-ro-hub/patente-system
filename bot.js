require("http").createServer((req, res) => res.end("OK")).listen(3000);

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
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// CONFIG
const config = {
  canaleRichieste: "1493595963942768860",
  canaleStaff: "1493597555760824503",
  guildId: "1484912853126221896"
};

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// MEMORY
const userData = new Map();
let sent = false;

// =========================
// INFO (COME HAI CHIESTO IDENTICO)
// =========================
const INFO = `
•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

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
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.
`;

// QUIZ PIÙ LUNGO (COME VOLEVI)
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari sempre accesi?",
    "Rallentare in curva?",
    "Contromano permesso?",
    "Frenata su bagnato?",
    "Serve patente?",
    "Uso cellulare consentito?",
    "Limite città?",
    "Sorpasso a destra?",
    "Freno anteriore più forte?",
    "Casco allacciato?",
    "Distanza sicurezza?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso stop?",
    "Cellulare vietato?",
    "Fari notte?",
    "Limite autostrada?",
    "Sorpasso linea continua?",
    "Precedenza a destra?",
    "Seggiolino bambini?",
    "Parcheggio vietato segnalato?",
    "Distanza sicurezza?",
    "Uso clacson?",
    "Guida distratta?"
  ],
  CD: [
    "Limite camion città?",
    "Ambulanza priorità?",
    "Freno motore cos’è?",
    "Distanza sicurezza?",
    "Parcheggio camion?",
    "Segnale camion?",
    "Carico massimo?",
    "Uso tachigrafo?",
    "Velocità autostrada?",
    "Discesa lunga come si guida?"
  ]
};

// READY
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

// INTERACTION
client.on("interactionCreate", async (interaction) => {

  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      return interaction.reply({
        content: "Seleziona patente",
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select")
              .setPlaceholder("Scegli patente")
              .addOptions([
                { label: "Patente A", value: "A" },
                { label: "Patente B", value: "B" },
                { label: "Patente C-D", value: "CD" }
              ])
          )
        ],
        ephemeral: true
      });
    }

    // SELECT
    if (interaction.isStringSelectMenu()) {

      userData.set(interaction.user.id, {
        type: interaction.values[0],
        step: 0,
        answers: []
      });

      return sendQuiz(interaction);
    }

    // QUIZ SUBMIT
    if (interaction.isModalSubmit() && interaction.customId.startsWith("quiz_")) {

      const data = userData.get(interaction.user.id);

      const risposte = Object.values(interaction.fields.fields).map(f => f.value);

      data.answers.push(...risposte);
      data.step += 6;

      if (data.step >= quiz[data.type].length) {

        return interaction.reply({
          content: "📸 ORA INVIA IL PAGAMENTO (3K)\n\n👉 Carica il file immagine nel CANALE PRIVATO DEL BOT",
          ephemeral: true
        });
      }

      return sendQuiz(interaction);
    }

  } catch (e) {
    console.log(e);
  }
});

// =========================
// QUIZ A BLOCCHI
// =========================
function sendQuiz(interaction) {

  const data = userData.get(interaction.user.id);

  const domande = quiz[data.type].slice(data.step, data.step + 6);

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
