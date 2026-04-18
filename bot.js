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

// ================= SAFE REPLY =================
const safeReply = async (interaction, data) => {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(data);
    }
    return await interaction.reply(data);
  } catch (e) {
    console.log("reply error:", e);
  }
};

// ================= READY =================
client.once("ready", async () => {

  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#87CEFA")
    .setDescription(`•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

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

**📄INFORMAZIONI PATENTE📄**
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1) Inviare il quiz per la patente che volete fare e attendere che lo staff member lo corregga***

**2) Inviare 3k in game all'id Lessimanuardi123 e inviare la foto su PAGAMENTI PATENTE e attendere che lo staff member applichi la tipologia di patente desiderata***

**3) Invitiamo tutti a fare la patente per viaggiare in maniera sicura e in maniera indipendente, Il consiglio che possiamo è quando vi ferma un agente delle FDO per una controllo dovete fornire il nome discord e per vedere se avete la tipologia di patente per la quale state usando il veicolo se vi vedranno senza patente dovrete pagare __**1k di multa**__`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= INTERACTION FIX (NO CRASH) =================
client.on("interactionCreate", async interaction => {

try {

  if (!interaction.isRepliable()) return;

  // ================= START =================
  if (interaction.isButton() && interaction.customId === "start") {

    const member = interaction.member;

    if (
      member.roles.cache.has(RUOLI.A) ||
      member.roles.cache.has(RUOLI.B) ||
      member.roles.cache.has(RUOLI.CD)
    ) {
      return safeReply(interaction, {
        content: "❌ Hai già una patente attiva.",
        flags: 64
      });
    }

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

    return safeReply(interaction, {
      content: "Seleziona patente:",
      components: [menu],
      flags: 64
    });
  }

  // ================= SELECT =================
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

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

  // ================= QUIZ =================
  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);
    if (!data) return;

    data.answers = QUESTIONS[data.type].map((_, i) =>
      interaction.fields.getTextInputValue(`q${i}`)
    );

    data.waitingPhoto = true;

    return safeReply(interaction, {
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

  const id = msg.author.id + Date.now();

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: buffer
  });

  userData.delete(msg.author.id);

  const qa = data.answers.map((a,i)=>
`• ${QUESTIONS[data.type][i]}
➜ ${a}`
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

📸 Stato: foto ricevuta`
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

// ================= STAFF =================
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

// ================= FINAL DOCS =================
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
      { name: "👤 UTENTE", value: `<@${req.userId}>` },
      { name: "🚗 PATENTE", value: req.type },
      { name: "📋 DOMANDE E RISPOSTE", value: qa },
      {
        name: action === "accetta" ? "✅ ACCETTATO DA" : "❌ RIFIUTATO DA",
        value: `<@${interaction.user.id}>`
      },
      { name: "📝 MOTIVO", value: reason },
      { name: "━━━━━━━━━━━━━━", value: `📸 ${now}` }
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
