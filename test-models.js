const fs = require("fs");
const path = require("path");

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

  const models = {};
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

// Test the parsing
try {
  const models = parseModelReferences();
  console.log("Categories found:", Object.keys(models));
  
  let totalModels = 0;
  for (const [category, modelList] of Object.entries(models)) {
    console.log(`\n${category}: ${modelList.length} models`);
    totalModels += modelList.length;
  }
  
  console.log(`\nTotal models: ${totalModels}`);
} catch (error) {
  console.error("Error parsing models:", error);
}
