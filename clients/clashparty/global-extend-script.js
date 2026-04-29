// =====================================================
// RouteKit · Clash Party 覆写脚本（旧称 Mihomo Party）
// 当前按 macOS / Version 1.9.3 (1.9.3) 记录
// =====================================================
// 使用方法：
//   1. 左侧“覆写”页面导入脚本文件
//   2. 订阅管理 → 编辑信息 → 选择该覆写脚本
//   3. 更新订阅后生效
// =====================================================
// 优势：按真实服务商命名动态分组，适合当前覆写工作流
// =====================================================

// 地区节点过滤正则
const REGION_FILTERS = {
  "🇭🇰 香港节点": /香港|香港HK|香港WAP|🇭🇰/i,
  "🇹🇼 台湾节点": /台湾|🇨🇳\s*台湾|🇹🇼/i,
  "🇺🇲 美国节点": /美国|美国LA|美国USLA|洛杉矶|海外用户专用-美国|🇺🇸|🇺🇲/i,
  "🇸🇬 新加坡节点": /新加坡|海外用户专用-新加坡|🇸🇬/i,
  "🇯🇵 日本节点": /日本|日本JP|海外用户专用-日本|🇯🇵/i,
  "🇬🇧 英国节点": /英国|🇬🇧/i,
  "🇨🇦 加拿大节点": /加拿大|🇨🇦/i,
  "🇩🇪 德国节点": /德国|德国DE|🇩🇪/i,
};

const CUSTOM_GROUP_NAMES = new Set([
  "RouteKit-DIRECT",
  "🖥 RouteKit-Cursor",
  "🤖 RouteKit-AI",
  "🤖 RouteKit-ChatGPT",
  "🌍 RouteKit-Proxy",
  "🛠 RouteKit-Dev-US",
  "📺 RouteKit-YouTube",
  "🔧 RouteKit-Dev",
  "🎵 RouteKit-Spotify",
  "🪙 RouteKit-Crypto-Web3",
  ...Object.keys(REGION_FILTERS),
]);

// 自定义规则
const CUSTOM_RULES = [
  // 企业/内网直连示例
  "DOMAIN-SUFFIX,corp.example.com,RouteKit-DIRECT",
  "DOMAIN-SUFFIX,internal.example.test,RouteKit-DIRECT",
  "DOMAIN,portal.corp.example.com,RouteKit-DIRECT",

  // AI（走美国）
  "DOMAIN-KEYWORD,claude,🤖 RouteKit-AI",
  "DOMAIN-KEYWORD,anthropic,🤖 RouteKit-AI",
  "DOMAIN-KEYWORD,chatgpt,🤖 RouteKit-ChatGPT",
  "DOMAIN-KEYWORD,openai,🤖 RouteKit-ChatGPT",
  "DOMAIN-KEYWORD,oaiusercontent,🤖 RouteKit-ChatGPT",
  "DOMAIN-KEYWORD,gemini,🤖 RouteKit-AI",
  "DOMAIN-KEYWORD,generativelanguage,🤖 RouteKit-AI",
  "DOMAIN-KEYWORD,aistudio,🤖 RouteKit-AI",
  "DOMAIN,generativelanguage.googleapis.com,🤖 RouteKit-AI",
  "DOMAIN,gemini.google.com,🤖 RouteKit-AI",
  "DOMAIN,aistudio.google.com,🤖 RouteKit-AI",
  "DOMAIN,ai.google.dev,🤖 RouteKit-AI",
  "DOMAIN,makersuite.google.com,🤖 RouteKit-AI",
  "DOMAIN,notebooklm.google.com,🤖 RouteKit-AI",
  "DOMAIN,openaiapi-site.azureedge.net,🤖 RouteKit-ChatGPT",
  "DOMAIN,production-openaicom-storage.azureedge.net,🤖 RouteKit-ChatGPT",
  "DOMAIN,openaicom.imgix.net,🤖 RouteKit-ChatGPT",
  "DOMAIN,chatgpt.livekit.cloud,🤖 RouteKit-ChatGPT",
  "DOMAIN,host.livekit.cloud,🤖 RouteKit-ChatGPT",
  "DOMAIN,turn.livekit.cloud,🤖 RouteKit-ChatGPT",
  "DOMAIN-SUFFIX,claude.ai,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,anthropic.com,🤖 RouteKit-AI",
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
  "DOMAIN-SUFFIX,deepmind.google,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,deepmind.com,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,labs.google,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,jules.google,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,notebooklm.google,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,generativeai.google,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,proactivebackend-pa.googleapis.com,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,robinfrontend-pa.googleapis.com,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,geller-pa.googleapis.com,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,aisandbox-pa.googleapis.com,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,aida.googleapis.com,🤖 RouteKit-AI",
  "DOMAIN-SUFFIX,bard.google.com,🤖 RouteKit-AI",

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
  if (!config || !config.proxies) return config;

  const allProxies = config.proxies.map((p) => p.name);

  // 按地区分组节点
  const regionGroups = {};
  for (const [groupName, regex] of Object.entries(REGION_FILTERS)) {
    const matched = allProxies.filter((name) => regex.test(name));
    if (matched.length > 0) {
      regionGroups[groupName] = matched;
    }
  }

  // 构建地区策略组（url-test 自动测速）
  const regionProxyGroups = Object.entries(regionGroups).map(
    ([name, proxies]) => ({
      name,
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies,
    })
  );

  const regionNames = regionProxyGroups.map((g) => g.name);

  // 构建 RouteKit 业务策略组
  const routekitGroups = [
    {
      name: "RouteKit-DIRECT",
      type: "select",
      proxies: ["DIRECT"],
    },
    {
      name: "🤖 RouteKit-AI",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("美国")),
        ...regionNames.filter((n) => n.includes("日本")),
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("香港")),
        ...regionNames.filter(
          (n) =>
            !n.includes("美国") &&
            !n.includes("日本") &&
            !n.includes("新加坡") &&
            !n.includes("台湾") &&
            !n.includes("香港")
        ),
        "RouteKit-DIRECT",
      ],
    },
    {
      name: "🤖 RouteKit-ChatGPT",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("美国")),
        ...regionNames.filter((n) => n.includes("日本")),
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("香港")),
        ...regionNames.filter(
          (n) =>
            !n.includes("美国") &&
            !n.includes("日本") &&
            !n.includes("新加坡") &&
            !n.includes("台湾") &&
            !n.includes("香港")
        ),
        "RouteKit-DIRECT",
      ],
    },
    {
      name: "🌍 RouteKit-Proxy",
      type: "select",
      proxies: [...regionNames, "RouteKit-DIRECT"],
    },
    {
      name: "🛠 RouteKit-Dev-US",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("美国")),
        ...regionNames.filter((n) => n.includes("香港") || n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("新加坡") || n.includes("日本")),
        "RouteKit-DIRECT",
      ],
    },
    {
      name: "📺 RouteKit-YouTube",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("香港")),
        ...regionNames.filter((n) => n.includes("日本")),
        ...regionNames.filter((n) => n.includes("台湾") || n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("美国")),
        "RouteKit-DIRECT",
      ],
    },
    {
      name: "🔧 RouteKit-Dev",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("日本") || n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("香港") || n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("美国")),
        "RouteKit-DIRECT",
      ],
    },
    {
      name: "🖥 RouteKit-Cursor",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("日本")),
        ...regionNames.filter((n) => n.includes("台湾")),
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => n.includes("美国")),
        ...regionNames.filter((n) => n.includes("香港")),
        "RouteKit-DIRECT",
      ],
    },
    {
      name: "🎵 RouteKit-Spotify",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("新加坡")),
        ...regionNames.filter((n) => !n.includes("新加坡")),
        "RouteKit-DIRECT",
      ],
    },
    {
      name: "🪙 RouteKit-Crypto-Web3",
      type: "select",
      proxies: [
        ...regionNames.filter((n) => n.includes("日本") || n.includes("新加坡")),
        ...regionNames.filter(
          (n) => !n.includes("日本") && !n.includes("新加坡")
        ),
        "RouteKit-DIRECT",
      ],
    },
  ];

  // 删除同名旧组，避免重复注入时报 duplicate group name
  const existingGroups = (config["proxy-groups"] || []).filter(
    (group) => !CUSTOM_GROUP_NAMES.has(group.name)
  );

  // 前插策略组
  config["proxy-groups"] = [
    ...routekitGroups,
    ...regionProxyGroups,
    ...existingGroups,
  ];

  // 前插自定义规则 + 追加兜底
  config.rules = [
    ...CUSTOM_RULES,
    ...(config.rules || []),
    "MATCH,🌍 RouteKit-Proxy",
  ];

  return config;
}
