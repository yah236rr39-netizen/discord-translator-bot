const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai'); // 引入 OpenAI

// 1. OpenAI 初始化 (會去抓你在 Render 設定的 KEY)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. 防止 Render 休息的伺服器
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 10000);

// 3. 初始化 Discord 機器人
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // 抓暱稱需要這個
  ],
});

// 4. 頻道設定
const channels = {
  zh: '1496614451812503572', // 繁中
  en: '1496562571480666183', // 英文
  vi: '1496562468707631205', // 越南
  cn: '1496463528326991913'  // 簡中
};

// 5. ⭐ OpenAI 翻譯引擎 (取代原本的 Axios 邏輯)
async function translate(text, targetLangName) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 使用最划算且快速的模型
      messages: [
        {
          role: "system",
          content: `You are a professional translator for a gaming guild. Translate the following text into ${targetLangName} accurately and naturally. Keep the original meaning and any gaming slang if possible.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error('OpenAI 翻譯發生錯誤:', e.message);
    return null;
  }
}

// 啟動檢查
client.on('ready', () => {
  console.log('---------------------------------------');
  console.log(`✅ 兄弟！SUn 翻譯官 [${client.user.tag}] 已上線！`);
  console.log('OpenAI 引擎已啟動，四路頻道監控中...');
  console.log('---------------------------------------');
});

// 6. 核心轉發邏輯 (保留你最愛的格式)
client.on('messageCreate', async (msg) => {
  // 排除機器人訊息
  if (msg.author.bot) return;

  // 判斷訊息來源頻道
  const sourceLang = Object.keys(channels).find(key => channels[key] === msg.channel.id);
  if (!sourceLang) return;

  console.log(`收到來自 [${sourceLang}] 的訊息，正在使用 AI 翻譯...`);

  // 設定各國語言名稱 (讓 AI 好理解) 與 Emoji
  const langConfig = {
    zh: { name: 'Traditional Chinese', emoji: '🇹🇼' },
    en: { name: 'English',             emoji: '🇺🇸' },
    vi: { name: 'Vietnamese',          emoji: '🇻🇳' },
    cn: { name: 'Simplified Chinese',  emoji: '🇨🇳' }
  };

  // 找出需要翻譯的目標
  const targets = Object.keys(channels).filter(lang => lang !== sourceLang);

  for (const langKey of targets) {
    // 呼叫 AI 翻譯
    const translation = await translate(msg.content, langConfig[langKey].name);
    
    if (translation) {
      const targetChannel = client.channels.cache.get(channels[langKey]);
      if (targetChannel) {
        // 抓取暱稱 (displayName)
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        // 發送格式：[國旗] [發言者]: [翻譯內容]
        await targetChannel.send(`${langConfig[sourceLang].emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
