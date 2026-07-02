import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PokemonDisplayFrameProps {
	children: ReactNode;
	className?: string;
	contentClassName?: string;
}

export const PokemonDisplayFrame = ({
	children,
	className,
	contentClassName,
}: PokemonDisplayFrameProps): ReactNode => (
	<div
		className={cn(
			"relative bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden",
			className,
		)}
	>
		<div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine" />
		<div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg animate-corner-pulse" />
		<div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg animate-corner-pulse-delay-1" />
		<div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg animate-corner-pulse-delay-2" />
		<div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg animate-corner-pulse-delay-3" />
		<div className="absolute inset-0 pointer-events-none">
			<div
				className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-1"
				style={{ top: "20%", left: "30%" }}
			/>
			<div
				className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-2"
				style={{ top: "70%", left: "80%" }}
			/>
			<div
				className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-3"
				style={{ top: "40%", left: "60%" }}
			/>
		</div>
		<div className={cn("relative z-10", contentClassName)}>{children}</div>
	</div>
);
