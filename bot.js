const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// 🌐 SERVER RENDER
app.get("/", (req, res) => res.send("Bot online"));
app.listen(PORT, () => console.log("🌐 Server attivo " + PORT));

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ⚙️ CONFIG
const CHANNEL_RICHIESTE = "1493595963942768860";
const CHANNEL_STAFF = "1493597555760824503";
const RUOLO_PATENTE = "1492884347584385164";

// READY
client.once("clientReady", async () => {
  console.log("🤖 Bot pronto " + client.user.tag);

  const channel = await client.channels.fetch(CHANNEL_RICHIESTE);

  const embed = new EmbedBuilder()
    .setTitle("🚗 RICHIESTA PATENTE")
    .setDescription("Premi il bottone per iniziare");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("richiedi")
      .setLabel("📄 Richiedi patente")
      .setStyle(ButtonStyle.Primary)
  );

  channel.send({ embeds: [embed], components: [row] });
});

// INTERAZIONI
client.on("interactionCreate", async interaction => {

  // 📌 CLICK RICHIEDI
  if (interaction.isButton() && interaction.customId === "richiedi") {

    const embed = new EmbedBuilder()
      .setTitle("📄 INFORMAZIONI PATENTE")
      .setDescription(`
__**INFORMAZIONI PATENTE**__

1) Fai il quiz  
2) Paga 3k  
3) Invia screenshot  
4) Attendi staff

Multa senza patente: **1k**
`);

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("scelta_patente")
        .setPlaceholder("Scegli patente")
        .addOptions([
          { label: "Patente A", value: "A" },
          { label: "Patente B", value: "B" },
          { label: "Patente C-D", value: "CD" }
        ])
    );

    return interaction.reply({
      embeds: [embed],
      components: [menu],
      ephemeral: true
    });
  }

  // 📋 SCELTA PATENTE
  if (interaction.isStringSelectMenu()) {
    const tipo = interaction.values[0];

    let domande = "";

    if (tipo === "A") {
      domande = `
**PATENTE A**
1. Casco obbligatorio?
2. Fari di giorno?
3. Frenata più lunga su bagnato?
4. Posso guidare senza patente?
5. Limite città 50km/h?
      `;
    }

    if (tipo === "B") {
      domande = `
**PATENTE B**
1. Cintura obbligatoria?
2. Semaforo rosso = stop?
3. Posso usare telefono?
4. Limite città 50km/h?
5. Frenata più lunga su bagnato?
      `;
    }

    if (tipo === "CD") {
      domande = `
**PATENTE C-D**
1. Limite camion città?
2. Ambulanza cosa fai?
3. Precedenza destra?
4. Luci quando usarle?
5. Dove parcheggiare camion?
      `;
    }

    const embed = new EmbedBuilder()
      .setTitle("🧠 QUIZ")
      .setDescription(domande + "\n\n📸 Invia anche SCREEN PAGAMENTO");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("invia_staff_" + tipo)
        .setLabel("📤 Invia allo staff")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }

  // 📤 INVIO STAFF
  if (interaction.isButton() && interaction.customId.startsWith("invia_staff_")) {
    const tipo = interaction.customId.split("_")[2];

    const staff = await client.channels.fetch(CHANNEL_STAFF);

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA")
      .setDescription(`
Utente: <@${interaction.user.id}>
Patente: ${tipo}

📸 Controlla pagamento + risposte
      `);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("accetta_" + interaction.user.id)
        .setLabel("✅ Accetta")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("rifiuta")
        .setLabel("❌ Rifiuta")
        .setStyle(ButtonStyle.Danger)
    );

    staff.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📤 Inviato allo staff!",
      ephemeral: true
    });
  }

  // ✅ ACCETTA
  if (interaction.isButton() && interaction.customId.startsWith("accetta_")) {
    const userId = interaction.customId.split("_")[1];

    const member = await interaction.guild.members.fetch(userId);
    await member.roles.add(RUOLO_PATENTE);

    await interaction.update({
      content: "✅ APPROVATA + ruolo dato",
      components: []
    });
  }

  // ❌ RIFIUTA
  if (interaction.isButton() && interaction.customId === "rifiuta") {
    await interaction.update({
      content: "❌ RIFIUTATA",
      components: []
    });
  }
});

// LOGIN
client.login(process.env.TOKEN);
