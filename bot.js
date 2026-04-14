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
• Avere un __comportamento civile__  
• Non essere __sospeso__  
• Conoscere le regole  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporta rifiuto.
`;

// =========================
// INFO DOPO CLICK
// =========================
const INFO_PATENTE = `
__**INFORMAZIONI PATENTE**__

1) Completa il quiz  
2) Invia 3k a Lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi staff  
`;

// =========================
// QUIZ (TANTE DOMANDE)
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari di giorno?",
    "Rallentare in curva?",
    "Si può guidare senza patente?",
    "Strada bagnata pericolosa?",
    "Contromano permesso?",
    "Limite città 50?",
    "Clacson emergenza?",
    "Freccia obbligatoria?",
    "Sorpasso a destra vietato?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso stop?",
    "Cellulare senza vivavoce?",
    "Fari notte obbligatori?",
    "Limite autostrada 130?",
    "Sorpasso linea continua?",
    "Distanza sicurezza?",
    "Seggiolino bambini?",
    "Precedenza a destra?",
    "Parcheggio vietato segnalato?"
  ],
  CD: [
    "Limite camion città?",
    "Cosa fai al rosso?",
    "Ambulanza priorità?",
    "Freno motore cos'è?",
    "Distanza sicurezza?",
    "Parcheggio camion?",
    "Segnale camion?",
    "Velocità extraurbana?",
    "Carico massimo?",
    "Uso corsie?"
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
      .setColor("Blue")
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
// QUIZ FUNCTION
// =========================
function getBlock(type, step) {
  return quiz[type].slice(step, step + 5);
}

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {
  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(INFO_PATENTE);

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

    // SELECT
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      const domande = getBlock(type, 0);

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📋 QUIZ")
        .setDescription(domande.map((d, i) => `**${i+1}) ${d}**`).join("\n"));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("quiz_next")
          .setLabel("Rispondi")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // APRI MODAL QUIZ
    if (interaction.isButton() && interaction.customId === "quiz_next") {

      const modal = new ModalBuilder()
        .setCustomId("quiz_modal")
        .setTitle("Risposte");

      const input = new TextInputBuilder()
        .setCustomId("answers")
        .setLabel("Scrivi risposte (1-5)")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // SUBMIT QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz_modal") {

      const data = userData.get(interaction.user.id);
      const risposte = interaction.fields.getTextInputValue("answers");

      data.answers.push(risposte);
      data.step += 5;

      const next = getBlock(data.type, data.step);

      if (next.length === 0) {

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("pay")
            .setLabel("📸 Carica pagamento 3000")
            .setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
          content: "Quiz completato!",
          components: [btn],
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📋 PROSSIME DOMANDE")
        .setDescription(next.map((d, i) => `**${i+1}) ${d}**`).join("\n"));

      return interaction.reply({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("quiz_next")
              .setLabel("Continua")
              .setStyle(ButtonStyle.Primary)
          )
        ],
        ephemeral: true
      });
    }

    // PAGAMENTO
    if (interaction.isButton() && interaction.customId === "pay") {

      userData.get(interaction.user.id).awaitPhoto = true;

      return interaction.reply({
        content: "Invia ora la foto QUI in chat (allegato Discord)",
        ephemeral: true
      });
    }

    // STAFF BUTTON
    if (interaction.isButton() &&
      (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_"))
    ) {

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

    // MOTIVO
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
        content: `${action.startsWith("accetta_") ? "ACCETTATO" : "RIFIUTATO"}\nMotivo: ${interaction.fields.getTextInputValue("reason")}`
      });
    }

  } catch (err) {
    console.log("ERRORE:", err);
  }
});

// =========================
// FOTO HANDLER
// =========================
client.on("messageCreate", async (msg) => {

  if (!msg.attachments.size) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.awaitPhoto) return;

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("NUOVA PATENTE")
    .setDescription(`
Utente: <@${msg.author.id}>
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

  msg.reply("Richiesta inviata allo staff!");
  data.awaitPhoto = false;
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
