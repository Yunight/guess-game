import { GuessInput, type GuessInputProps } from "./GuessInput";

export const GameScreenInputArea = (props: GuessInputProps): JSX.Element => (
	<div className="flex items-center gap-4 mx-2 mt-4">
		<div className="w-12 h-12 bg-gray-800 rounded-full relative shadow-inner">
			<div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-4 bg-gray-800">
				<div className="absolute top-0 left-0 right-0 h-4 bg-gray-800 rounded-sm shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 transition-all" />
				<div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-800 rounded-sm shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 transition-all" />
			</div>
			<div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-4 bg-gray-800">
				<div className="absolute left-0 top-0 bottom-0 w-4 bg-gray-800 rounded-sm shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 transition-all" />
				<div className="absolute right-0 top-0 bottom-0 w-4 bg-gray-800 rounded-sm shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 transition-all" />
			</div>
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-700 rounded-full" />
		</div>

		<div className="flex-1 bg-gradient-to-br from-green-300 to-green-400 rounded-lg p-2 shadow-inner">
			<GuessInput {...props} />
		</div>
	</div>
);
