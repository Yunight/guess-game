import type { ErrorInfo } from "react";
import { getErrorBoundaryTitle, shouldShowMobileNetworkHelp } from "./errorBoundaryFallbackLogic";

interface ErrorBoundaryFallbackProps {
	error: Error | undefined;
	errorInfo: ErrorInfo | undefined;
	isDev: boolean;
	onRetry: () => void;
	onRefresh: () => void;
	userAgent: string;
}

export const ErrorBoundaryFallback = ({
	error,
	errorInfo,
	isDev,
	onRetry,
	onRefresh,
	userAgent,
}: ErrorBoundaryFallbackProps): JSX.Element => {
	const showMobileNetworkHelp = shouldShowMobileNetworkHelp(userAgent, error?.message);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 flex items-center justify-center">
			<div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
				<div className="text-6xl mb-4">⚠️</div>
				<h2 className="text-xl font-bold mb-4 text-gray-800">{getErrorBoundaryTitle(userAgent)}</h2>

				{showMobileNetworkHelp ? (
					<div className="space-y-3 text-sm text-gray-600">
						<p>The app failed to load properly on your device.</p>
						<p className="font-semibold">Quick fixes to try:</p>
						<ul className="text-left space-y-1">
							<li>• Check your internet connection</li>
							<li>• Close and reopen the app</li>
							<li>• Clear your browser cache</li>
							<li>• Try using Safari instead of other browsers</li>
						</ul>
					</div>
				) : (
					<p className="text-gray-600 mb-4">
						An unexpected error occurred. Please try refreshing the page.
					</p>
				)}

				<div className="flex flex-col gap-2 mt-6">
					<button
						type="button"
						onClick={onRetry}
						className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
					>
						Try Again
					</button>
					<button
						type="button"
						onClick={onRefresh}
						className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
					>
						Refresh Page
					</button>
				</div>

				{isDev && error && (
					<details className="mt-4 text-left">
						<summary className="cursor-pointer text-sm text-gray-500">
							Technical Details (Development)
						</summary>
						<pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
							{error.toString()}
							{errorInfo?.componentStack}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
};
