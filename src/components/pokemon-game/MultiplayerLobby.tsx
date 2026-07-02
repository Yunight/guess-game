import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGenerationI18nKey } from "@/components/pokemon-game/generations";
import { getMultiplayerShareUrl } from "@/services/multiplayerRoomService";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import { Check, Copy, Users } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";

interface MultiplayerLobbyProps {
	room: MultiplayerRoom;
	playerRole: "host" | "guest";
	joinState: "joined" | "not_joined";
	localPlayerName: string | null;
	onJoin: (playerName: string) => Promise<void>;
	onStart: () => Promise<void>;
	startState: "idle" | "starting";
	startError: string | null;
	joinError: string | null;
	joinRequestState: "idle" | "joining";
}

export const MultiplayerLobby: FC<MultiplayerLobbyProps> = ({
	room,
	playerRole,
	joinState,
	localPlayerName,
	onJoin,
	onStart,
	startState,
	startError,
	joinError,
	joinRequestState,
}) => {
	const { t } = useTranslation();
	const isHost = playerRole === "host";
	const isJoined = joinState === "joined";
	const isStarting = startState === "starting";
	const isJoining = joinRequestState === "joining";
	const [joinName, setJoinName] = useState(
		() => localStorage.getItem("pokemonGamePlayerName") ?? "",
	);
	const [copied, setCopied] = useState(false);

	const shareUrl = getMultiplayerShareUrl(room.id);

	const handleCopyLink = async (): Promise<void> => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			return;
		}
	};

	const handleJoinClick = (): void => {
		if (!joinName.trim()) {
			return;
		}
		void onJoin(joinName.trim());
	};

	return (
		<div className="w-full max-w-lg mx-auto bg-red-500 rounded-3xl p-6 shadow-2xl border-4 border-white/20">
			<div className="text-center mb-6">
				<div className="flex items-center justify-center gap-2 mb-2">
					<Users className="w-8 h-8 text-white" />
					<h1 className="text-3xl font-pokemon text-white">{t("multiLobby")}</h1>
				</div>
				<p className="text-white/80 text-sm">{t("multiLobbySubtitle")}</p>
			</div>

			<div className="bg-white/95 rounded-xl p-4 space-y-4">
				<div className="text-center">
					<p className="text-xs text-gray-500 uppercase tracking-wide">{t("roomId")}</p>
					<p className="text-2xl font-mono font-bold text-gray-800">{room.id}</p>
				</div>

				<div className="flex gap-2">
					<Input readOnly value={shareUrl} className="text-sm bg-gray-50" />
					<Button
						type="button"
						variant="outline"
						onClick={() => void handleCopyLink()}
						className="shrink-0"
					>
						{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
					</Button>
				</div>
				{copied && <p className="text-sm text-green-600 text-center">{t("linkCopied")}</p>}

				<div className="border-t pt-4">
					<p className="text-sm text-gray-500 mb-2">{t("pokemonGeneration")}</p>
					<p className="font-semibold text-gray-800">
						{t(getGenerationI18nKey(room.selectedGeneration.startId))}
					</p>
					<p className="text-xs text-red-500 mt-1">{t("multiHardOnly")}</p>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
						<div>
							<p className="text-xs text-blue-600">{t("host")}</p>
							<p className="font-bold text-gray-800">{room.hostPlayer.name}</p>
						</div>
						{isHost && (
							<span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
								{t("you")}
							</span>
						)}
					</div>

					<div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 border border-purple-200">
						<div>
							<p className="text-xs text-purple-600">{t("guest")}</p>
							{room.guestPlayer ? (
								<p className="font-bold text-gray-800">{room.guestPlayer.name}</p>
							) : (
								<p className="text-gray-400 italic">{t("waitingForGuest")}</p>
							)}
						</div>
						{room.guestPlayer && localPlayerName === room.guestPlayer.name && (
							<span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
								{t("you")}
							</span>
						)}
					</div>
				</div>

				{!isJoined && !room.guestPlayer && (
					<div className="space-y-2 border-t pt-4">
						<p className="text-sm font-medium text-gray-700">{t("joinRoom")}</p>
						<Input
							value={joinName}
							onChange={(e) => setJoinName(e.target.value)}
							placeholder={t("enterName")}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleJoinClick();
								}
							}}
						/>
						{joinError && <p className="text-sm text-red-500">{t(joinError)}</p>}
						<Button
							className="w-full"
							onClick={handleJoinClick}
							disabled={!joinName.trim() || isJoining}
						>
							{t("joinGame")}
						</Button>
					</div>
				)}

				{isHost && (
					<div className="border-t pt-4 space-y-2">
						{startError && <p className="text-sm text-red-500">{t(startError)}</p>}
						<Button
							className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-500 to-red-600"
							onClick={() => void onStart()}
							disabled={!room.guestPlayer || isStarting}
						>
							{t("startMultiGame")}
						</Button>
						{!room.guestPlayer && (
							<p className="text-xs text-center text-gray-500">{t("shareLinkToStart")}</p>
						)}
					</div>
				)}

				{isJoined && !isHost && room.guestPlayer && (
					<p className="text-center text-sm text-gray-500 border-t pt-4">
						{t("waitingForHostStart")}
					</p>
				)}
			</div>
		</div>
	);
};
