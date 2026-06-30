import { Button } from "@/components/ui/button";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import { Trophy } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface MultiplayerGameOverProps {
	room: MultiplayerRoom;
	localPlayerId: string;
	localPlayerName: string;
	opponentName: string;
}

export const MultiplayerGameOver: FC<MultiplayerGameOverProps> = ({
	room,
	localPlayerId,
	localPlayerName,
	opponentName,
}) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const localScore = room.gameState?.scores[localPlayerId] ?? 0;
	const opponentPlayerId =
		room.hostPlayer.id === localPlayerId
			? room.guestPlayer?.id
			: room.hostPlayer.id;
	const opponentScore = opponentPlayerId
		? (room.gameState?.scores[opponentPlayerId] ?? 0)
		: 0;

	const isWinner = room.winnerId === localPlayerId;
	const isDraw = room.winnerId === null;

	return (
		<div className="w-full max-w-lg mx-auto bg-red-500 rounded-3xl p-6 shadow-2xl border-4 border-white/20 text-center">
			<Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
			<h1 className="text-3xl font-pokemon text-white mb-2">
				{isDraw ? t("multiDraw") : isWinner ? t("multiYouWin") : t("multiYouLose")}
			</h1>

			<div className="bg-white/95 rounded-xl p-6 space-y-4 mt-4">
				<div className="grid grid-cols-2 gap-4">
					<div
						className={`rounded-lg p-4 ${isWinner && !isDraw ? "bg-green-100 border-2 border-green-400" : "bg-gray-50"}`}
					>
						<p className="text-sm text-gray-500">{localPlayerName}</p>
						<p className="text-3xl font-bold font-mono">{localScore}</p>
					</div>
					<div
						className={`rounded-lg p-4 ${!isWinner && !isDraw ? "bg-green-100 border-2 border-green-400" : "bg-gray-50"}`}
					>
						<p className="text-sm text-gray-500">{opponentName}</p>
						<p className="text-3xl font-bold font-mono">{opponentScore}</p>
					</div>
				</div>

				<Button
					className="w-full h-12 text-lg font-bold"
					onClick={() => navigate("/")}
				>
					{t("backToMenu")}
				</Button>
			</div>
		</div>
	);
};
