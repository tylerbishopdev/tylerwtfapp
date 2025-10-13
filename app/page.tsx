"use client";

import { useState, useEffect } from "react";
import { ModelSidebar } from "@/components/ModelSidebar";
import { ModelForm } from "@/components/ModelForm";
import { OutputDisplay } from "@/components/OutputDisplay";

interface Model {
  name: string;
  category: string;
  endpointId: string | null;
  isLora: boolean;
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [outputs, setOutputs] = useState<any[]>([]);

  useEffect(() => {
    // Fetch available models
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setModels(data.models);
        }
      })
      .catch((error) => {
        console.error("Error fetching models:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
  };

  const handleOutputGenerated = (output: any) => {
    setOutputs((prev) => [output, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-[325px] bg-card border-r border overflow-hidden ">
        <ModelSidebar models={models} onModelSelect={handleModelSelect} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Form Area */}
        <div className="w-1/2 h-full border-r-4 border-foreground/10 overflow-hidden">
          <ModelForm
            selectedModel={selectedModel}
            onOutputGenerated={handleOutputGenerated}
          />
        </div>

        {/* Output Display Area */}
        <div className="w-1/2 h-full overflow-hidden screen-background">
          <OutputDisplay outputs={outputs} />
        </div>
      </div>
    </div>
  );
}
