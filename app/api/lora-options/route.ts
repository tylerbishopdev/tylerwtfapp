import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Interface for predefined Lora options
interface LoraOption {
  name: string;
  url: string;
  isStyle?: boolean;
  phraseReference?: string;
  subjectReference?: string;
}

// Parse ModelReferences.md to extract predefined Lora options
function parseLoraReferences(): LoraOption[] {
  try {
    const filePath = path.join(process.cwd(), "ModelReferences.md");
    const content = fs.readFileSync(filePath, "utf-8");

    const loraOptions: LoraOption[] = [];
    const loraSection =
      content.split("LoRas—")[1] || content.split("LoRas—")[1];

    if (!loraSection) {
      return [];
    }

    // Process each LoRa entry
    const entries = loraSection.trim().split(/-\s*“/);
    for (const entry of entries) {
      if (entry.trim() === "") continue;

      const lines = entry.trim().split("\n");
      const nameMatch = lines[0].match(/([^”]+)”/);
      if (!nameMatch) continue;

      const name = nameMatch[1];
      let url = "";
      let isStyle = false;
      let phraseReference = "";
      let subjectReference = "";

      // Extract URL and properties
      const urlMatch = lines[0].match(/\[([^\]]+)\]/);
      if (urlMatch) {
        url = urlMatch[1];
      } else {
        const simpleUrlMatch = lines[0].match(/:\s*(https.+)/);
        if (simpleUrlMatch) {
          url = simpleUrlMatch[1].trim();
        }
      }

      // Extract other properties from subsequent lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes("Is style")) {
          isStyle = line.includes("true");
        }
        if (
          line.includes("phrade reference") ||
          line.includes("phrase reference")
        ) {
          const refMatch = line.match(/=\s*”([^”]+)”/);
          if (refMatch) {
            phraseReference = refMatch[1];
          }
        }
        if (line.includes("Subject reference")) {
          const refMatch = line.match(/=\s*“([^”]+)”/);
          if (refMatch) {
            subjectReference = refMatch[1];
          }
        }
      }

      if (name && url) {
        loraOptions.push({
          name,
          url,
          isStyle,
          phraseReference,
          subjectReference,
        });
      }
    }

    return loraOptions;
  } catch (error) {
    console.error("Error parsing Lora references:", error);
    return [];
  }
}

// GET /api/lora-options - Get all available Lora options
export async function GET() {
  try {
    const loraOptions = parseLoraReferences();

    return NextResponse.json({
      success: true,
      loraOptions,
    });
  } catch (error) {
    console.error("Error fetching Lora options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Lora options" },
      { status: 500 }
    );
  }
}
