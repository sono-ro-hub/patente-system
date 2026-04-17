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

// ================= CONFIG =================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";
const CANALE_PATENTI = "1493595963942768860";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// ================= MEMORY =================
const userData = new Map();

// ================= KEEP ALIVE =================
require("http").createServer((req, res) => res.end("OK")).listen(process.env.PORT || 3000);

// ================= INFO =================
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
Permette di far guidare __camion__, __pullman__ o __autobus__.

━━━━━━━━━━━━━━━━━━
__📝Condizioni richieste__

• Essere un __cittadino__ registrato
• Comportamento civile
• Nessuna sospensione attiva
• Conoscenza regole circolazione

━━━━━━━━━━━━━━━━━━
⚠️ Rifiuto automatico se non conforme.
`;

// ================= QUIZ =================
const QUIZ = {
  A: [
    "Casco obbligatorio?",
    "Fari anche di giorno?",
    "Rallentare in curva?",
    "Guanti obbligatori?",
    "Frenata su bagnato più lunga?",
    "Freno anteriore più forte?",
    "Sorpasso a destra vietato?",
    "Pneumatici lisci sicuri?",
    "Freccia obbligatoria?",
    "Casco allacciato?",
    "Contromano permesso?",
    "Limite urbano 50?",
    "Senza patente si guida?",
    "Pioggia aumenta distanza?",
    "Clacson solo emergenza?"
  ],

  B: [
    "Casco in auto?",
    "Limite urbano 50?",
    "Cintura obbligatoria?",
    "Linea continua sorpasso?",
    "Distanza sicurezza serve?",
    "Rosso = stop?",
    "Telefono senza vivavoce?",
    "Fari di notte?",
    "Frenata bagnato più lunga?",
    "Seggiolino bambini?",
    "Precedenza a destra?",
    "Parcheggio vietato segnalato?",
    "Sorpasso obbligatorio a sinistra?",
    "Rispetto limiti?",
    "Autostrada 130?"
  ],

  CD: [
    "Limite camion città?",
    "Semaforo rosso?",
    "Precedenza incroci?",
    "Anabbaglianti quando?",
    "Ambulanza come comportarsi?",
    "Veicolo persone?",
    "Distanza sicurezza?",
    "Freno motore?",
    "Dove parcheggiano camion?",
    "Segnale camion?"
  ]
};

// ================= STEP =================
function getStep(type, step) {
  return (QUIZ[type] || []).slice(step * 5, step * 5 + 5);
}

// ================= READY =================
client.once("ready", async () => {
  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription(INFO);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= INTERACTIONS =================
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
        content: "Seleziona patente:",
        components: [menu],
        ephemeral: true
      });
    }

    // SELECT
    if (interaction.isStringSelectMenu()) {

      userData.set(interaction.user.id, {
        type: interaction.values[0],
        step: 0,
        answers: [],
        waitingUpload: false
      });

      return openQuiz(interaction);
    }

    // QUIZ SUBMIT
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return interaction.reply({ content: "Sessione scaduta", ephemeral: true });

      for (let i = 0; i < 5; i++) {
        data.answers.push(interaction.fields.getTextInputValue(`q${i}`));
      }

      data.step++;

      const next = getStep(data.type, data.step);

      if (next.length === 0) {

        data.waitingUpload = true;

        return interaction.reply({
          content: "✔️ Quiz finito! Ora invia la foto pagamento nel canale patenti (usa +)",
          ephemeral: true
        });
      }

      return openQuiz(interaction);
    }

  } catch (err) {
    console.log("ERROR:", err);
  }
});

// ================= OPEN QUIZ =================
function openQuiz(interaction) {

  const data = userData.get(interaction.user.id);
  const questions = getStep(data.type, data.step);

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  questions.forEach((q, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`q${i}`)
          .setLabel(q.slice(0, 45))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
  });

  return interaction.showModal(modal);
}

// ================= FOTO =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingUpload) return;

  if (msg.channel.id !== CANALE_PATENTI) return;

  try { await msg.delete(); } catch {}

  const img = msg.attachments.first();
  if (!img) return;

  data.paymentImage = img.url;

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .addFields(
      { name: "Patente", value: data.type },
      { name: "Risposte", value: data.answers.join("\n").slice(0, 1024) }
    )
    .setImage(img.url);

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

  userData.delete(msg.author.id);
});

// ================= STAFF =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("accetta_") &&
      !interaction.customId.startsWith("rifiuta_")) return;

  const id = interaction.customId.split("_")[1];
  const member = await interaction.guild.members.fetch(id).catch(() => null);

  const status = interaction.customId.startsWith("accetta_")
    ? "APPROVATA"
    : "RIFIUTATA";

  const log = new EmbedBuilder()
    .setTitle(`📄 PATENTE ${status}`)
    .setColor(status === "APPROVATA" ? "Green" : "Red");

  if (member) {
    const data = userData.get(id);

    if (status === "APPROVATA") {
      await member.roles.add(RUOLI[data.type]);
      await member.send("✅ Patente approvata");
    } else {
      await member.send("❌ Patente rifiutata");
    }
  }

  return interaction.reply({ content: "✔️ Fatto", ephemeral: true });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
