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
    <div className="flex h-min-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border overflow-hidden">
        <ModelSidebar models={models} onModelSelect={handleModelSelect} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Output Display Area */}
        <div className="h-1/6 border-b border overflow-hidden">
          <OutputDisplay outputs={outputs} />
        </div>

        {/* Form Area */}
        <div className="h-1/2 overflow-hidden">
          <ModelForm
            selectedModel={selectedModel}
            onOutputGenerated={handleOutputGenerated}
          />
        </div>
      </div>
    </div>
  );
}
