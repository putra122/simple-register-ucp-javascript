const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes, SlashCommandBuilder } = require('discord.js');

const mysql = require('mysql');

const config = require('./config.json');



const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMessages,

    GatewayIntentBits.MessageContent,

    GatewayIntentBits.GuildMembers,

  ],

});



const connection = mysql.createConnection(config.database);



connection.connect((err) => {

  if (err) {

    console.error('Error connecting to database:', err);

    return;

  }

  console.log('Connected to database');

});



client.on('ready', async () => {

  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setActivity('HappyLand Roleplay', { type: 'PLAYING' });



  // Register slash command

  const commands = [

    new SlashCommandBuilder()

      .setName('createucpbutton')

      .setDescription('Create a UCP button'),

  ];



  const rest = new REST({ version: '10' }).setToken(config.token);



  try {

    console.log('Started refreshing application (/) commands.');

    await rest.put(

      Routes.applicationGuildCommands(client.user.id, config.guildId),

      { body: commands },

    );

    console.log('Successfully reloaded application (/) commands.');

  } catch (error) {

    console.error(error);

  }

});



function createEmbed(title, description, fields = [], image = null) {

  const embed = new EmbedBuilder()

    .setColor('#000080') // Dark Blue

    .setTitle(title)

    .setDescription(description)

    .setTimestamp()

    .setFooter({ text: 'HappyLand Project - By Auftrra', iconURL: 'https://example.com/logo.png' });



  if (fields.length > 0) {

    embed.addFields(fields);

  }



  if (image) {

    embed.setImage(image);

  }



  return embed;

}



client.on('interactionCreate', async interaction => {

  if (!interaction.guild) return;

  if (interaction.guild.id !== config.guildId) return;



  if (interaction.isCommand()) {

    if (interaction.commandName === 'createucpbutton') {

      // Check if the user has the correct ID

      if (interaction.user.id !== config.authorizedUserId) {

        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });

        return;

      }



      const embed = createEmbed(

        'Create UCP',

        '📮 **Create UCP**\n\nIni adalah tombol untuk mengajukan permintaan UCP. Silakan klik tombol ini untuk melanjutkan proses registrasi akun UCP kamu',

        [],

        config.bannerImage

      );



      const button = new ButtonBuilder()

        .setCustomId('create_ucp')

        .setLabel('📮 Create UCP')

        .setStyle(ButtonStyle.Success);



      const row = new ActionRowBuilder().addComponents(button);



      await interaction.reply({ embeds: [embed], components: [row] });

    }

  } else if (interaction.isButton()) {

    if (interaction.customId === 'create_ucp') {

      const modal = new ModalBuilder()

        .setCustomId('ucp_modal')

        .setTitle('Create UCP');



      const nameInput = new TextInputBuilder()

        .setCustomId('name')

        .setLabel('Enter your name (letters only, no spaces)')

        .setStyle(TextInputStyle.Short)

        .setRequired(true)

        .setMinLength(3)

        .setMaxLength(20);



      const firstActionRow = new ActionRowBuilder().addComponents(nameInput);

      modal.addComponents(firstActionRow);



      await interaction.showModal(modal);

    }

  } else if (interaction.isModalSubmit()) {

    if (interaction.customId === 'ucp_modal') {

      const name = interaction.fields.getTextInputValue('name');

      if (!/^[a-zA-Z]+$/.test(name)) {

        await interaction.reply({ content: 'Invalid name. Please use only letters without spaces.', ephemeral: true });

        return;

      }



      const pin = Math.floor(100000 + Math.random() * 900000).toString();



      const query = 'INSERT INTO playerucp (uUserPin, uUserUCP) VALUES (?, ?)';

      connection.query(query, [pin, name], async (err, result) => {

        if (err) {

          console.error('Error inserting into database:', err);

          await interaction.reply({ content: 'An error occurred. Please try again later.', ephemeral: true });

          return;

        }



        const replyEmbed = createEmbed(

          'HappyLand Roleplay | UCP Verification',

          `**HappyLand Roleplay**\nSelamat Anda ***${name}*** Berhasil Mengclaim Ticket, Silahkan Cek Dm/Pm Anda`,

          [],

          config.bannerImage

        );



        await interaction.reply({ embeds: [replyEmbed], ephemeral: true });



        const dmEmbed = createEmbed(

          'UCP Verification',

          `Hallo! Selamat UCP anda berhasil terverifikasi. Gunakan PIN di bawah ini Untuk Register InGame`,

          [

            { name: 'UCP', value: name, inline: true },

            { name: 'PIN', value: `\`${pin}\``, inline: true }

          ]

        );



        await interaction.user.send({ embeds: [dmEmbed] });



        const role = interaction.guild.roles.cache.get(config.verifiedRoleId);

        if (role) {

          await interaction.member.roles.add(role);

        }

      });

    }

  }

});



client.login(config.token)
