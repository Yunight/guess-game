import { Button } from "@/components/ui/button";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";
import { createRoomPlayerId } from "@/services/multiplayerPlayerId";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { MultiplayerGameOver } from "./MultiplayerGameOver";
import {
	MultiplayerActiveGameView,
	MultiplayerGuestJoinView,
	MultiplayerLobbyView,
} from "./MultiplayerPageViews";

const MultiplayerPage: FC = () => {
	const { roomId } = useParams<{ roomId: string }>();
	const { t } = useTranslation();
	const {
		room,
		isLoading,
		error,
		localPlayerId,
		isHost,
		isJoined,
		localPlayerName,
		opponentName,
		joinMultiplayerRoom,
	} = useMultiplayerRoom({ roomId });

	const [joinError, setJoinError] = useState<string | null>(null);
	const [isJoining, setIsJoining] = useState(false);

	const handleJoin = async (playerName: string): Promise<void> => {
		setJoinError(null);
		setIsJoining(true);
		try {
			if (roomId) {
				createRoomPlayerId(roomId);
			}
			await joinMultiplayerRoom(playerName);
			localStorage.setItem("pokemonGamePlayerName", playerName);
		} catch (joinErr: unknown) {
			if (joinErr instanceof Error) {
				setJoinError(joinErr.message);
			} else {
				setJoinError("multiplayerJoinFailed");
			}
		} finally {
			setIsJoining(false);
		}
	};

	if (!roomId) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>{t("multiplayerRoomNotFound")}</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
				<div className="pokeball-loading">
					<div className="outer-circle" />
					<div className="middle-line" />
					<div className="center-circle" />
				</div>
			</div>
		);
	}

	if (!room) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-100 to-blue-200 p-4">
				<p className="text-lg text-gray-700">
					{t(error ?? "multiplayerRoomNotFound")}
				</p>
				<Link to="/">
					<Button>{t("backToMenu")}</Button>
				</Link>
			</div>
		);
	}

	if (!localPlayerId || !isJoined) {
		return (
			<MultiplayerGuestJoinView
				room={room}
				onJoin={handleJoin}
				joinError={joinError}
				isJoining={isJoining}
			/>
		);
	}

	if (room.status === "waiting") {
		return (
			<MultiplayerLobbyView
				room={room}
				localPlayerId={localPlayerId}
				isHost={isHost}
				isJoined={isJoined}
				localPlayerName={localPlayerName}
				onJoin={handleJoin}
				joinError={joinError}
				isJoining={isJoining}
			/>
		);
	}

	if (room.status === "finished") {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 flex items-center justify-center">
				<MultiplayerGameOver
					room={room}
					localPlayerId={localPlayerId}
					localPlayerName={localPlayerName ?? ""}
					opponentName={opponentName ?? ""}
				/>
			</div>
		);
	}

	return (
		<MultiplayerActiveGameView
			room={room}
			localPlayerId={localPlayerId}
			isHost={isHost}
		/>
	);
};

export default MultiplayerPage;
