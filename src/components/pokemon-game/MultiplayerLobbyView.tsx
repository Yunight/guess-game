import { useMultiplayerGameController } from "@/hooks/useMultiplayerGameController";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import type { FC } from "react";
import { MultiplayerLobby } from "./MultiplayerLobby";
import { MultiplayerPageShell } from "./MultiplayerPageShell";

interface MultiplayerLobbyViewProps {
	room: MultiplayerRoom;
	localPlayerId: string;
	isHost: boolean;
	isJoined: boolean;
	localPlayerName: string | null;
	onJoin: (playerName: string) => Promise<void>;
	joinError: string | null;
	isJoining: boolean;
}

export const MultiplayerLobbyView: FC<MultiplayerLobbyViewProps> = ({
	room,
	localPlayerId,
	isHost,
	isJoined,
	localPlayerName,
	onJoin,
	joinError,
	isJoining,
}) => {
	const controller = useMultiplayerGameController({
		room,
		localPlayerId,
		isHost,
	});

	return (
		<MultiplayerPageShell>
			<MultiplayerLobby
				room={room}
				playerRole={isHost ? "host" : "guest"}
				joinState={isJoined ? "joined" : "not_joined"}
				localPlayerName={localPlayerName}
				onJoin={onJoin}
				onStart={controller.handleStartGame}
				startState={controller.isStartingGame ? "starting" : "idle"}
				startError={controller.startGameError}
				joinError={joinError}
				joinRequestState={isJoining ? "joining" : "idle"}
			/>
		</MultiplayerPageShell>
	);
};
