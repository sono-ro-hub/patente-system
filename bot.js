const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const express = require("express");
const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// 🔧 CONFIG
const CHANNEL_RICHIESTE = "1493595963942768860";
const CHANNEL_STAFF = "1493597555760824503";
const ROLE_PATENTE = "1492884347584385164";

// 🌐 KEEP ALIVE
app.get("/", (req, res) => res.send("Bot online"));
app.listen(process.env.PORT || 3000);

// 📦 DATI
const richieste = new Map();

// ================= READY =================
client.once("clientReady", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_RICHIESTE);

  const embed = new EmbedBuilder()
    .setTitle("📄INFORMAZIONI PATENTE📄")
    .setDescription(`__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente***

1) Inviare il quiz su MODULI-PATENTE  
2) Pagare 3k a Lessimanuardi123  
3) Inviare prova pagamento  

⚠️ Senza patente multa 1k`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("richiedi_patente")
      .setLabel("📄 Richiedi patente")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

// ================= BUTTON =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // 🚫 ANTI SPAM
  if (richieste.has(userId)) {
    return interaction.reply({
      content: "❌ Hai già una richiesta in corso!",
      ephemeral: true
    });
  }

  // 📌 RICHIEDI
  if (interaction.customId === "richiedi_patente") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("patente_A")
        .setLabel("🏍 Patente A")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("patente_B")
        .setLabel("🚗 Patente B")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("patente_CD")
        .setLabel("🚚 Patente C-D")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "Scegli la patente:",
      components: [row],
      ephemeral: true
    });
  }

  // ================= QUIZ =================

  let quiz = "";

  if (interaction.customId === "patente_A") {
    quiz = `🏍 **PATENTE A**

1. Il casco è obbligatorio?
2. I fari accesi di giorno?
3. Rallentare prima curva?
4. Posso guidare senza guanti?
5. Frenata più lunga su bagnato?
6. Freno anteriore più potente?
7. Vietato sorpasso a destra?
8. Pneumatici lisci sicuri?
9. Freccia serve?
10. Casco allacciato?
11. Posso contromano?
12. Limite 50 città?
13. Senza patente posso guidare?
14. Pioggia → distanza?
15. Clacson solo pericolo?`;
  }

  if (interaction.customId === "patente_B") {
    quiz = `🚗 **PATENTE B**

1. Casco obbligatorio auto?
2. Limite 50?
3. Cintura sempre?
4. Sorpasso linea continua?
5. Distanza sicurezza?
6. Rosso = stop?
7. Cellulare senza vivavoce?
8. Fari notte?
9. Frenata bagnato?
10. Bambini seggiolino?
11. Precedenza destra?
12. Segnale blu barra rossa?
13. Sorpasso sempre sinistra?
14. Limiti obbligatori?
15. Autostrada 130?`;
  }

  if (interaction.customId === "patente_CD") {
    quiz = `🚚 **PATENTE C-D**

1) Limite città?
2) Rosso cosa fai?
3) Precedenza?
4) Luci quando?
5) Ambulanza?
6) Veicolo per più persone?
7) Distanza sicurezza?
8) Freno camion?
9) Dove parcheggiare?
10) Segnale camion?`;
  }

  if (quiz !== "") {
    richieste.set(userId, interaction.customId);

    const embed = new EmbedBuilder()
      .setTitle("📋 QUIZ PATENTE")
      .setDescription(quiz);

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  // ================= INVIO STAFF =================
  if (interaction.customId === "invia_staff") {

    const tipo = richieste.get(userId);

    const channel = await client.channels.fetch(CHANNEL_STAFF);

    const embed = new EmbedBuilder()
      .setTitle("🚗 RICHIESTA PATENTE")
      .setDescription(`Utente: <@${userId}>\nTipo: ${tipo}`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accetta_${userId}`)
        .setLabel("✅ Accetta")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`rifiuta_${userId}`)
        .setLabel("❌ Rifiuta")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📤 Inviato allo staff",
      ephemeral: true
    });
  }

  // ================= STAFF =================
  if (interaction.customId.startsWith("accetta_")) {
    const id = interaction.customId.split("_")[1];
    const member = await interaction.guild.members.fetch(id);

    await member.roles.add(ROLE_PATENTE);
    richieste.delete(id);

    return interaction.update({
      content: "✅ Patente APPROVATA",
      components: []
    });
  }

  if (interaction.customId.startsWith("rifiuta_")) {
    const id = interaction.customId.split("_")[1];

    richieste.delete(id);

    return interaction.update({
      content: "❌ Patente RIFIUTATA",
      components: []
    });
  }
});

// LOGIN
client.login(process.env.TOKEN);
