import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Utility function to parse ModelReferences.md
function parseModelReferences() {
  const filePath = path.join(process.cwd(), "ModelReferences.md");
  const content = fs.readFileSync(filePath, "utf-8");

  const categories = [
    "Image generation",
    "Reference / trained media models",
    "Video models",
    "Avatar models",
    "3D assets generation",
    "Audio Generation",
    "Subject Training Models",
    "Utility models",
  ];

  const models: Record<string, string[]> = {};
  let currentCategory = "";

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if it's a category header
    if (trimmedLine.startsWith("****") && trimmedLine.endsWith("****")) {
      const category = trimmedLine.replace(/\*/g, "").trim();
      if (
        categories.includes(category) ||
        category === "Reference / trained media models"
      ) {
        currentCategory = category;
        models[currentCategory] = [];
      }
    }

    // Check if it's a model line
    if (trimmedLine.startsWith("- ") && trimmedLine.includes("/")) {
      const modelName = trimmedLine.substring(2).trim();
      if (currentCategory && models[currentCategory]) {
        models[currentCategory].push(modelName);
      }
    }
  }

  // Parse LoRAs section
  const lorasIndex = content.indexOf("LoRas—");
  if (lorasIndex !== -1) {
    models["LoRAs"] = [];
    const lorasContent = content.substring(lorasIndex);
    const lorasLines = lorasContent.split("\n");

    for (const line of lorasLines) {
      if (line.trim().startsWith('- "') && line.includes('":')) {
        const loraMatch = line.match(/- "([^"]+)": \[([^\]]+)\]/);
        if (loraMatch) {
          models["LoRAs"].push(loraMatch[1]);
        }
      }
    }
  }

  return models;
}

// GET /api/models - List all available models
export async function GET() {
  try {
    const models = parseModelReferences();

    // Flatten models into a single array with categories
    const allModels = [];
    for (const [category, modelList] of Object.entries(models)) {
      for (const model of modelList) {
        allModels.push({
          name: model,
          category,
          endpointId:
            model.startsWith("fal-ai/") ||
            model.startsWith("bria/") ||
            model.startsWith("tripo3d/") ||
            model.startsWith("sonauto/")
              ? model
              : null,
          isLora: category === "LoRAs",
        });
      }
    }

    return NextResponse.json({
      success: true,
      models: allModels,
      categories: Object.keys(models),
      total: allModels.length,
    });
  } catch (error) {
    console.error("Error parsing models:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load models" },
      { status: 500 }
    );
  }
}
