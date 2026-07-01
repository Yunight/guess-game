import { FC, ReactNode } from "react";
import { DialogContent } from "./dialog";
import { cn } from "@/lib/utils";

interface ScrollableDialogProps {
	children: ReactNode;
	className?: string;
}

export const ScrollableDialog: FC<ScrollableDialogProps> = ({ children, className }) => {
	return (
		<DialogContent
			className={cn(
				"max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent",
				className,
			)}
		>
			{children}
		</DialogContent>
	);
};
