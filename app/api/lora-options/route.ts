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

    // Split by lines and look for Lora entries
    const lines = content.split("\n");
    let inLoraSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if we're entering the LoRAs section
      if (trimmedLine === "LoRAs—" || trimmedLine === "LoRas—") {
        inLoraSection = true;
        continue;
      }

      // Check if we've left the LoRAs section
      if (inLoraSection && trimmedLine === "---") {
        break;
      }

      // Parse Lora entries
      if (
        inLoraSection &&
        trimmedLine.startsWith('- "') &&
        trimmedLine.includes('":')
      ) {
        // Extract name and URL
        const match = trimmedLine.match(/- "([^"]+)":\s*\[?([^\]]+)\]?/);
        if (match) {
          const name = match[1];
          let url = match[2];

          // Clean up URL if it has extra formatting
          url = url.replace(/\[|\]/g, "").trim();

          // Check for additional properties in subsequent lines
          const currentIndex = lines.indexOf(line);
          const nextLine =
            currentIndex + 1 < lines.length
              ? lines[currentIndex + 1].trim()
              : "";
          const nextNextLine =
            currentIndex + 2 < lines.length
              ? lines[currentIndex + 2].trim()
              : "";

          let isStyle = false;
          let phraseReference = "";
          let subjectReference = "";

          if (
            nextLine.includes('Is style="true"') ||
            nextLine.includes("Is style=")
          ) {
            isStyle = true;
          }

          if (
            nextLine.includes("phrade reference") ||
            nextLine.includes("phrase reference")
          ) {
            const phraseMatch = nextLine.match(
              /phrade reference\s*=\s*"([^"]+)"/
            );
            if (phraseMatch) {
              phraseReference = phraseMatch[1];
            }
          }

          if (
            nextLine.includes("Subject reference") ||
            nextNextLine.includes("Subject reference")
          ) {
            const subjectMatch =
              nextLine.match(/Subject reference name\s*=\s*"([^"]+)"/) ||
              nextNextLine.match(/Subject reference name\s*=\s*"([^"]+)"/);
            if (subjectMatch) {
              subjectReference = subjectMatch[1];
            }
          }

          loraOptions.push({
            name,
            url,
            isStyle,
            phraseReference,
            subjectReference,
          });
        }
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
