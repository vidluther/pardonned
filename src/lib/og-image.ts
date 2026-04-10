import satori from "satori";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load font files once (cached across invocations during build)
const fontsDir = resolve(process.cwd(), "src/assets/fonts");

let fontData: {
  dmSansRegular: Buffer;
  dmSansMedium: Buffer;
  dmSerif: Buffer;
} | null = null;

function loadFonts() {
  if (!fontData) {
    fontData = {
      dmSansRegular: readFileSync(resolve(fontsDir, "DMSans-Regular.ttf")),
      dmSansMedium: readFileSync(resolve(fontsDir, "DMSans-Medium.ttf")),
      dmSerif: readFileSync(resolve(fontsDir, "DMSerifDisplay-Regular.ttf")),
    };
  }
  return fontData;
}

export interface OgImageData {
  title: string;
  subtitle?: string;
  stat?: string;
  statLabel?: string;
  accent?: boolean;
}

export async function renderOgImage(data: OgImageData): Promise<Buffer> {
  const fonts = loadFonts();

  const markup = buildMarkup(data);

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "DM Sans",
        data: fonts.dmSansRegular,
        weight: 400,
        style: "normal" as const,
      },
      {
        name: "DM Sans",
        data: fonts.dmSansMedium,
        weight: 500,
        style: "normal" as const,
      },
      {
        name: "DM Serif Display",
        data: fonts.dmSerif,
        weight: 400,
        style: "normal" as const,
      },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function buildMarkup(data: OgImageData) {
  const { title, subtitle, stat, statLabel, accent } = data;

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 80px",
        backgroundColor: "#FAFAF7",
        fontFamily: "DM Sans",
      },
      children: [
        // Top: Wordmark
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: "DM Serif Display",
                    fontSize: "28px",
                    color: "#1A1918",
                  },
                  children: "Pardonned",
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "13px",
                    color: "#807E76",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.08em",
                  },
                  children: "Tracking Pardons by President",
                },
              },
            ],
          },
        },
        // Middle: Title + subtitle
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontFamily: "DM Serif Display",
                    fontSize: "64px",
                    color: "#1A1918",
                    lineHeight: "1.1",
                    letterSpacing: "-0.02em",
                  },
                  children: title,
                },
              },
              subtitle
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        fontSize: "22px",
                        color: "#6A6860",
                      },
                      children: subtitle,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // Bottom: Stat (optional) + accent bar
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            },
            children: [
              stat
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              fontFamily: "DM Serif Display",
                              fontSize: "42px",
                              color: accent ? "#C23B22" : "#1A1918",
                              lineHeight: "1.1",
                            },
                            children: stat,
                          },
                        },
                        statLabel
                          ? {
                              type: "div",
                              props: {
                                style: {
                                  display: "flex",
                                  fontSize: "16px",
                                  color: "#807E76",
                                  textTransform: "uppercase" as const,
                                  letterSpacing: "0.1em",
                                },
                                children: statLabel,
                              },
                            }
                          : null,
                      ].filter(Boolean),
                    },
                  }
                : null,
              // Accent bar
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: "80px",
                    height: "4px",
                    backgroundColor: "#C23B22",
                    borderRadius: "2px",
                  },
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}
