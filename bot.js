// =========================
// KEEP ALIVE
// =========================
require("http").createServer((req, res) => {
  res.end("OK");
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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
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
// TESTO (NON TOCCATO)
// =========================
const START_TEXT = `•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

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
• Essere cittadino registrato  
• Comportamento civile  
• Nessuna sospensione  
• Conoscenza circolazione  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporta rifiuto`;

// =========================
// INFO
// =========================
const INFO = `
__INFORMAZIONI PATENTE__

1) Completa il quiz  
2) Invia 3k a Lessimanuardi123  
3) Carica screenshot  
4) Attendi staff
`;

// =========================
// QUIZ
// =========================
const quiz = {
  A: ["Casco obbligatorio?", "Fari giorno?", "Curva rallentare?", "Patente obbligatoria?", "Strada bagnata?", "Contromano?", "Limite città?", "Freccia?", "Clacson?", "Sorpasso destra?"],
  B: ["Cintura?", "Rosso stop?", "Cellulare?", "Fari notte?", "Autostrada 130?", "Linea continua?", "Distanza?", "Seggiolino?", "Precedenza?", "Parcheggio vietato?"],
  CD: ["Limite camion?", "Rosso?", "Ambulanza?", "Freno motore?", "Distanza?", "Parcheggio?", "Segnale?", "Velocità?", "Carico?", "Corsie?"]
};

// =========================
// READY (ANTI SPAM)
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);
  const msgs = await ch.messages.fetch({ limit: 10 });

  const giàPresente = msgs.find(m =>
    m.author.id === client.user.id &&
    m.components.length > 0
  );

  if (giàPresente) return; // 🔥 STOP SPAM

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
});

// =========================
// QUIZ MODAL
// =========================
function openQuiz(interaction, userId) {
  const data = userData.get(userId);
  const domande = quiz[data.type].slice(data.step, data.step + 5);

  const modal = new ModalBuilder()
    .setCustomId("quiz_modal")
    .setTitle("Quiz");

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

  interaction.showModal(modal);
}

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async interaction => {

  try {

    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(INFO);

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Seleziona patente")
          .addOptions([
            { label: "A", value: "A" },
            { label: "B", value: "B" },
            { label: "C-D", value: "CD" }
          ])
      );

      return interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
    }

    if (interaction.isStringSelectMenu()) {

      userData.set(interaction.user.id, {
        type: interaction.values[0],
        step: 0,
        answers: []
      });

      return openQuiz(interaction, interaction.user.id);
    }

    if (interaction.isModalSubmit() && interaction.customId === "quiz_modal") {

      await interaction.deferUpdate(); // 🔥 FIX ERRORE

      const data = userData.get(interaction.user.id);

      interaction.fields.fields.forEach(f => {
        data.answers.push(f.value);
      });

      data.step += 5;

      if (data.step < quiz[data.type].length) {
        return openQuiz(interaction, interaction.user.id); // 🔥 CONTINUA
      }

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pay")
          .setLabel("📸 Carica pagamento")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.followUp({
        content: "Quiz completato!",
        components: [btn],
        ephemeral: true
      });
    }

    if (interaction.isButton() && interaction.customId === "pay") {

      userData.get(interaction.user.id).awaitPhoto = true;

      return interaction.reply({
        content: "Invia la foto qui (allegato Discord)",
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// =========================
// FOTO
// =========================
client.on("messageCreate", async msg => {

  if (!msg.attachments.size) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.awaitPhoto) return;

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("NUOVA PATENTE")
    .setDescription(`Utente: <@${msg.author.id}>\nTipo: ${data.type}`)
    .setImage(msg.attachments.first().url);

  await staff.send({ embeds: [embed] });

  msg.reply("Inviato allo staff!");
  data.awaitPhoto = false;
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
