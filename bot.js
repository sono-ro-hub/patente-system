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

const { QUIZ } = require("./quiz");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();
let sent = false;

const INFO = `🏛️ Dipartimento Trasporti — Sud Italy RP`;

client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!sent) {
    const embed = new EmbedBuilder()
      .setColor("Blue")
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
        content: "Seleziona la patente:",
        components: [menu],
        ephemeral: true
      });
    }

    // SELECT → QUIZ DINAMICO
    if (interaction.isStringSelectMenu() && interaction.customId === "select") {

      const type = interaction.values[0];
      userData.set(interaction.user.id, { type });

      const questions = QUIZ[type].slice(0, 5);

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      questions.forEach((q, i) => {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i + 1}`)
              .setLabel(q.slice(0, 45))
              .setStyle(TextInputStyle.Short)
          )
        );
      });

      return interaction.showModal(modal);
    }

    // QUIZ SUBMIT
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);

      data.answers = [
        interaction.fields.getTextInputValue("q1"),
        interaction.fields.getTextInputValue("q2"),
        interaction.fields.getTextInputValue("q3"),
        interaction.fields.getTextInputValue("q4"),
        interaction.fields.getTextInputValue("q5")
      ];

      return interaction.reply({
        content: "📸 Ora invia lo screenshot del pagamento.",
        ephemeral: true
      });
    }

    // STAFF BUTTON
    if (interaction.isButton() &&
        (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_"))) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Scrivi il motivo")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return interaction.showModal(modal);
    }

    // MOTIVO + RUOLO
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const action = interaction.customId.replace("motivo_", "");
      const id = action.split("_")[1];
      const reason = interaction.fields.getTextInputValue("reason");

      const member = await interaction.guild.members.fetch(id);
      const data = userData.get(id);

      if (!data) return interaction.reply({ content: "Errore dati", ephemeral: true });

      if (action.startsWith("accetta")) {
        await member.roles.add(RUOLI[data.type]);
        await member.send(`✅ Patente APPROVATA\nMotivo: ${reason}`);
      } else {
        await member.send(`❌ Patente RIFIUTATA\nMotivo: ${reason}`);
      }

      return interaction.reply({ content: "✔️ Fatto" });
    }

  } catch (err) {
    console.log(err);
  }
});

// FOTO
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  const img = msg.attachments.first();

  if (!data || !img) return;

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("NUOVA PATENTE")
    .setDescription(`👤 <@${msg.author.id}>`)
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

  await msg.reply("✅ Inviato allo staff");

  userData.delete(msg.author.id);
});

client.login(process.env.TOKEN);
