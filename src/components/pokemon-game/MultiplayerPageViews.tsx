import { LanguageToggle } from "@/components/ui/language-toggle";
import { Button } from "@/components/ui/button";
import { useMultiplayerGameController } from "@/hooks/useMultiplayerGameController";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import { ArrowLeft } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MultiplayerLobby } from "./MultiplayerLobby";
import { MultiplayerGameScreen } from "./MultiplayerGameScreen";

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
	const { t } = useTranslation();
	const controller = useMultiplayerGameController({
		room,
		localPlayerId,
		isHost,
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4">
			<div className="absolute top-4 left-4 right-4 flex justify-between items-center">
				<Link to="/">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="w-4 h-4 mr-1" />
						{t("backToMenu")}
					</Button>
				</Link>
				<LanguageToggle />
			</div>
			<div className="flex items-center justify-center min-h-screen pt-16">
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
			</div>
		</div>
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
}) => {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4">
			<div className="absolute top-4 left-4 right-4 flex justify-between items-center">
				<Link to="/">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="w-4 h-4 mr-1" />
						{t("backToMenu")}
					</Button>
				</Link>
				<LanguageToggle />
			</div>
			<div className="flex items-center justify-center min-h-screen pt-16">
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
			</div>
		</div>
	);
};

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
