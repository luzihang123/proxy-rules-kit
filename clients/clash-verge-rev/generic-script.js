// =====================================================
// RouteKit · Clash Verge Rev 订阅扩展脚本
// 当前按 macOS / Version 2.4.7 (2.4.7) 记录
// 适用订阅：任意订阅（按需调整 UPSTREAM_FALLBACKS）
// =====================================================
// 设计思路与默认策略说明：见同目录 `README.md`
// 这是什么：
//   - 这是 Clash Verge Rev 的“订阅扩展脚本”
//   - 不是独立运行的 Node.js 项目
//   - 不是浏览器脚本，也不是网页前端代码
//   - 你把它粘到 Verge 的“编辑脚本”里，Verge 会在订阅更新时自动执行
//
// 它做什么：
//   1. 读取服务商原始配置里的所有节点（config.proxies）
//   2. 按节点名字把节点分到“香港 / 台湾 / 美国 / 新加坡 / 日本 ...”这些地区里
//   3. 为每个地区生成两层策略组：
//      - “XX自动” = 自动测速，自动选当前最快节点
//      - “XX节点” = 手动选择该地区节点
//   4. 再基于这些地区组，生成业务策略组：
//      - 🤖 RouteKit-AI
//      - 🤖 RouteKit-Claude（Claude / Anthropic：默认美国自动，可选尼日利亚 / 日本 / 新加坡 / 美国等）
//      - 🤖 RouteKit-Gemini（Gemini / DeepMind / AI Studio / NotebookLM 等 Google AI 系）
//      - 🛠 RouteKit-Dev-US
//      - 🔧 RouteKit-Dev
//      - 🎵 RouteKit-Spotify
//      - 🪙 RouteKit-Crypto-Web3
//      - 🌍 RouteKit-Proxy
//   5. 最后把自定义规则和策略组插回原始配置里，形成最终生效配置
//
// 你需要知道的最少 JS 常识：
//   - const XXX = ...    表示定义一个常量
//   - { a: 1, b: 2 }     表示一个对象，类似“键值对”
//   - [a, b, c]          表示一个数组，类似“列表”
//   - function main(...) 是脚本入口。Verge 会自动调用它
//   - return config      表示把修改后的配置交还给 Verge
//
// 这个脚本没有什么“框架”：
//   - 没有 React / Vue / Next.js
//   - 没有 npm 依赖
//   - 没有 import / export
//   - 只有一个入口函数 main(config, profileName)
//
// 入口参数说明：
//   - config:
//       Verge 传进来的当前订阅配置对象
//       里面最重要的字段有：
//       - config.proxies         所有节点
//       - config["proxy-groups"] 所有策略组
//       - config.rules           所有规则
//   - profileName:
//       当前订阅在 Verge 里的名字
//       这份脚本里暂时没有用到它，但保留这个参数更稳
//
// 返回值说明：
//   - 必须 return config
//   - 如果不 return，或者返回错对象，Verge 就无法得到最终配置
//
// 阅读顺序建议：
//   1. 先看 REGION_FILTERS：这里决定“某个节点属于哪个地区”
//   2. 再看 CUSTOM_RULES：这里决定“某个网站走哪个策略组”
//   3. 最后看 main()：这里是把“地区分组 + 业务分组 + 规则”真正装配起来
//
// 维护原则：
//   - 按自己的订阅节点命名维护，不做过度泛化
//   - 重复刷新订阅不能报错，所以脚本必须幂等
//   - 上游服务商原始组名不同，所以要保留 fallback 兼容
//
// 如果以后你只想“停用脚本，不删入口”，最小回退版本是：
//   function main(config, profileName) {
//     return config;
//   }
// =====================================================
// 使用方法：
//   1. Clash Verge Rev → 订阅 → 配置卡片右键 → 编辑脚本
//   2. 粘贴本文件内容并保存
//   3. 保存后对当前订阅生效
// =====================================================
// 优势：适合 2.4.7 当前 UI，可同时注入规则和策略组
// =====================================================

// 地区节点过滤正则。
// 这里只维护示例与常见节点命名，避免为了“泛化”误伤其他节点。
const REGION_FILTERS = {
  "🇭🇰 香港节点": /香港|香港HK|香港WAP|🇭🇰/i,
  "🇹🇼 台湾节点": /台湾|🇨🇳\s*台湾|🇹🇼/i,
  "🇺🇲 美国节点": /美国|美国LA|美国USLA|洛杉矶|海外用户专用-美国|🇺🇸|🇺🇲/i,
  "🇸🇬 新加坡节点": /新加坡|海外用户专用-新加坡|🇸🇬/i,
  "🇯🇵 日本节点": /日本|日本JP|海外用户专用-日本|🇯🇵/i,
  "🇬🇧 英国节点": /英国|🇬🇧/i,
  "🇨🇦 加拿大节点": /加拿大|🇨🇦/i,
  "🇩🇪 德国节点": /德国|德国DE|🇩🇪/i,
  // 尼日利亚区：作为可选地区示例，按需保留或删除。
  "🇳🇬 尼日利亚节点": /尼日利亚|尼日|Nigeria|🇳🇬/i,
};

// 每个地区都同时生成两层组：
// 1. “XX自动” -> url-test 自动测速
// 2. “XX节点” -> 手动选择该地区节点
const autoRegionName = (name) => name.replace("节点", "自动");

// 上游订阅末尾常有 MATCH 兜底；若原样拼在 CUSTOM_RULES 后面，则脚本追加的 MATCH 永远不会被匹配到。
function stripMatchRules(ruleLines) {
  return (ruleLines || []).filter((r) => {
    if (typeof r !== "string") return true;
    return !/^\s*MATCH\s*,/i.test(r.trim());
  });
}

// 这些组名会在每次运行前先被清理掉，避免重复刷新订阅时报 duplicate group name。
const CUSTOM_GROUP_NAMES = new Set([
  "RouteKit-DIRECT",
  "🖥 RouteKit-Cursor",
  "🤖 RouteKit-AI",
  "🤖 RouteKit-Claude",
  "🤖 RouteKit-ChatGPT",
  "🤖 RouteKit-Gemini",
  "🤖 RouteKit-Grok",
  "🐦 RouteKit-Twitter",
  "🌍 RouteKit-Proxy",
  "🛠 RouteKit-Dev-US",
  "📺 RouteKit-YouTube",
  "🔧 RouteKit-Dev",
  "🎵 RouteKit-Spotify",
  "🪙 RouteKit-Crypto-Web3",
  ...Object.keys(REGION_FILTERS).flatMap((name) => [name, autoRegionName(name)]),
]);

// 目标订阅上游自带的兜底组。脚本会只保留当前订阅里真实存在的名称。
// 这样同一份脚本重复应用时，不会引用不存在的组。
const UPSTREAM_FALLBACKS = ["Proxy", "节点选择", "自动选择"];

// 自定义规则
const CUSTOM_RULES = [
  // Claude / Anthropic（专用策略组：尼日利亚 / 日本 / 新加坡 / 多区测速 / 美国等）
  "DOMAIN-KEYWORD,claude,🤖 RouteKit-Claude",
  "DOMAIN-KEYWORD,anthropic,🤖 RouteKit-Claude",
  "DOMAIN-KEYWORD,chatgpt,🤖 RouteKit-ChatGPT",
  "DOMAIN-KEYWORD,openai,🤖 RouteKit-ChatGPT",
  "DOMAIN-KEYWORD,oaiusercontent,🤖 RouteKit-ChatGPT",
  "DOMAIN-KEYWORD,gemini,🤖 RouteKit-Gemini",
  "DOMAIN-KEYWORD,generativelanguage,🤖 RouteKit-Gemini",
  "DOMAIN-KEYWORD,aistudio,🤖 RouteKit-Gemini",
  "DOMAIN,generativelanguage.googleapis.com,🤖 RouteKit-Gemini",
  "DOMAIN,gemini.google.com,🤖 RouteKit-Gemini",
  "DOMAIN,aistudio.google.com,🤖 RouteKit-Gemini",
  "DOMAIN,ai.google.dev,🤖 RouteKit-Gemini",
  "DOMAIN,makersuite.google.com,🤖 RouteKit-Gemini",
  "DOMAIN,notebooklm.google.com,🤖 RouteKit-Gemini",
  "DOMAIN,openaiapi-site.azureedge.net,🤖 RouteKit-ChatGPT",
  "DOMAIN,production-openaicom-storage.azureedge.net,🤖 RouteKit-ChatGPT",
  "DOMAIN,openaicom.imgix.net,🤖 RouteKit-ChatGPT",
  "DOMAIN,chatgpt.livekit.cloud,🤖 RouteKit-ChatGPT",
  "DOMAIN,host.livekit.cloud,🤖 RouteKit-ChatGPT",
  "DOMAIN,turn.livekit.cloud,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,claude.ai,🤖 RouteKit-Claude",
  "DOMAIN-SUFFIX,anthropic.com,🤖 RouteKit-Claude",
  "DOMAIN-SUFFIX,chatgpt.com,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,chat.com,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,openai.com,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,oaistatic.com,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,oaiusercontent.com,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,dify.ai,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,ollama.ai,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,sora.com,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,perplexity.ai,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,manus.im,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,withgoogle.com,🤖 RouteKit-AI",
  "DOMAIN,stitch.withgoogle.com,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,deepmind.google,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,deepmind.com,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,labs.google,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,jules.google,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,notebooklm.google,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,generativeai.google,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,proactivebackend-pa.googleapis.com,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,robinfrontend-pa.googleapis.com,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,geller-pa.googleapis.com,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,aisandbox-pa.googleapis.com,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,aida.googleapis.com,🤖 RouteKit-Gemini",
  "DOMAIN-SUFFIX,bard.google.com,🤖 RouteKit-Gemini",

  // YouTube（走香港/日本快速线路）
  "DOMAIN-SUFFIX,youtube.com,📺 RouteKit-YouTube",
  "DOMAIN-SUFFIX,youtu.be,📺 RouteKit-YouTube",
  "DOMAIN-SUFFIX,ytimg.com,📺 RouteKit-YouTube",
  "DOMAIN-SUFFIX,googlevideo.com,📺 RouteKit-YouTube",
  "DOMAIN-SUFFIX,youtubei.googleapis.com,📺 RouteKit-YouTube",
  "DOMAIN-SUFFIX,youtube-nocookie.com,📺 RouteKit-YouTube",
  "DOMAIN,www.youtube.com,📺 RouteKit-YouTube",
  "DOMAIN,m.youtube.com,📺 RouteKit-YouTube",
  "DOMAIN,music.youtube.com,📺 RouteKit-YouTube",
  "DOMAIN,youtubei.googleapis.com,📺 RouteKit-YouTube",

  // Spotify（走新加坡，注册地风控）
  "DOMAIN-SUFFIX,spotify.com,🎵 RouteKit-Spotify",
  "DOMAIN-SUFFIX,spotifycdn.com,🎵 RouteKit-Spotify",
  "DOMAIN-SUFFIX,scdn.co,🎵 RouteKit-Spotify",
  "DOMAIN-SUFFIX,spotify.design,🎵 RouteKit-Spotify",
  "DOMAIN-SUFFIX,spotilocal.com,🎵 RouteKit-Spotify",
  "DOMAIN-SUFFIX,tospotify.com,🎵 RouteKit-Spotify",
  "DOMAIN-SUFFIX,pscdn.co,🎵 RouteKit-Spotify",
  "DOMAIN-KEYWORD,spotify,🎵 RouteKit-Spotify",

  // Crypto/Web3（走日本/新加坡）
  "DOMAIN-SUFFIX,binance.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,binance.me,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,binance.cloud,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,bnbstatic.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,okx.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,okx.com.hk,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,okex.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,okx-cdn.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,bybit.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,bitget.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,aicoin.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,geckoterminal.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,futunn.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,mytokencap.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,aftermath.finance,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,sui.io,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,hashkey.com,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,chainbuzz.xyz,🪙 RouteKit-Crypto-Web3",
  "DOMAIN-SUFFIX,chainfeeds.xyz,🪙 RouteKit-Crypto-Web3",

  // Google（走美国）
  "DOMAIN-SUFFIX,google.com,🛠 RouteKit-Dev-US",
  "DOMAIN-SUFFIX,google,🛠 RouteKit-Dev-US",
  "DOMAIN-SUFFIX,googleapis.com,🛠 RouteKit-Dev-US",
  "DOMAIN-SUFFIX,gstatic.com,🛠 RouteKit-Dev-US",
  "DOMAIN-SUFFIX,googletagmanager.com,🛠 RouteKit-Dev-US",
  "DOMAIN-SUFFIX,google-analytics.com,🛠 RouteKit-Dev-US",

  // Dev/Tools（走日本/新加坡）
  "DOMAIN,api.github.com,🔧 RouteKit-Dev",
  "DOMAIN,gist.github.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,github.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,github.io,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,githubusercontent.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,githubassets.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,githubstatus.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,ghcr.io,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,git-scm.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,gitbook.io,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,githubcopilot.com,🔧 RouteKit-Dev",
  "DOMAIN,copilot-telemetry.githubusercontent.com,🔧 RouteKit-Dev",
  "DOMAIN,origin-tracker.githubusercontent.com,🔧 RouteKit-Dev",
  "DOMAIN,copilot-proxy.githubusercontent.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,github.dev,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,github.community,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,docker.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,docker.io,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,ubuntu.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,pypi.org,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,python.org,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,pythonhosted.org,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,readthedocs.io,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,go.dev,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,npmjs.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,brew.sh,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,cursor.sh,🖥 RouteKit-Cursor",
  "DOMAIN-SUFFIX,cursor.com,🖥 RouteKit-Cursor",
  "DOMAIN-SUFFIX,cursorapi.com,🖥 RouteKit-Cursor",
  "DOMAIN-SUFFIX,cursor-cdn.com,🖥 RouteKit-Cursor",
  "DOMAIN-SUFFIX,kiro.dev,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,jetbrains.com,🔧 RouteKit-Dev",
  "DOMAIN,vsmarketplacebadge.apphb.com,🔧 RouteKit-Dev",
  "DOMAIN,default.exp-tas.com,🔧 RouteKit-Dev",
  "DOMAIN,webpubsub.azure.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,azure.com,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,imagedelivery.net,🔧 RouteKit-Dev",
  "DOMAIN-SUFFIX,cloudfront.net,🔧 RouteKit-Dev",

  // Twitter / X（日本→新加坡→台湾→香港→美国）
  "DOMAIN-SUFFIX,twitter.com,🐦 RouteKit-Twitter",
  "DOMAIN-SUFFIX,x.com,🐦 RouteKit-Twitter",
  "DOMAIN-SUFFIX,t.co,🐦 RouteKit-Twitter",
  "DOMAIN-SUFFIX,twimg.com,🐦 RouteKit-Twitter",
  "DOMAIN-SUFFIX,twitterstatic.com,🐦 RouteKit-Twitter",
  "DOMAIN-SUFFIX,twitteroauth.com,🐦 RouteKit-Twitter",
  "DOMAIN-SUFFIX,tweetdeck.com,🐦 RouteKit-Twitter",
  "DOMAIN,abs.twimg.com,🐦 RouteKit-Twitter",
  "DOMAIN,pbs.twimg.com,🐦 RouteKit-Twitter",
  "DOMAIN,video.twimg.com,🐦 RouteKit-Twitter",
  "DOMAIN-KEYWORD,twitter,🐦 RouteKit-Twitter",

  // Grok / xAI（日本→新加坡→台湾→香港→美国）
  "DOMAIN-SUFFIX,grok.com,🤖 RouteKit-Grok",
  "DOMAIN-SUFFIX,x.ai,🤖 RouteKit-Grok",
  "DOMAIN-KEYWORD,grok,🤖 RouteKit-Grok",

  // Others
  "DOMAIN-SUFFIX,telegram.org,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,microsoft.com,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,live.com,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,office.com,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,office365.com,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,sharepoint.com,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,onmicrosoft.com,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,windows.net,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,icloud.com,🌍 RouteKit-Proxy",
  "DOMAIN-SUFFIX,apple-cloudkit.com,🌍 RouteKit-Proxy",
];

function main(config, profileName) {
  // 没有代理节点时直接返回，避免在空配置上继续加工。
  if (!config || !config.proxies) return config;

  // 先拿到当前订阅的原始节点名和原始组名，后面所有分组都基于这两个集合派生。
  const allProxies = config.proxies.map((p) => p.name);
  const existingGroupNames = new Set(
    (config["proxy-groups"] || []).map((group) => group.name)
  );

  // 只保留当前订阅里真实存在的上游兜底组，避免组名写死后跨服务商失效。
  const upstreamFallbacks = UPSTREAM_FALLBACKS.filter((name) =>
    existingGroupNames.has(name)
  );

  // Verge / Mihomo 里同一个 select 组如果塞进重复项，UI 会比较乱，这里统一去重。
  const unique = (items) => Array.from(new Set(items.filter(Boolean)));

  // 第一步：按地区把真实节点切出来。
  const regionGroups = {};
  for (const [groupName, regex] of Object.entries(REGION_FILTERS)) {
    const matched = allProxies.filter((name) => regex.test(name));
    if (matched.length > 0) {
      regionGroups[groupName] = matched;
    }
  }

  // 第二步：为每个地区生成两层策略组。
  // 这样 UI 上会同时有“美国自动 / 美国节点”这类入口：
  // - 自动：最快节点
  // - 节点：手动切换
  const regionProxyGroups = [];
  const regionNames = [];

  for (const [name, proxies] of Object.entries(regionGroups)) {
    regionProxyGroups.push({
      name: autoRegionName(name),
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies,
    });
    regionProxyGroups.push({
      name,
      type: "select",
      proxies,
    });
    regionNames.push(autoRegionName(name), name);
  }

  // 第三步：构建业务策略组。
  // 排序是有意为之：
  // - AI / Google 优先美国
  // - Claude：默认美国自动，同时保留尼日利亚（汇率）与日本/新加坡等可选入口
  // - Dev / Crypto 优先日本、新加坡
  // - Proxy 则把所有地区和上游兜底都放进去
  const routekitGroups = [
    {
      name: "RouteKit-DIRECT",
      type: "select",
      proxies: ["DIRECT"],
    },
    {
      name: "🤖 RouteKit-Claude",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n === "🇺🇲 美国自动"),
        ...regionNames.filter((n) => n === "🇺🇲 美国节点"),
        ...regionNames.filter((n) => n === "🇳🇬 尼日利亚自动"),
        ...regionNames.filter((n) => n === "🇳🇬 尼日利亚节点"),
        ...regionNames.filter((n) => n === "🇯🇵 日本自动"),
        ...regionNames.filter((n) => n === "🇯🇵 日本节点"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡自动"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡节点"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾自动"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾节点"),
        ...regionNames.filter((n) => n === "🇭🇰 香港自动"),
        ...regionNames.filter((n) => n === "🇭🇰 香港节点"),
        ...regionNames.filter(
          (n) =>
            !n.includes("尼日利亚") &&
            !n.includes("美国") &&
            !n.includes("日本") &&
            !n.includes("新加坡") &&
            !n.includes("台湾") &&
            !n.includes("香港")
        ),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🤖 RouteKit-ChatGPT",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n === "🇺🇲 美国自动"),
        ...regionNames.filter((n) => n === "🇺🇲 美国节点"),
        ...regionNames.filter((n) => n === "🇯🇵 日本自动"),
        ...regionNames.filter((n) => n === "🇯🇵 日本节点"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡自动"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡节点"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾自动"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾节点"),
        ...regionNames.filter((n) => n === "🇭🇰 香港自动"),
        ...regionNames.filter((n) => n === "🇭🇰 香港节点"),
        ...regionNames.filter(
          (n) =>
            !n.includes("美国") &&
            !n.includes("日本") &&
            !n.includes("新加坡") &&
            !n.includes("台湾") &&
            !n.includes("香港")
        ),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🤖 RouteKit-Gemini",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n === "🇺🇲 美国自动"),
        ...regionNames.filter((n) => n === "🇺🇲 美国节点"),
        ...regionNames.filter((n) => n === "🇯🇵 日本自动"),
        ...regionNames.filter((n) => n === "🇯🇵 日本节点"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡自动"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡节点"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾自动"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾节点"),
        ...regionNames.filter((n) => n === "🇭🇰 香港自动"),
        ...regionNames.filter((n) => n === "🇭🇰 香港节点"),
        ...regionNames.filter(
          (n) =>
            !n.includes("美国") &&
            !n.includes("日本") &&
            !n.includes("新加坡") &&
            !n.includes("台湾") &&
            !n.includes("香港")
        ),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🤖 RouteKit-AI",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n === "🇺🇲 美国自动"),
        ...regionNames.filter((n) => n === "🇺🇲 美国节点"),
        ...regionNames.filter((n) => n === "🇯🇵 日本自动"),
        ...regionNames.filter((n) => n === "🇯🇵 日本节点"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡自动"),
        ...regionNames.filter((n) => n === "🇸🇬 新加坡节点"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾自动"),
        ...regionNames.filter((n) => n === "🇹🇼 台湾节点"),
        ...regionNames.filter((n) => n === "🇭🇰 香港自动"),
        ...regionNames.filter((n) => n === "🇭🇰 香港节点"),
        ...regionNames.filter(
          (n) =>
            !n.includes("美国") &&
            !n.includes("日本") &&
            !n.includes("新加坡") &&
            !n.includes("台湾") &&
            !n.includes("香港")
        ),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🤖 RouteKit-Grok",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n.includes("日本")),
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("香港")),
        ...regionNames.filter((n) => n.includes("美国")),
        ...regionNames.filter(
          (n) =>
            !["日本", "新加坡", "台湾", "香港", "美国"].some((k) => n.includes(k))
        ),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🐦 RouteKit-Twitter",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n.includes("日本")),
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("香港")),
        ...regionNames.filter((n) => n.includes("美国")),
        ...regionNames.filter(
          (n) =>
            !["日本", "新加坡", "台湾", "香港", "美国"].some((k) => n.includes(k))
        ),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🌍 RouteKit-Proxy",
      type: "select",
      proxies: unique([...regionNames, ...upstreamFallbacks, "RouteKit-DIRECT"]),
    },
    {
      name: "🛠 RouteKit-Dev-US",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n === "🇺🇲 美国自动"),
        ...regionNames.filter((n) => n === "🇺🇲 美国节点"),
        ...regionNames.filter((n) => n.includes("香港") || n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("新加坡") || n.includes("日本")),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "📺 RouteKit-YouTube",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n === "🇭🇰 香港自动"),
        ...regionNames.filter((n) => n === "🇭🇰 香港节点"),
        ...regionNames.filter((n) => n === "🇯🇵 日本自动"),
        ...regionNames.filter((n) => n === "🇯🇵 日本节点"),
        ...regionNames.filter((n) => n.includes("台湾") || n.includes("新加坡")),
        ...regionNames.filter((n) => n === "🇺🇲 美国自动"),
        ...regionNames.filter((n) => n === "🇺🇲 美国节点"),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🔧 RouteKit-Dev",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n.includes("日本") || n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("香港") || n.includes("台湾")),
        ...regionNames.filter((n) => n === "🇺🇲 美国自动"),
        ...regionNames.filter((n) => n === "🇺🇲 美国节点"),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🖥 RouteKit-Cursor",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n.includes("日本")),
        ...regionNames.filter((n) => n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("美国")),
        ...regionNames.filter((n) => n.includes("香港")),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🎵 RouteKit-Spotify",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => !n.includes("新加坡")),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
    {
      name: "🪙 RouteKit-Crypto-Web3",
      type: "select",
      proxies: unique([
        ...regionNames.filter((n) => n.includes("日本") || n.includes("新加坡")),
        ...regionNames.filter(
          (n) => !n.includes("日本") && !n.includes("新加坡")
        ),
        ...upstreamFallbacks,
        "RouteKit-DIRECT",
      ]),
    },
  ];

  // 先删掉上一轮脚本插入的同名组，再把新组插回去。
  // 这样保存脚本、刷新订阅、重复更新都能保持幂等。
  const existingGroups = (config["proxy-groups"] || []).filter(
    (group) => !CUSTOM_GROUP_NAMES.has(group.name)
  );

  // 自定义组前插，保证 RouteKit 组排在服务商原始组前面，使用时更顺手。
  config["proxy-groups"] = [
    ...routekitGroups,
    ...regionProxyGroups,
    ...existingGroups,
  ];

  // 规则同样前插，最后再补一个 MATCH 兜底到 RouteKit-Proxy。
  const upstreamRules = stripMatchRules(config.rules);
  config.rules = [
    ...CUSTOM_RULES,
    ...upstreamRules,
    "MATCH,🌍 RouteKit-Proxy",
  ];

  return config;
}
