"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import Image from "next/image";

interface Output {
    model: string;
    requestId: string;
    result: any;
    timestamp: string;
}

interface MobileOutputDisplayProps {
    outputs: Output[];
}

export function MobileOutputDisplay({ outputs }: MobileOutputDisplayProps) {
    const renderMedia = (result: any) => {
        const mediaElements: JSX.Element[] = [];

        // Handle images
        if (result.images && Array.isArray(result.images)) {
            result.images.forEach((image: any, index: number) => {
                if (image.url || image.stored_url) {
                    mediaElements.push(
                        <div key={`image-${index}`} className="relative group">
                            <Image
                                src={image.stored_url || image.url}
                                alt={`Generated image ${index + 1}`}
                                width={600}
                                height={600}
                                className="w-full h-auto object-cover rounded-lg"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    if (image.stored_url && image.url && e.currentTarget.src !== image.url) {
                                        e.currentTarget.src = image.url;
                                    }
                                }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-active:opacity-100">
                                <div className="flex gap-2">
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        onClick={() => window.open(image.stored_url || image.url, "_blank")}
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = image.stored_url || image.url;
                                            link.download = `generated-image-${index + 1}.jpg`;
                                            link.click();
                                        }}
                                    >
                                        <Download className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                }
            });
        }

        // Handle single image
        if (result.image && !result.images) {
            const image = result.image;
            if (image.url || image.stored_url) {
                mediaElements.push(
                    <div key="single-image" className="relative group">
                        <Image
                            src={image.stored_url || image.url}
                            alt="Generated image"
                            width={600}
                            height={600}
                            className="w-full h-auto object-cover rounded-lg"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                if (image.stored_url && image.url && e.currentTarget.src !== image.url) {
                                    e.currentTarget.src = image.url;
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-active:opacity-100">
                            <div className="flex gap-2">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => window.open(image.stored_url || image.url, "_blank")}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = image.stored_url || image.url;
                                        link.download = "generated-image.jpg";
                                        link.click();
                                    }}
                                >
                                    <Download className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        // Handle video
        if (result.video) {
            const video = result.video;
            if (video.url || video.stored_url) {
                mediaElements.push(
                    <div key="video" className="relative">
                        <video
                            src={video.stored_url || video.url}
                            controls
                            playsInline
                            className="w-full h-auto rounded-lg"
                            onError={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                                if (video.stored_url && video.url && e.currentTarget.src !== video.url) {
                                    e.currentTarget.src = video.url;
                                }
                            }}
                        />
                        <div className="flex gap-2 mt-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => window.open(video.stored_url || video.url, "_blank")}
                                className="flex-1"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = video.stored_url || video.url;
                                    link.download = "generated-video.mp4";
                                    link.click();
                                }}
                                className="flex-1"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                );
            }
        }

        // Handle audio
        if (result.audio) {
            const audio = result.audio;
            if (audio.url || audio.stored_url) {
                mediaElements.push(
                    <div key="audio" className="p-4 bg-muted rounded-lg">
                        <audio
                            src={audio.stored_url || audio.url}
                            controls
                            className="w-full"
                            onError={(e: React.SyntheticEvent<HTMLAudioElement>) => {
                                if (audio.stored_url && audio.url && e.currentTarget.src !== audio.url) {
                                    e.currentTarget.src = audio.url;
                                }
                            }}
                        />
                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(audio.stored_url || audio.url, "_blank")}
                                className="flex-1"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = audio.stored_url || audio.url;
                                    link.download = "generated-audio.wav";
                                    link.click();
                                }}
                                className="flex-1"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                );
            }
        }

        // Handle arrays of videos/audios
        if (result.videos && Array.isArray(result.videos)) {
            result.videos.forEach((video: any, index: number) => {
                if (video.url || video.stored_url) {
                    mediaElements.push(
                        <div key={`video-${index}`} className="relative">
                            <video
                                src={video.stored_url || video.url}
                                controls
                                playsInline
                                className="w-full h-auto rounded-lg"
                                onError={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                                    if (video.stored_url && video.url && e.currentTarget.src !== video.url) {
                                        e.currentTarget.src = video.url;
                                    }
                                }}
                            />
                        </div>
                    );
                }
            });
        }

        if (result.audios && Array.isArray(result.audios)) {
            result.audios.forEach((audio: any, index: number) => {
                if (audio.url || audio.stored_url) {
                    mediaElements.push(
                        <div key={`audio-${index}`} className="p-3 bg-muted rounded-lg">
                            <audio
                                src={audio.stored_url || audio.url}
                                controls
                                className="w-full"
                                onError={(e: React.SyntheticEvent<HTMLAudioElement>) => {
                                    if (audio.stored_url && audio.url && e.currentTarget.src !== audio.url) {
                                        e.currentTarget.src = audio.url;
                                    }
                                }}
                            />
                        </div>
                    );
                }
            });
        }

        return mediaElements;
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    if (outputs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">

                    <h3 className="text-lg font-technical mb-2">
                        No Outputs Yet
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Generated content will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-6">
                {outputs.map((output, index) => (
                    <div
                        key={`${output.requestId}-${index}`}
                        className="bg-card border rounded-lg overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="default" className="text-sm">
                                    {output.model.split("/").pop()}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatTimestamp(output.timestamp)}
                            </div>
                        </div>

                        {/* Media Content */}
                        <div className="p-4 space-y-4">
                            {renderMedia(output.result)}
                        </div>

                        {/* Footer */}
                        <div className="px-4 pb-4">
                            <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground py-2">
                                    Request ID: {output.requestId.slice(-8)}
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                                    {JSON.stringify(output.result, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


