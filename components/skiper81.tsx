"use client";

import {
  AnimatePresence,
  motion,
  MotionConfig,
  useMotionValue,
} from "framer-motion";
import {
  BookOpen,
  Bot,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  Plus,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  JSX,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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

// Constan  ts for styling
const BUTTON_BASE_STYLES =
  "bg-muted/50 hover:bg-muted border border-muted cursor-pointer rounded-xl h-10 px-4 flex items-center gap-2 text-sm focus-visible:outline-[1px] -outline-offset-1 outline-sky-500";

const BUTTON_ACTIVE_STYLES =
  "bg-sky-500/15 hover:bg-sky-500/19 border-sky-500/10 text-sky-500";

// Animation constants
const ANIMATION_DURATION = 0.1;
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

// Component for animated placeholder text
const AnimatedPlaceholder = ({ isSearchMode }: { isSearchMode: boolean }) => (
  <AnimatePresence mode="wait">
    <motion.p
      key={isSearchMode ? "search" : "ask"}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: ANIMATION_DURATION }}
      className="text-foreground/30 pointer-events-none absolute w-[150px]"
    >
      {isSearchMode ? "Search the web" : "Ask Anything"}
    </motion.p>
  </AnimatePresence>
);

const Brain = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M4.222 21.995v-3.55c0-1.271-.333-1.932-.987-3.037A8.888 8.888 0 0 1 10.889 2a8.89 8.89 0 0 1 8.889 8.887c0 .58 0 .87.024 1.032c.058.388.24.722.417 1.068L22 16.441l-1.4.7c-.405.202-.608.303-.749.49s-.181.399-.26.82l-.008.042c-.183.968-.384 2.036-.95 2.71c-.2.237-.448.43-.727.567c-.461.225-1.028.225-2.162.225c-.525 0-1.051.012-1.576 0c-1.243-.031-2.168-1.077-2.168-2.29" />
      <path d="M14.388 10.532c-.426 0-.815-.162-1.11-.427m1.11.426c0 1.146-.664 2.235-1.942 2.235S10.504 13.854 10.504 15m3.884-4.469c2.15 0 2.15-3.35 0-3.35q-.294.001-.557.095c.105-2.498-3.496-3.176-4.312-.836m.985 1.857c0-.774-.39-1.456-.985-1.857m0 0c-1.852-1.25-4.32.993-3.146 2.993c-1.97.295-1.76 3.333.247 3.333a1.66 1.66 0 0 0 1.362-.712" />
    </g>
  </svg>
);

const Bulb = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        d="M5.143 14A7.8 7.8 0 0 1 4 9.919C4 5.545 7.582 2 12 2s8 3.545 8 7.919A7.8 7.8 0 0 1 18.857 14"
      />
      <path
        strokeLinecap="round"
        d="M14 10c-.613.643-1.289 1-2 1s-1.387-.357-2-1"
      />
      <path d="M7.383 17.098c-.092-.276-.138-.415-.133-.527a.6.6 0 0 1 .382-.53c.104-.041.25-.041.54-.041h7.656c.291 0 .436 0 .54.04a.6.6 0 0 1 .382.531c.005.112-.041.25-.133.527c-.17.511-.255.767-.386.974a2 2 0 0 1-1.2.869c-.238.059-.506.059-1.043.059h-3.976c-.537 0-.806 0-1.043-.06a2 2 0 0 1-1.2-.868c-.131-.207-.216-.463-.386-.974ZM15 19l-.13.647c-.14.707-.211 1.06-.37 1.34a2 2 0 0 1-1.113.912C13.082 22 12.72 22 12 22s-1.082 0-1.387-.1a2 2 0 0 1-1.113-.913c-.159-.28-.23-.633-.37-1.34L9 19" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5V11" />
    </g>
  </svg>
);

// Available AI models configuration
const AI_MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    icon: Bulb,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    icon: Sparkles,
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    icon: Zap,
  },
  {
    id: "llama-3-1",
    name: "Llama 3.1",
    icon: Bot,
  },
] as const;

// Message type definition
interface ChatMessage {
  id: number;
  message: string;
  isFromUser: boolean;
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
  side = "bottom",
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
      className="bg-muted !outline-foreground/5 rounded-xl border-none p-1 !outline-[1px]"
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
            className="focus:bg-foreground/5 focus:text-foreground text-foreground/50 flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 py-2"
          >
            {IconComponent && <IconComponent className="size-4" />}
            {item.label}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuContent>
  </DropdownMenu>
);

const Skiper81 = () => {
  // Input and UI state
  const [userInput, setUserInput] = useState("");
  const [isChatActive, setIsChatActive] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isDeepMindMode, setIsDeepMindMode] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState("GPT-4o");

  // File upload state
  const [uploadedImagePreview, setUploadedImagePreview] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat messages state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageElementsRef = useRef<HTMLDivElement[]>([]);

  // Animation state
  const [messageIndex, setMessageIndex] = useState(0);
  const scrollMarginTop = useMotionValue(0);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  // File upload handlers
  const handleImageRemove = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadedImagePreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      setUploadedImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAttachmentMenuClick = (menuItem: string) => {
    if (menuItem === "Images") {
      fileInputRef.current?.click();
    }
  };

  const handleAiModelSelect = (modelName: string) => {
    setSelectedAiModel(modelName);
  };

  // Cleanup uploaded image URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (uploadedImagePreview) {
        URL.revokeObjectURL(uploadedImagePreview);
      }
    };
  }, [uploadedImagePreview]);

  // Handle message submission
  const handleMessageSubmit = () => {
    if (userInput.trim() === "") {
      return;
    }

    setIsChatActive(true);
    setUploadedImagePreview(null);
    setUserInput("");
    setMessageIndex((currentIndex) =>
      currentIndex === 0 ? currentIndex + 1 : currentIndex + 2,
    );

    const newMessages = [
      ...chatMessages,
      {
        id: chatMessages.length + 1,
        message: userInput,
        isFromUser: true,
      },
      {
        id: chatMessages.length + 2,
        message: "I dunnoo 😭",
        isFromUser: false,
      },
    ];
    setChatMessages(newMessages);
  };

  // Auto-scroll to latest message when new messages are added
  useLayoutEffect(() => {
    const currentMessageCount = chatMessages.length;
    const calculatedScrollMargin =
      currentMessageCount > 1
        ? window.innerHeight -
        (messageElementsRef.current[currentMessageCount - 2]?.clientHeight ||
          0) -
        (inputContainerRef.current?.clientHeight || 0)
        : 0;

    scrollMarginTop.set(calculatedScrollMargin);

    // Smooth scroll to the latest message
    requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
  }, [chatMessages, messageIndex, scrollMarginTop]);

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <div className="bg-background flex h-full w-full items-center justify-center rounded-3xl border py-4">
        {!isChatActive && (
          <TextShimmerComponent
            spread={22}
            className="absolute bottom-20 select-none text-center text-[14vw] font-semibold leading-[11vw]! tracking-tighter opacity-[0.025] dark:opacity-[0.025]"
          >
            Skiper llm 0.3
          </TextShimmerComponent>
        )}

        {/* Chat Messages Container */}
        {isChatActive && (
          <motion.div className="no-scroll flex h-screen max-w-3xl flex-1 flex-col overflow-scroll scroll-smooth px-3 py-6">
            {chatMessages.map((message, messageId) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{ delay: (1 * messageId) % 2 }}
                ref={(element) => {
                  if (element) {
                    messageElementsRef.current[messageId] = element;
                  }
                }}
                key={messageId}
                className={cn(
                  "bg-muted my-2 w-fit max-w-xs wrap-break-word rounded-2xl px-4 py-2",
                  message.isFromUser ? "self-end" : "self-start",
                )}
              >
                {message.message}
              </motion.div>
            ))}
            <motion.div
              ref={messageEndRef}
              style={{ marginTop: scrollMarginTop }}
            />
          </motion.div>
        )}

        {/* Input Container */}
        <motion.div
          ref={inputContainerRef}
          initial={false}
          animate={{
            y: isChatActive ? "0%" : "50%",
            bottom: isChatActive ? "0%" : "50%",
          }}
          transition={SPRING_CONFIG}
          className="rounded-t-4xl fixed w-full max-w-3xl gap-1 px-3 pb-3"
        >
          <div className="bg-muted/60 border-foreground/5 rounded-2xl border p-1">
            {/* Text Input Area */}
            <div className="relative">
              <Textarea
                value={userInput}
                autoFocus
                placeholder=""
                className="max-h-52 w-full resize-none rounded-none border-none bg-transparent! p-4 text-base! leading-[1.2] shadow-none focus-visible:outline-0 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleMessageSubmit();
                  }
                }}
                onChange={(e) => {
                  setUserInput(e.target.value);
                }}
              />
              {!userInput && (
                <div className="absolute left-4 top-3.5">
                  <AnimatedPlaceholder isSearchMode={isSearchMode} />
                </div>
              )}
            </div>

            {/* Control Buttons Row */}
            <div className="bg-background border-muted flex justify-between rounded-2xl border p-1">
              <div className="flex items-center gap-1">
                {/* File Upload Section */}
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <CustomDropdownMenu
                    trigger={
                      <button
                        className={cn(
                          BUTTON_BASE_STYLES,
                          "group flex w-10 items-center justify-center px-0",
                          uploadedImagePreview
                            ? BUTTON_ACTIVE_STYLES
                            : "text-foreground hover:bg-primary/70",
                        )}
                      >
                        <Plus className="size-5 transition-all ease-in-out group-data-[state=open]:rotate-45" />
                      </button>
                    }
                    items={[
                      {
                        label: "Images",
                        icon: ImageIcon,
                        onClick: () => handleAttachmentMenuClick("Images"),
                      },
                      {
                        label: "Documents",
                        icon: BookOpen,
                        onClick: () => handleAttachmentMenuClick("Documents"),
                      },
                      {
                        label: "Connect Apps",
                        icon: LayoutGrid,
                        onClick: () =>
                          handleAttachmentMenuClick("Connect Apps"),
                      },
                    ]}
                  />

                  {/* Image Preview */}
                  {uploadedImagePreview && (
                    <div
                      className={cn(
                        "bg-muted/50 absolute h-24 w-32 rounded-2xl p-1",
                        isChatActive
                          ? "-bottom-2 -left-3 -translate-x-full"
                          : "-left-2 top-14",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="size-full rounded-xl object-cover"
                        src={uploadedImagePreview}
                        alt="Uploaded image preview"
                      />
                      <button
                        onClick={handleImageRemove}
                        className="bg-muted shadow-3xl absolute -left-1 -top-1 flex size-5 rotate-45 cursor-pointer items-center justify-center rounded-xl transition-all ease-in-out hover:bg-sky-100 hover:text-sky-500 active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Search Mode Toggle Button */}
                <motion.button
                  initial={false}
                  animate={{
                    width: !isSearchMode ? "40px" : "95px",
                  }}
                  type="button"
                  onClick={() => {
                    setIsSearchMode(!isSearchMode);
                  }}
                  className={cn(
                    BUTTON_BASE_STYLES,
                    "relative overflow-hidden px-0",
                    isSearchMode ? BUTTON_ACTIVE_STYLES : "bg-muted/50",
                  )}
                >
                  <div className="flex size-10 flex-shrink-0 items-center justify-center">
                    <motion.div
                      animate={{
                        rotate: isSearchMode ? 180 : 0,
                      }}
                    >
                      <Globe className="size-4" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isSearchMode && (
                      <motion.span
                        initial={{ x: -14, opacity: 0 }}
                        animate={{ x: -12, opacity: 1 }}
                        exit={{ x: -14, opacity: 0 }}
                        className="flex-shrink-0 overflow-hidden whitespace-nowrap text-sm"
                      >
                        Search
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                {/* DeepMind Mode Toggle Button */}
                <motion.button
                  initial={false}
                  animate={{
                    width: !isDeepMindMode ? "40px" : "116px",
                  }}
                  type="button"
                  onClick={() => {
                    setIsDeepMindMode(!isDeepMindMode);
                  }}
                  className={cn(
                    BUTTON_BASE_STYLES,
                    "relative overflow-hidden px-0",
                    isDeepMindMode ? BUTTON_ACTIVE_STYLES : "bg-muted/50",
                  )}
                >
                  <div className="flex size-10 flex-shrink-0 items-center justify-center">
                    <Brain className="size-4" />
                  </div>

                  <AnimatePresence mode="popLayout">
                    {isDeepMindMode && (
                      <motion.span
                        initial={{ x: -14, opacity: 0 }}
                        animate={{ x: -12, opacity: 1 }}
                        exit={{ x: -14, opacity: 0 }}
                        className="flex-shrink-0 overflow-hidden whitespace-nowrap text-sm"
                      >
                        DeepMind
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                {/* AI Model Selection Dropdown */}
                <CustomDropdownMenu
                  trigger={
                    <button
                      className={cn(
                        BUTTON_BASE_STYLES,
                        "flex items-center gap-2",
                      )}
                    >
                      {(() => {
                        const selectedModelData = AI_MODELS.find(
                          (model) => model.name === selectedAiModel,
                        );
                        const IconComponent = selectedModelData?.icon;
                        return IconComponent ? (
                          <IconComponent className="size-4" />
                        ) : null;
                      })()}
                      {selectedAiModel}
                    </button>
                  }
                  items={AI_MODELS.map((model) => ({
                    label: model.name,
                    icon: model.icon,
                    onClick: () => handleAiModelSelect(model.name),
                  }))}
                />
              </div>
              {/* Send Button */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleMessageSubmit}
                  className={cn(
                    BUTTON_BASE_STYLES,
                    "flex w-10 items-center justify-center p-0 transition-all ease-in-out active:scale-95",
                    userInput && BUTTON_ACTIVE_STYLES,
                    !userInput && "cursor-not-allowed",
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export { Skiper81 };

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
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
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

// https://x.com/maybepratikk/status/1970398984822009936
