const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
// 1. 使用我們換好的全新穩定翻譯庫
const { translate } = require('google-translate-api-x');

// 1. 防止 Render 休息 (維持原樣)
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 10000);

// 2. 初始化機器人 (維持原樣)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
  ],
});

// 3. 頻道設定 (已加入韓文 ko 頻道)
const channels = {
  zh: '1496614451812503572',
  cn: '1496463528326991913',
  en: '1496562571480666183',
  vi: '1496562468707631205',
  ko: '1518181527316467785' // 👈 兄弟，這裡記得填入你的韓文頻道 ID
};

// 4. 翻譯功能 (核心防封鎖配置)
async function translateText(text, target) {
  try {
    const res = await translate(text, { 
      to: target, 
      autoCorrect: true,
      // 這裡加個偽裝，避免被 Google 當成機器人
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    });
    return res.text; 
  } catch (e) {
    console.error('❌ 翻譯出包了:', e.message);
    return null;
  }
}

// 5. 啟動顯示
client.on('ready', () => {
  console.log(`✅ 兄弟！SUn 翻譯官 [${client.user.tag}] 成功上線！`);
});

// 6. 核心邏輯 (融入中文不互翻、韓文自動同步邏輯)
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // 判定目前發話的頻道屬於哪種語言
  const sourceLang = Object.keys(channels).find(key => channels[key] === msg.channel.id);
  if (!sourceLang) return;

  // 對應翻譯目標的對照表
  const targetMap = {
    zh: { lang: 'zh-TW', emoji: '🇹🇼' },
    cn: { lang: 'zh-CN', emoji: '🇨🇳' },
    en: { lang: 'en',    emoji: '🇺🇸' },
    vi: { lang: 'vi',    emoji: '🇻🇳' },
    ko: { lang: 'ko',    emoji: '🇰🇷' }
  };

  // 過濾掉發話頻道本身
  let targets = Object.keys(channels).filter(lang => lang !== sourceLang);

  // 💡 關鍵邏輯：如果是在 zh（繁中）或 cn（簡中）頻道發言
  if (sourceLang === 'zh' || sourceLang === 'cn') {
    // 剔除另一個中文頻道，讓中文不互相翻譯，直接融為一體！
    targets = targets.filter(lang => lang !== 'zh' && lang !== 'cn');
  }

  // 開始翻譯並發送到其他外語頻道
  for (const langKey of targets) {
    const translation = await translateText(msg.content, targetMap[langKey].lang);
    
    if (translation) {
      const targetChannel = client.channels.cache.get(channels[langKey]);
      if (targetChannel) {
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        // 加上發言來源的國旗，同步發送
        await targetChannel.send(`${targetMap[sourceLang].emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
