const http = require('http');
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 10000);

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMembers, // 👈 為了抓暱稱，這個也要開
  ],
});

// 啟動檢查
client.on('ready', () => {
  console.log('---------------------------------------');
  console.log(`✅ 兄弟！機器人 [${client.user.tag}] 已經成功上線了！`);
  console.log('現在去 Discord 頻道打字測試看看吧！');
  console.log('---------------------------------------');
});

// 🔑 四個頻道的對應 ID
const channels = {
  zh: '1496614451812503572', // 繁中
  en: '1496562571480666183', // 英文
  vi: '1496562468707631205', // 越南
  cn: '1496463528326991913'  // 簡中
};

// 🌍 翻譯函式
async function translate(text, target) {
  try {
    const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: target,
        dt: 't',
        q: text
      }
    });
    return res.data[0][0][0];
  } catch (e) { 
    console.error('翻譯失敗:', e);
    return null; 
  }
}

client.on('messageCreate', async (msg) =>
{
  // 1. 排除機器人訊息
  if (msg.author.bot) return;

  // 2. 判斷訊息來源頻道
  const sourceLang = Object.keys(channels).find(key => channels[key] === msg.channel.id);
  if (!sourceLang) return;

  console.log(`收到來自 [${sourceLang}] 的訊息，正在分發翻譯...`);

  // 3. 設定各國對應代碼
  const targetMap = {
    zh: { lang: 'zh-TW', emoji: '🇹🇼' },
    en: { lang: 'en',    emoji: '🇺🇸' },
    vi: { lang: 'vi',    emoji: '🇻🇳' },
    cn: { lang: 'zh-CN', emoji: '🇨🇳' }
  };

  // 4. 找出目標頻道 (排除發言地)
  const targets = Object.keys(channels).filter(lang => lang !== sourceLang);

  for (const langKey of targets) {
    // 💡 這裡一定要在 async 裡面跑 translate
    const translation = await translate(msg.content, targetMap[langKey].lang);
    
    if (translation) {
      const targetChannel = client.channels.cache.get(channels[langKey]);
      if (targetChannel) {
        // 抓取暱稱
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        // 💡 這裡發送訊息也要 await
        await targetChannel.send(`${targetMap[sourceLang].emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
      if (targetChannel) {
        // 發送格式：[發言者]: [翻譯內容]
        await targetChannel.send(`${targetMap[sourceLang].emoji} **${msg.author.username}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
