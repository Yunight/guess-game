import { useMultiplayerGameController } from "@/hooks/useMultiplayerGameController";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import type { FC } from "react";
import { MultiplayerLobby } from "./MultiplayerLobby";
import { MultiplayerGameScreen } from "./MultiplayerGameScreen";
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

const MultiplayerLobbyView: FC<MultiplayerLobbyViewProps> = ({
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
				isHost={isHost}
				isJoined={isJoined}
				localPlayerName={localPlayerName}
				onJoin={onJoin}
				onStart={controller.handleStartGame}
				isStarting={controller.isStartingGame}
				startError={controller.startGameError}
				joinError={joinError}
				isJoining={isJoining}
			/>
		</MultiplayerPageShell>
	);
};

interface MultiplayerGuestJoinViewProps {
	room: MultiplayerRoom;
	onJoin: (playerName: string) => Promise<void>;
	joinError: string | null;
	isJoining: boolean;
}

const MultiplayerGuestJoinView: FC<MultiplayerGuestJoinViewProps> = ({
	room,
	onJoin,
	joinError,
	isJoining,
}) => (
	<MultiplayerPageShell>
		<MultiplayerLobby
			room={room}
			isHost={false}
			isJoined={false}
			localPlayerName={null}
			onJoin={onJoin}
			onStart={async () => undefined}
			isStarting={false}
			startError={null}
			joinError={joinError}
			isJoining={isJoining}
		/>
	</MultiplayerPageShell>
);

interface MultiplayerActiveGameViewProps {
	room: MultiplayerRoom;
	localPlayerId: string;
	isHost: boolean;
}

const MultiplayerActiveGameView: FC<MultiplayerActiveGameViewProps> = ({
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

export { MultiplayerLobbyView, MultiplayerGuestJoinView, MultiplayerActiveGameView };
