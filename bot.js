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
const CANALE_FOTO = "1494066451152240650";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();
const pending = new Map();

require("http").createServer((req,res)=>res.end("OK"))
.listen(process.env.PORT || 3000);

// ================= DOMANDE =================
const QUESTIONS = {
A:[
"Il casco è obbligatorio quando guidi la moto?",
"I fari devono essere accesi anche di giorno?",
"In curva bisogna rallentare prima di entrarci?",
"Posso guidare senza guanti?",
"Su strada bagnata la frenata è più lunga?"
],
B:[
"Il casco è obbligatorio in auto?",
"In città il limite è 50 km/h?",
"La cintura va sempre allacciata?",
"Posso sorpassare con linea continua?",
"La distanza di sicurezza serve?"
],
CD:[
"Limite camion in città?",
"Cosa fai al semaforo rosso?",
"Chi ha precedenza agli incroci?",
"Quando accendi anabbaglianti?",
"Come comportarsi con ambulanza?"
]
};

// ================= READY =================
client.once("ready", async () => {

  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#87CEFA")
    .setDescription(`• 🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente
__🅰️ Patente A__
Consente la guida di motocicli e veicoli a due ruote.

__🅱️ Patente B__
Permette la guida di autovetture e veicoli leggeri.

__🅲 Patente C-D__
Permette la guida di camion, pullman e autobus.

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• cittadinanza valida  
• comportamento RP corretto  
• nessuna sospensione attiva  
• conoscenza codice stradale  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporta rifiuto automatico.

📄 INFORMAZIONI PATENTE
1) Svolgere quiz  
2) Pagare 3k  
3) Inviare foto pagamento  
4) Attendere staff
`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= START =================
client.on("interactionCreate", async interaction => {

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
      flags: 64
    });
  }

  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    const member = interaction.member;
    if (member.roles.cache.has(RUOLI[type])) {
      return interaction.reply({
        content: "❌ Hai già questa patente.",
        flags: 64
      });
    }

    userData.set(interaction.user.id, {
      type,
      answers: []
    });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    QUESTIONS[type].forEach((q, i) => {
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

  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);
    if (!data) return;

    data.answers = QUESTIONS[data.type].map((_, i) =>
      interaction.fields.getTextInputValue(`q${i}`)
    );

    data.waitingPhoto = true;

    return interaction.reply({
      content: `📸 Invia la foto nel canale <#${CANALE_FOTO}>`,
      flags: 64
    });
  }

} catch (err) {
  console.log(err);
}
});

// ================= FOTO =================
client.on("messageCreate", async msg => {

try {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_FOTO) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const res = await fetch(attachment.url);
  const buffer = Buffer.from(await res.arrayBuffer());

  const id = msg.author.id + "-" + Date.now();

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: buffer
  });

  userData.delete(msg.author.id);

  const qa = data.answers.map((a,i)=>
`**${QUESTIONS[data.type][i]}**
${a}`
  ).join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .addFields({
      name: "📊 RICHIESTA",
      value:
`🚗 Patente: ${data.type}

📋 DOMANDE E RISPOSTE:
${qa}

📸 Stato: ricevuta`
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accetta_${id}`)
      .setLabel("ACCETTA")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`rifiuta_${id}`)
      .setLabel("RIFIUTA")
      .setStyle(ButtonStyle.Danger)
  );

  const staff = await client.channels.fetch(CANALE_STAFF);

  await staff.send({
    embeds: [embed],
    components: [row],
    files: [
      {
        attachment: buffer,
        name: "pagamento.png"
      }
    ]
  });

} catch (err) {
  console.log(err);
}
});

// ================= STAFF FINAL =================
client.on("interactionCreate", async interaction => {

try {

  if (!interaction.isButton()) return;

  if (
    !interaction.customId.startsWith("accetta_") &&
    !interaction.customId.startsWith("rifiuta_")
  ) return;

  const action = interaction.customId.split("_")[0];
  const id = interaction.customId.replace(`${action}_`, "");

  const req = pending.get(id);
  if (!req) return;

  const modal = new ModalBuilder()
    .setCustomId(`motivo_${action}_${id}`)
    .setTitle("Motivo obbligatorio");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Scrivi il motivo")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
    )
  );

  return interaction.showModal(modal);

} catch (err) {
  console.log(err);
}
});

// ================= FINAL UPDATE =================
client.on("interactionCreate", async interaction => {

try {

  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("motivo_")) return;

  const [, action, id] = interaction.customId.split("_");

  const req = pending.get(id);
  if (!req) return;

  const reason = interaction.fields.getTextInputValue("reason");

  const member = await interaction.guild.members.fetch(req.userId).catch(() => null);

  const decision = action === "accetta" ? "APPROVATA" : "RIFIUTATA";

  const now = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome"
  });

  const qa = req.answers.map((a,i)=>
`**${QUESTIONS[req.type][i]}**
${a}`
  ).join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle(`📄 PATENTE ${decision}`)
    .setColor(decision === "APPROVATA" ? "Green" : "Red")
    .addFields(
      {
        name: "👤 UTENTE",
        value: `<@${req.userId}>`
      },
      {
        name: "🚗 PATENTE",
        value: req.type
      },
      {
        name: "📋 DOMANDE E RISPOSTE",
        value: qa
      },
      {
        name: action === "accetta" ? "✅ ACCETTATO DA" : "❌ RIFIUTATO DA",
        value: `<@${interaction.user.id}>`
      },
      {
        name: "📝 MOTIVO",
        value: reason
      }
    )
    .setImage("attachment://pagamento.png");

  const staff = await client.channels.fetch(CANALE_STAFF);

  await staff.send({
    embeds: [embed],
    files: [
      {
        attachment: req.photo,
        name: "pagamento.png"
      }
    ]
  });

  if (member && action === "accetta") {
    await member.roles.add(RUOLI[req.type]);
  }

  pending.delete(id);

  return interaction.reply({
    content: "✔ Fatto",
    flags: 64
  });

} catch (err) {
  console.log(err);
}
});

client.login(process.env.TOKEN);
