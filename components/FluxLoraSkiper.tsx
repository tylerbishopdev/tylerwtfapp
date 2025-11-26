"use client";

import {
  AnimatePresence,
  motion,
  MotionConfig,
} from "framer-motion";
import {
  Send,
  Sparkles,
  Skull,
  Download,
  Loader2
} from "lucide-react";
import {
  JSX,
  useMemo,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

// Constants for styling
const BUTTON_BASE_STYLES =
  "bg-red-400/80 hover:bg-red-400/50 text-red-950 border border-muted cursor-pointer rounded-full h-10 px-4 flex items-center gap-2 text-sm focus-visible:outline-[1px] -outline-offset-1 outline-red-500/10";

const BUTTON_ACTIVE_STYLES =
  "bg-red-400 hover:bg-red-500 border-red-500/10 text-red-500";

// Animation constants
const ANIMATION_DURATION = 0.1;

// Component for animated placeholder text
const AnimatedPlaceholder = () => (
  <AnimatePresence mode="wait">
    <motion.p
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: ANIMATION_DURATION }}
      className="text-red-100/30 pointer-events-none absolute w-[200px]"
    >
      Describe your image...
    </motion.p>
  </AnimatePresence>
);

// Available LoRA models configuration
const LORA_MODELS = [
  {
    id: "tyler",
    name: "Tyler",
    icon: Skull,
  }
] as const;

interface GeneratedImage {
  url: string;
  stored_url: string;
}

// Reusable dropdown menu component
interface DropdownItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

const CustomDropdownMenu = ({
  trigger,
  items,
  side = "top",
  align = "start",
  sideOffset = 14,
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
    <DropdownMenuContent
      className="bg-background outline-foreground/5! rounded-xl border-none p-1 outline-[1px]!"
      side={side}
      align={align}
      sideOffset={sideOffset}
    >
      {items.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <DropdownMenuItem
            key={index}
            onClick={item.onClick}
            className="focus:bg-foreground/5 focus:text-foreground  text-foreground/60 flex h-6 cursor-pointer items-center gap-2 rounded-xl px-5 py-1 text-xs"
          >
            {IconComponent && <IconComponent className="size-4" />}
            {item.label}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuContent>
  </DropdownMenu>
);

const FluxLoraSkiper = () => {
  const [userInput, setUserInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("Tyler");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
  };

  const handleSubmit = async () => {
    if (userInput.trim() === "" || isLoading) return;

    const prompt = userInput;

    setIsLoading(true);
    setError(null);
    setImages([]);

    try {
      const payload = {
        prompt: prompt,
        num_outputs: 4,
        aspect_ratio: "4:3",
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        lora_scale: 1,
        go_fast: true,
        disable_safety_checker: false,
      };

      const res = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate images");
      }

      if (data.images && data.images.length > 0) {
        setImages(data.images);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <div className="bg-linear-to-t from-black via-red-950 to-red-900 flex h-screen w-full flex-col">

        {/* Image Display Area - takes remaining space above input */}
        <div className="flex-1 flex items-center justify-center p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Generating images...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-red-500 text-center">
              <p>{error}</p>
            </div>
          )}

          {/* Images Grid */}
          {!isLoading && images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 max-w-3xl w-full">
              {images.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative aspect-4/3 group rounded-xl overflow-hidden bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.stored_url || img.url}
                    alt={`Generated ${idx + 1}`}
                    className="object-cover w-full h-full"
                  />
                  <a
                    href={img.stored_url || img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State - show shimmer text */}
          {!isLoading && images.length === 0 && !error && (
            <TextShimmerComponent
              spread={22}
              className="select-none text-center text-[12vw] font-semibold leading-[10vw]! tracking-tighter opacity-[0.03]"
            >
              TYLERS.WTF
            </TextShimmerComponent>
          )}
        </div>

        {/* Fixed Input Container at Bottom */}
        <div className="w-full max-w-3xl mx-auto px-3 pb-4">
          <div className="bg-muted/60 border-foreground/5 rounded-2xl border p-1">
            {/* Text Input Area */}
            <div className="relative">
              <Textarea
                value={userInput}
                autoFocus
                placeholder=""
                className="max-h-32 min-h-[56px] w-full resize-none rounded-none border-none bg-transparent! p-4 text-base! leading-[1.2] shadow-none focus-visible:outline-0 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                onChange={(e) => {
                  setUserInput(e.target.value);
                }}
              />
              {!userInput && (
                <div className="absolute left-4 top-4">
                  <AnimatedPlaceholder />
                </div>
              )}
            </div>

            {/* Control Buttons Row */}
            <div className="bg-background border-muted flex justify-between rounded-2xl border p-1">
              <div className="flex items-center gap-1">
                {/* Model Selection Dropdown */}
                <CustomDropdownMenu
                  trigger={
                    <button
                      className={cn(
                        BUTTON_BASE_STYLES,
                        "flex items-center gap-2",
                      )}
                    >
                      {(() => {
                        const selectedModelData = LORA_MODELS.find(
                          (model) => model.name === selectedModel,
                        );
                        const IconComponent = selectedModelData?.icon;
                        return IconComponent ? (
                          <IconComponent className="size-4" />
                        ) : null;
                      })()}
                      {selectedModel}
                    </button>
                  }
                  items={LORA_MODELS.map((model) => ({
                    label: model.name,
                    icon: model.icon,
                    onClick: () => handleModelSelect(model.name),
                  }))}
                />
              </div>
              {/* Send Button */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={cn(
                    BUTTON_BASE_STYLES,
                    "flex w-10 items-center justify-center p-0 transition-all ease-in-out active:scale-95",
                    userInput && !isLoading && BUTTON_ACTIVE_STYLES,
                    (!userInput || isLoading) && "cursor-not-allowed opacity-50",
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

export { FluxLoraSkiper };

// text shimmer from https://motion-primitives.com/docs/text-shimmer

export type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

function TextShimmerComponent({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements,
  );

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-size-[250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#F0A8A1] [--base-gradient-color:#F0A2A2]",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        "dark:[--base-color:#E2AC90] dark:[--base-gradient-color:#FFB2B2] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className,
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}
