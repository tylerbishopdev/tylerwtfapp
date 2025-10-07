import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Utility function to get schema file path for a model
function getSchemaFilePath(modelName: string): string | null {
  // Convert model name to schema filename
  const schemaName = modelName
    .replace(/\//g, "-") // Replace slashes with dashes
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .toLowerCase();

  const schemaPath = path.join(
    process.cwd(),
    "fal_schemas",
    `${schemaName}-schema.json`
  );

  // Check if file exists
  if (fs.existsSync(schemaPath)) {
    return schemaPath;
  }

  return null;
}

// Utility function to parse schema and extract input/output definitions
function parseSchema(schemaPath: string) {
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const schema = JSON.parse(schemaContent);

  // Extract endpoint information
  const endpointId = schema.info["x-fal-metadata"]?.endpointId || "";
  const category = schema.info["x-fal-metadata"]?.category || "";
  const documentationUrl =
    schema.info["x-fal-metadata"]?.documentationUrl || "";
  const playgroundUrl = schema.info["x-fal-metadata"]?.playgroundUrl || "";

  // Find input and output schema names
  const schemas = schema.components?.schemas || {};
  let inputSchemaName = "";
  let outputSchemaName = "";

  // Look for input schema (usually ends with "Input")
  for (const [key] of Object.entries(schemas)) {
    if (key.includes("Input") && !key.includes("Output")) {
      inputSchemaName = key;
      break;
    }
  }

  // Look for output schema (usually ends with "Output")
  for (const [key] of Object.entries(schemas)) {
    if (key.includes("Output") && !key.includes("Input")) {
      outputSchemaName = key;
      break;
    }
  }

  const inputSchema = inputSchemaName ? schemas[inputSchemaName] : null;
  const outputSchema = outputSchemaName ? schemas[outputSchemaName] : null;

  return {
    endpointId,
    category,
    documentationUrl,
    playgroundUrl,
    inputSchema,
    outputSchema,
    fullSchema: schema,
  };
}

// GET /api/models/[model] - Get schema for a specific model
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ model: string }> }
) {
  try {
    const params = await context.params;
    const modelName = decodeURIComponent(params.model);

    // Get schema file path
    const schemaPath = getSchemaFilePath(modelName);

    if (!schemaPath) {
      return NextResponse.json(
        { success: false, error: `Schema not found for model: ${modelName}` },
        { status: 404 }
      );
    }

    // Parse schema
    const schemaData = parseSchema(schemaPath);

    return NextResponse.json({
      success: true,
      model: modelName,
      ...schemaData,
    });
  } catch (error) {
    console.error("Error loading model schema:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load model schema" },
      { status: 500 }
    );
  }
}
