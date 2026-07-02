import { useMultiplayerGameController } from "@/hooks/useMultiplayerGameController";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import type { FC } from "react";
import { MultiplayerGameScreen } from "./MultiplayerGameScreen";

interface MultiplayerActiveGameViewProps {
	room: MultiplayerRoom;
	localPlayerId: string;
	isHost: boolean;
}

export const MultiplayerActiveGameView: FC<MultiplayerActiveGameViewProps> = ({
	room,
	localPlayerId,
	isHost,
}) => {
	const controller = useMultiplayerGameController({
		room,
		localPlayerId,
		isHost,
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 flex items-center justify-center">
			<MultiplayerGameScreen
				controller={controller}
				localPlayerId={localPlayerId}
				roundWinnerId={room.gameState?.roundWinnerId ?? null}
			/>
		</div>
	);
};
