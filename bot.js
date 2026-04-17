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

// ================= CONFIG (DAL TUO SCRIPT) =================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";
const CANALE_PATENTI = "1493595963942768860"; // (se è lo stesso canale, ok)

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();

// ================= KEEP ALIVE =================
require("http").createServer((req, res) => res.end("OK")).listen(3000);

// ================= INFO (COME HAI CHIESTO) =================
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

// ================= QUIZ (DAL TUO SCRIPT) =================
const QUIZ = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima di entrarci?",
    "Posso guidare senza guanti?",
    "Su strada bagnata la frenata è più lunga?",
    "Il freno anteriore è più potente?",
    "È vietato superare a destra?",
    "Pneumatici lisci sono sicuri?",
    "La freccia è obbligatoria?",
    "Il casco deve essere allacciato?",
    "Posso guidare contromano?",
    "Il limite urbano è 50 km/h?",
    "Si può guidare senza patente?",
    "Con pioggia aumenta distanza?",
    "Il clacson è solo per emergenza?"
  ],

  B: [
    "Il casco è obbligatorio in auto?",
    "In città il limite è 50 km/h?",
    "La cintura va sempre allacciata?",
    "Posso sorpassare con linea continua?",
    "La distanza di sicurezza serve?",
    "Il semaforo rosso significa stop?",
    "Posso usare telefono senza vivavoce?",
    "I fari vanno accesi di notte?",
    "La frenata sul bagnato è più lunga?",
    "I bambini devono usare seggiolini?",
    "La precedenza a destra vale sempre?",
    "Il parcheggio vietato è segnalato?",
    "Il sorpasso a sinistra è obbligatorio?",
    "Bisogna rispettare i limiti?",
    "Autostrada limite 130 km/h?"
  ],

  CD: [
    "Limite camion in città?",
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando accendi anabbaglianti?",
    "Come comportarsi con ambulanza?",
    "Veicolo per più persone?",
    "Cos’è distanza sicurezza?",
    "Cos’è freno motore?",
    "Dove parcheggiano camion?",
    "Significato segnale camion?"
  ]
};

// ================= STEP =================
function getStep(type, step) {
  return QUIZ[type].slice(step * 5, step * 5 + 5);
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

// ================= START QUIZ =================
client.on("interactionCreate", async (interaction) => {

  try {

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

    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      return openQuiz(interaction, type, 0);
    }

    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      const answers = [];

      for (let i = 0; i < 5; i++) {
        answers.push(interaction.fields.getTextInputValue(`q${i}`));
      }

      data.answers.push(...answers);
      data.step++;

      const next = getStep(data.type, data.step);

      if (next.length === 0) {

        data.waitingUpload = true;

        return interaction.reply({
          content: "✔️ Quiz completato! Invia la foto pagamento con +",
          ephemeral: true
        });
      }

      return openQuiz(interaction, data.type, data.step);
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= MODAL =================
function openQuiz(interaction, type, step) {

  const questions = getStep(type, step);

  const data = userData.get(interaction.user.id);
  data.questions = questions;

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
      )
    );
  });

  return interaction.showModal(modal);
}

// ================= UPLOAD FOTO =================
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

// ================= STAFF ACTION =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith("accetta_") &&
      !interaction.customId.startsWith("rifiuta_")) return;

  const userId = interaction.customId.split("_")[1];
  const data = userData.get(userId);

  if (!data) return interaction.reply({ content: "Dati non trovati", ephemeral: true });

  const member = await interaction.guild.members.fetch(userId).catch(() => null);

  const status = interaction.customId.startsWith("accetta_") ? "APPROVATA" : "RIFIUTATA";

  const embed = new EmbedBuilder()
    .setTitle(`📄 PATENTE ${status}`)
    .setColor(status === "APPROVATA" ? "Green" : "Red")
    .addFields(
      { name: "Patente", value: data.type },
      { name: "Risposte", value: data.answers.join("\n").slice(0, 1024) }
    );

  if (data.paymentImage) embed.setImage(data.paymentImage);

  const log = await client.channels.fetch(CANALE_STAFF);
  await log.send({ embeds: [embed] });

  if (member) {
    if (status === "APPROVATA") {
      await member.roles.add(RUOLI[data.type]);
      await member.send("✅ Patente approvata");
    } else {
      await member.send("❌ Patente rifiutata");
    }
  }

  userData.delete(userId);

  return interaction.reply({ content: "✔️ Fatto", ephemeral: true });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
