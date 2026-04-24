const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai'); // 1. 改成引入 OpenAI

// 2. OpenAI 初始化 (會讀取你 Render 上的環境變數)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 防止 Render 休息
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 10000);

// 初始化機器人 (保持原樣)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
  ],
});

// 頻道設定 (保持你的 ID)
const channels = {
  zh: '1496614451812503572',
  en: '1496562571480666183',
  vi: '1496562468707631205',
  cn: '1496463528326991913'
};

// 3. ⭐ 翻譯功能 (核心改為 OpenAI)
async function translate(text, targetLangName) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 使用效能最好的 mini 模型
      messages: [
        {
          role: "system",
          content: `You are a professional translator for a gaming guild. Translate accurately into ${targetLangName}.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3 // 數值低一點翻譯會比較精準
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("AI 翻譯錯誤:", e.message);
    return null;
  }
}

// 啟動顯示
client.on('ready', () => {
  console.log(`✅ 兄弟！SUn 翻譯官 [${client.user.tag}] 成功上線！`);
});

// 4. 核心邏輯 (四路互通格式)
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // 判斷來源頻道
  const sourceLang = Object.keys(channels).find(key => channels[key] === msg.channel.id);
  if (!sourceLang) return;

  // 這裡我們定義一下語言名稱，讓 AI 更好懂
  const langConfig = {
    zh: { name: 'Traditional Chinese', emoji: '🇹🇼' },
    en: { name: 'English',             emoji: '🇺🇸' },
    vi: { name: 'Vietnamese',          emoji: '🇻🇳' },
    cn: { name: 'Simplified Chinese',  emoji: '🇨🇳' }
  };

  // 找出所有「不是來源」的目標
  const targets = Object.keys(channels).filter(lang => lang !== sourceLang);

  // 開始翻譯與分發
  for (const langKey of targets) {
    // 調用 OpenAI 翻譯
    const translation = await translate(msg.content, langConfig[langKey].name);
    
    if (translation) {
      const targetChannel = client.channels.cache.get(channels[langKey]);
      if (targetChannel) {
        // 抓取暱稱或名稱
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        
        // 發送格式：[來源國旗] [發言者]: [翻譯內容]
        await targetChannel.send(`${langConfig[sourceLang].emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
