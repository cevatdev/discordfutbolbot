const { Client, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


const prefix = '!';
const matches = {};
let teams = {};
let balances = {};
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const ucanParaEmoji = client.emojis.cache.find(emoji => emoji.name === 'ucanpara');


// Load teams and balances from files if they exist
if (fs.existsSync('teams.json')) {
    teams = JSON.parse(fs.readFileSync('teams.json', 'utf8'));
}

if (fs.existsSync('balances.json')) {
    balances = JSON.parse(fs.readFileSync('balances.json', 'utf8'));
}

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help' || command === 'yardım') {
      const embed = new MessageEmbed()
          .setTitle('Yardım Komutları')
          .addField('Futbol Komutları', `
              !takımekle @takım\n
              !futbolcuekle @takım @kullanıcı\n
              !futbolcukaldir @takım @kullanıcı\n
              !maç başlat @takım1 @takım2\n
              !maç skorguncelle ekle/kaldir @takım\n
          `)
          .addField('Ekonomi Komutları', `
              !param\n
              !param @kullanıcı\n
              !paragonder @kullanıcı miktar\n
              !paratransfer @kullanıcı miktar\n
          `)
          .addField('Diğer Komutlar', `
              !roll 1,2\n
              !maçlar\n
              !takimlar\n
              !purge <number>\n
              !nuke \n
              `)
          .addField('Eğlence', `
              !yazitura \n  
          `)
          .setColor('#0099ff');
      message.channel.send({ embeds: [embed] });


    } else if (command === 'param') {
        const user = message.mentions.users.first() || message.author;
        

        // Check if the user has one of the required roles
        if (!message.member.roles.cache.has(config.roles.footballer) &&
        !message.member.roles.cache.has(config.roles.registermod) &&
        !message.member.roles.cache.has(config.roles.admin) &&
        !message.member.roles.cache.has(config.roles.moderator) &&
        !message.member.roles.cache.has(config.roles.referee) &&
            !message.member.roles.cache.has(config.roles.president) &&
            !message.member.roles.cache.has(config.roles.coach)) {
            const embed = new MessageEmbed()
                .setTitle('Yetki Hatası')
                .setDescription('Bu komutu kullanmak için yeterli yetkiniz yok.')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }


        // Liderlik sıralamasını oluştur
        const sortedUsers = Object.entries(balances).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
    
        // Kullanıcının liderlik sıralamasındaki konumunu bul
        const userIndex = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

        const balance = balances[user.id] || 0;
        const embed = new MessageEmbed()
        .setTitle('Para Bilgisi')
        .addField('Kullanıcı', user.username)
        .addField('Lider Sıralaması', `${userIndex}.`)
        .addField('Para', `${balance} <a:ucanpara:1246528432985214976>`)
        .setColor('#0099ff');
        message.channel.send({ embeds: [embed] });

    } else if (command === 'lidertablosu') {
        try {
            // Balans verilerini dosyadan oku
            const balancesData = await fs.promises.readFile('balances.json', 'utf-8');
            const balances = JSON.parse(balancesData);
    
            // Kullanıcıları para bakiyelerine göre sırala
            const sortedUsers = Object.entries(balances).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
    
            // Embed için başlık ve renk
            const embed = new MessageEmbed()
                .setTitle('Para Liderlik Tablosu')
                .setColor('#0099ff');
    
            // Kullanıcıları embed'e ekle
            for (const [userId, balance] of sortedUsers) {
                try {
                    const user = await client.users.fetch(userId);
                    embed.addField(`${user.username}`, `Para: ${balance} <a:ucanpara:1246528432985214976>`);
                } catch (error) {
                    console.error('Kullanıcı alınırken bir hata oluştu:', error);
                }
            }
    
            // Embed'i kanala gönder
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Liderlik tablosu oluşturulurken bir hata oluştu:', error);
            // Hata durumunda bildirim gönder
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Liderlik tablosu oluşturulurken bir hata oluştu.')
                .setColor('#ff0000');
            message.channel.send({ embeds: [embed] });
        }
    }
    
    
    
    
    
                
  else if (command === 'paragonder') {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            const embed = new MessageEmbed()
                .setTitle('Yetki Hatası')
                .setDescription('Bu komutu kullanmak için yeterli yetkiniz yok.')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        const user = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!user || isNaN(amount) || amount <= 0) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Lütfen geçerli bir kullanıcı ve miktar belirtin! Örnek: !paragonder @kullanıcı 100')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        balances[user.id] = (balances[user.id] || 0) + amount;
        fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));
        const embed = new MessageEmbed()
            .setTitle('Başarılı')
            .setDescription(`${user.tag} kullanıcısına ${amount} para gönderildi!`)
            .setColor('#00ff00');
        message.channel.send({ embeds: [embed] });
    } else if (command === 'paratransfer') {
        const user = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!user || isNaN(amount) || amount <= 0) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Lütfen geçerli bir kullanıcı ve miktar belirtin! Örnek: !paratransfer @kullanıcı 100')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        const senderBalance = balances[message.author.id] || 0;
        if (senderBalance < amount) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Yeterli bakiyeniz yok.')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        balances[message.author.id] -= amount;
        balances[user.id] = (balances[user.id] || 0) + amount;
        fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));
        const embed = new MessageEmbed()
            .setTitle('Başarılı')
            .setDescription(`${user.tag} kullanıcısına ${amount} para transfer edildi!`)
            .setColor('#00ff00');
        message.channel.send({ embeds: [embed] });
    } else if (command === 'takımekle') {
        const role = message.mentions.roles.first();
        if (!role) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Lütfen bir rol etiketleyin! Örnek: !takımekle @takımınrolü')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        if (teams[role.id]) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Bu takım zaten eklenmiş!')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        teams[role.id] = { name: role.name, players: role.members.map(member => member.user.tag) };
        fs.writeFileSync('teams.json', JSON.stringify(teams, null, 2));
        const embed = new MessageEmbed()
            .setTitle('Başarılı')
            .setDescription(`${role.name} takımı eklendi!`)
            .setColor('#00ff00');
        message.channel.send({ embeds: [embed] });
    } else if (command === 'futbolcuekle') {
        const role = message.mentions.roles.first();
        const user = message.mentions.users.first();
        if (!role || !user) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Lütfen bir takım rolü ve bir kullanıcı etiketleyin! Örnek: !futbolcuekle @takım @kullanıcı')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        if (!teams[role.id]) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Önce takımı eklemelisiniz! Örnek: !takımekle @takım')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        teams[role.id].players.push(user.tag);
        fs.writeFileSync('teams.json', JSON.stringify(teams, null, 2));
        const embed = new MessageEmbed()
            .setTitle('Başarılı')
            .setDescription(`${user.tag} ${role.name} takımına eklendi!`)
            .setColor('#00ff00');
        message.channel.send({ embeds: [embed] });
    } else if (command === 'futbolcukaldir') {
        const role = message.mentions.roles.first();
        const user = message.mentions.users.first();
        if (!role || !user) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Lütfen bir takım rolü ve bir kullanıcı etiketleyin! Örnek: !futbolcukaldir @takım @kullanıcı')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        if (!teams[role.id]) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Bu takım mevcut değil.')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        teams[role.id].players = teams[role.id].players.filter(player => player !== user.tag);
        fs.writeFileSync('teams.json', JSON.stringify(teams, null, 2));
        const embed = new MessageEmbed()
            .setTitle('Başarılı')
            .setDescription(`${user.tag} ${role.name} takımından kaldırıldı!`)
            .setColor('#00ff00');
        message.channel.send({ embeds: [embed] });
    } else if (command === 'maç') {
        if (args[0] === 'başlat') {
            const team1 = message.mentions.roles.first();
            const team2 = message.mentions.roles.last();
            if (!team1 || !team2) {
                const embed = new MessageEmbed()
                    .setTitle('Hata')
                    .setDescription('Lütfen iki takım etiketleyin! Örnek: !maç başlat @takım1 @takım2')
                    .setColor('#ff0000');
                return message.channel.send({ embeds: [embed] });
            }
            if (!teams[team1.id] || !teams[team2.id]) {
                const embed = new MessageEmbed()
                    .setTitle('Hata')
                    .setDescription('Belirtilen takımların ikisi de mevcut olmalıdır.')
                    .setColor('#ff0000');
                return message.channel.send({ embeds: [embed] });
            }
            matches[config.guildId] = { team1: team1.id, team2: team2.id, score1: 0, score2: 0 };

            const embed = new MessageEmbed()
                .setTitle('Maç Başladı')
                .setDescription(`${team1.name} vs ${team2.name}`)
                .setColor('#0099ff');
            message.channel.send({ embeds: [embed] });
        } else if (args[0] === 'skorguncelle') {
            const operation = args[1];
            const team = message.mentions.roles.first();
            if (!operation || !team || (operation !== 'ekle' && operation !== 'kaldir')) {
                const embed = new MessageEmbed()
                    .setTitle('Hata')
                    .setDescription('Lütfen geçerli bir işlem (ekle/kaldir) ve takım belirtin! Örnek: !maç skorguncelle ekle @takım')
                    .setColor('#ff0000');
                return message.channel.send({ embeds: [embed] });
            }
            const match = matches[message.guild.id];
            if (!match || (team.id !== match.team1 && team.id !== match.team2)) {
                const embed = new MessageEmbed()
                    .setTitle('Hata')
                    .setDescription('Belirtilen takım şu anda oynanan bir maçta değil.')
                    .setColor('#ff0000');
                return message.channel.send({ embeds: [embed] });
            }
            if (team.id === match.team1) {
                match.score1 += operation === 'ekle' ? 1 : -1;
            } else {
                match.score2 += operation === 'ekle' ? 1 : -1;
            }
            const embed = new MessageEmbed()
                .setTitle('Skor Güncellendi')
                .setDescription(`${teams[match.team1].name} ${match.score1} - ${match.score2} ${teams[match.team2].name}`)
                .setColor('#0099ff');
            message.channel.send({ embeds: [embed] });
        }

    } else if (command === 'yazitura') {
        // Yazı Tura görselinin URL'si
        const imageUrl = 'https://64.media.tumblr.com/1e44de7f02e71d30c66fed615a6803b1/tumblr_inline_pagvo01aaQ1ttj61q_640.gif';
        
        // Rasgele bir cevap seç
        const responses = [
            'Yazı! <:1247527451727499275:> ',
            'Tura! <:1247527451727499275:>',
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];

        // Embed oluştur
        const embed = new MessageEmbed()
            .setTitle('Yazı Tura')
            .setDescription(response)
            .setImage(imageUrl)
            .setColor('#0099ff');

        // Embed'i gönder
        message.channel.send({ embeds: [embed] });

          } else if (command === 'roll') {
      const options = args.join(' ').split(',');
      const result = options[Math.floor(Math.random() * options.length)].trim();
      const embed = new MessageEmbed()
          .setTitle('Roll Sonucu')
          .setDescription(`Rolled: ${result}`)
          .setColor('#0099ff');
      message.channel.send({ embeds: [embed] });
    } else if (command === 'roll') {
      const options = args.join(' ').split(',');
      const result = options[Math.floor(Math.random() * options.length)].trim();
      const embed = new MessageEmbed()
          .setTitle('Roll Sonucu')
          .setDescription(`Rolled: ${result}`)
          .setColor('#0099ff');
      message.channel.send({ embeds: [embed] });

    } else if (command === 'maçlar') {
      if (Object.keys(matches).length === 0) {
          const embed = new MessageEmbed()
              .setTitle('Maç Yok')
              .setDescription('Şu anda devam eden maç yok.')
              .setColor('#ff0000');
          message.channel.send({ embeds: [embed] });
      } else {
          const embed = new MessageEmbed()
              .setTitle('Devam Eden Maçlar')
              .setColor('#0099ff');
          for (const [guildId, match] of Object.entries(matches)) {
              const guild = client.guilds.cache.get(guildId);
              const channel = guild.channels.cache.get(match.channelId);
              embed.addField(
                  `Sunucu: ${guild.name}`,
                  `${teams[match.team1].name} vs ${teams[match.team2].name} - Skor: ${match.score1} - ${match.score2}`
              );
          }
          message.channel.send({ embeds: [embed] });
      }
  
  
    } else if (command === 'takimlar') {
        const embed = new MessageEmbed()
            .setTitle('Takımlar')
            .setDescription(Object.values(teams).map(team => `${team.name}: ${team.players.join(', ')}`).join('\n'))
            .setColor('#0099ff');
        message.channel.send({ embeds: [embed] });
    } else if (command === 'roll') {
        const sides = args[0] ? args[0].split(',').map(num => parseInt(num)) : [6];
        if (sides.some(isNaN)) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Geçerli bir zar aralığı belirtin! Örnek: !roll 6,20')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        const results = sides.map(side => Math.floor(Math.random() * side) + 1);
        const embed = new MessageEmbed()
            .setTitle('Zar Sonuçları')
            .setDescription(`Sonuçlar: ${results.join(', ')}`)
            .setColor('#0099ff');
        message.channel.send({ embeds: [embed] });
    }
        else if (command === 'nuke') {
            if (!message.member.permissions.has('ADMINISTRATOR')) {
                const embed = new MessageEmbed()
                    .setTitle('Yetki Hatası')
                    .setDescription('Bu komutu kullanmak için yeterli yetkiniz yok.')
                    .setColor('#ff0000');
                return message.channel.send({ embeds: [embed] });
            }
        
            // Check if the user is in a guild
            if (!message.guild) {
                const embed = new MessageEmbed()
                    .setTitle('Hata')
                    .setDescription('Bu komut sadece sunucularda kullanılabilir.')
                    .setColor('#ff0000');
                return message.channel.send({ embeds: [embed] });
            }
        
            // Clone the channel to retain settings
            message.channel.clone()
                .then(cloneChannel => {
                    // Delete the original channel
                    message.channel.delete();
        
                    // Send a success message
                    const embed = new MessageEmbed()
                        .setTitle('Başarılı')
                        .setDescription(`Kanal nükleer temizlik operasyonuna tabi tutuldu! Yeni kanal: ${cloneChannel}`)
                        .setColor('#00ff00');
                    cloneChannel.send({ embeds: [embed] });
                })
                .catch(error => {
                    console.error('Nuke işlemi sırasında bir hata oluştu:', error);
                    const embed = new MessageEmbed()
                        .setTitle('Hata')
                        .setDescription('Kanal silinirken bir hata oluştu.')
                        .setColor('#ff0000');
                    message.channel.send({ embeds: [embed] });
                });
        
    } else if (command === 'sil') {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            const embed = new MessageEmbed()
                .setTitle('Yetki Hatası')
                .setDescription('Bu komutu kullanmak için yeterli yetkiniz yok.')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Lütfen silinecek mesaj sayısını belirtin! Örnek: !purge 10')
                .setColor('#ff0000');
            return message.channel.send({ embeds: [embed] });
        }
        message.channel.bulkDelete(amount + 1, true).catch(err => {
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Mesajlar silinirken bir hata oluştu.')
                .setColor('#ff0000');
            message.channel.send({ embeds: [embed] });
            console.error(err);
        });
        const embed = new MessageEmbed()
            .setTitle('Başarılı')
            .setDescription(`${amount} mesaj silindi!`)
            .setColor('#00ff00');
        message.channel.send({ embeds: [embed] });
    }

    
    async function createLeaderboard() {
        try {
            // Balans verilerini dosyadan oku
            const balancesData = await fs.promises.readFile('balances.json', 'utf-8');
            const balances = JSON.parse(balancesData);
    
            // Kullanıcıları para bakiyelerine göre sırala
            const sortedUsers = Object.entries(balances).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
    
            // Embed için başlık ve renk
            const embed = new MessageEmbed()
                .setTitle('Para Liderlik Tablosu')
                .setColor('#0099ff');
    
            // Kullanıcıları embed'e ekle
            sortedUsers.forEach(([userId, balance], index) => {
                const user = client.users.cache.get(userId);
                if (user) {
                    embed.addField(`${index + 1}. ${user.tag}`, `Para: ${balance} :ucanpara:`);
                }
            });
    
            // Embed'i kanala gönder
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Liderlik tablosu oluşturulurken bir hata oluştu:', error);
            // Hata durumunda bildirim gönder
            const embed = new MessageEmbed()
                .setTitle('Hata')
                .setDescription('Liderlik tablosu oluşturulurken bir hata oluştu.')
                .setColor('#ff0000');
            message.channel.send({ embeds: [embed] });
        }
    }
    


});

client.login(process.env.token);

