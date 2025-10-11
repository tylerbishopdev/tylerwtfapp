"use client";

import { useState, useEffect } from "react";
import { ModelSidebar } from "@/components/ModelSidebar";
import { ModelForm } from "@/components/ModelForm";
import { OutputDisplay } from "@/components/OutputDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const isMobile = useIsMobile();

  useEffect(() => {
    // Fetch available models
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        if (data.success) {
          console.log("Models loaded:", data.models.length);
          setModels(data.models);
        } else {
          console.error("API returned success=false:", data);
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

  // Debug: Check if models loaded
  console.log("Current models state:", models.length, models);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          <ModelSidebar models={models} onModelSelect={handleModelSelect} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header with Menu Trigger */}
        {isMobile && (
          <div className="p-4 border-b bg-white dark:bg-gray-800 z-10">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 border-r-0 mr-[-1px]">
                <ModelSidebar models={models} onModelSelect={handleModelSelect} />
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Output Display Area */}
        <div className="flex-1 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
          <OutputDisplay outputs={outputs} />
        </div>

        {/* Form Area */}
        <div className="flex-1 overflow-hidden">
          <ModelForm
            selectedModel={selectedModel}
            onOutputGenerated={handleOutputGenerated}
          />
        </div>
      </div>
    </div>
  );
}
