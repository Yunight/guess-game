import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import type { FC } from "react";
import { MultiplayerLobby } from "./MultiplayerLobby";
import { MultiplayerPageShell } from "./MultiplayerPageShell";

interface MultiplayerGuestJoinViewProps {
	room: MultiplayerRoom;
	onJoin: (playerName: string) => Promise<void>;
	joinError: string | null;
	isJoining: boolean;
}

export const MultiplayerGuestJoinView: FC<MultiplayerGuestJoinViewProps> = ({
	room,
	onJoin,
	joinError,
	isJoining,
}) => (
	<MultiplayerPageShell>
		<MultiplayerLobby
			room={room}
			playerRole="guest"
			joinState="not_joined"
			localPlayerName={null}
			onJoin={onJoin}
			onStart={async () => undefined}
			startState="idle"
			startError={null}
			joinError={joinError}
			joinRequestState={isJoining ? "joining" : "idle"}
		/>
	</MultiplayerPageShell>
);
