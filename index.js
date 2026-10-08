import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (![DISCORD_TOKEN, CLIENT_ID, GUILD_ID].every(Boolean)) throw new Error('Configura DISCORD_TOKEN, CLIENT_ID y GUILD_ID en .env');
const commands = [
 new SlashCommandBuilder().setName('ping').setDescription('Comprueba que 365 está funcionando'),
 new SlashCommandBuilder().setName('anuncio').setDescription('Publica un anuncio en un canal')
  .addChannelOption(o=>o.setName('canal').setDescription('Canal de destino').addChannelTypes(ChannelType.GuildText).setRequired(true))
  .addStringOption(o=>o.setName('mensaje').setDescription('Texto del anuncio').setMaxLength(1900).setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 new SlashCommandBuilder().setName('crear-canal').setDescription('Crea un canal de texto')
  .addStringOption(o=>o.setName('nombre').setDescription('Nombre del canal').setMaxLength(90).setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
].map(c=>c.toJSON());
const rest = new REST({version:'10'}).setToken(DISCORD_TOKEN);
await rest.put(Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID),{body:commands});
console.log('Comandos registrados en el servidor IPL');
const client = new Client({intents:[GatewayIntentBits.Guilds]});
client.once('ready',()=>console.log(`365 conectado como ${client.user.tag}`));
client.on('interactionCreate',async i=>{
 if(!i.isChatInputCommand()||i.guildId!==GUILD_ID)return;
 try {
  if(i.commandName==='ping') return await i.reply({content:'🏓 ¡365 está operativo!',ephemeral:true});
  if(i.commandName==='anuncio') {
   if(!i.memberPermissions.has(PermissionFlagsBits.ManageGuild)) return await i.reply({content:'Sin permisos.',ephemeral:true});
   const ch=i.options.getChannel('canal',true);
   if(!ch?.isTextBased()||!ch.permissionsFor(i.guild.members.me).has(PermissionFlagsBits.SendMessages)) return await i.reply({content:'No puedo escribir en ese canal.',ephemeral:true});
   await ch.send({content:i.options.getString('mensaje',true),allowedMentions:{parse:[]}});
   return await i.reply({content:`Anuncio publicado en ${ch}.`,ephemeral:true});
  }
  if(i.commandName==='crear-canal') {
   if(!i.memberPermissions.has(PermissionFlagsBits.ManageChannels)) return await i.reply({content:'Sin permisos.',ephemeral:true});
   const ch=await i.guild.channels.create({name:i.options.getString('nombre',true),type:ChannelType.GuildText,reason:`Solicitado por ${i.user.tag} mediante 365`});
   return await i.reply({content:`Canal creado: ${ch}`,ephemeral:true});
  }
 }catch(e){console.error(e);if(i.replied||i.deferred)await i.followUp({content:'No pude completar la acción. Revisa mis permisos.',ephemeral:true});else await i.reply({content:'No pude completar la acción. Revisa mis permisos.',ephemeral:true});}
});
await client.login(DISCORD_TOKEN);
